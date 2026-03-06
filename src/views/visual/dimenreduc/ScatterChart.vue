<template>
    <div class="scatter-container" ref="chartContainer">
        <div ref="svgRef" class="d3-chart"></div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as d3 from 'd3';
import { chartTooltip } from '@/utils/tooltip_utils/tooltip.js';

const props = defineProps({
    rawScatterData: {
        type: Object,
        default: () => ({})
    },
    highlightUpids: {
        type: Array,
        default: () => []
    }
});

const chartContainer = ref(null);
const svgRef = ref(null);
let resizeObserver = null;
let zoomBehavior = null;
let svgSelection = null;
let circlesSelection = null;

// 定义基础视觉大小 (像素)
const BASE_RADIUS = 2;       // 点的默认半径
const BASE_STROKE = 1.5;     // 边框默认粗细
const HOVER_RADIUS = 6;      // 悬浮时半径

const margin = { top: 10, right: 10, bottom: 10, left: 10 };

// ==========================================
// 🌟 核心优化：抽离高亮逻辑，支持复用
// ==========================================
const applyHighlight = (upids, animate = false) => {
    if (!circlesSelection || !svgSelection) return;

    // 获取当前缩放比例，保证边框粗细正确
    const transform = d3.zoomTransform(svgSelection.node());
    const baseK = transform.k;

    // 选择器：是否应用过渡动画
    const selection = animate
        ? circlesSelection.transition().duration(300)
        : circlesSelection;

    // 如果没有高亮数据，全部恢复原状
    if (!upids || upids.length === 0) {
        selection
            .attr("opacity", 1)
            .attr("stroke-width", BASE_STROKE / baseK);
        return;
    }

    const highlightSet = new Set(upids);

    // 应用高亮样式
    selection
        .attr("opacity", d => highlightSet.has(d.upid) ? 1 : 0.1)
        .attr("stroke-width", d => highlightSet.has(d.upid) ? (BASE_STROKE * 1.5 / baseK) : (BASE_STROKE / baseK));
};

const initChart = async () => {
    if (!props.rawScatterData || Object.keys(props.rawScatterData).length === 0) return;

    const data = Object.values(props.rawScatterData);
    d3.select(svgRef.value).selectAll('*').remove();

    const width = chartContainer.value.clientWidth;
    const height = chartContainer.value.clientHeight;

    const colorMap = {
        '0': '#f02828', // 红色
        '1': '#1283f8', // 蓝色
        '2': '#8f959e'  // 灰色
    };

    const colorScale = (label) => colorMap[String(label)] || '#999';

    const getLightSolidColor = (hex) => d3.interpolateRgb("white", hex)(0.5);

    svgSelection = d3.select(svgRef.value)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('background', '#fff');

    zoomBehavior = d3.zoom()
        .scaleExtent([0.5, 50])
        .on("zoom", handleZoom);

    svgSelection.call(zoomBehavior);

    const g = svgSelection.append('g').attr('class', 'main-group');

    const xExtent = d3.extent(data, d => d.x);
    const yExtent = d3.extent(data, d => d.y);
    const xRange = xExtent[1] - xExtent[0];
    const yRange = yExtent[1] - yExtent[0];
    const padding = 0.1;

    const xScale = d3.scaleLinear()
        .domain([xExtent[0] - xRange * padding, xExtent[1] + xRange * padding])
        .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
        .domain([yExtent[0] - yRange * padding, yExtent[1] + yRange * padding])
        .range([height - margin.bottom, margin.top]);

    circlesSelection = g.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("fill", d => getLightSolidColor(colorScale(d.label)))
        .attr("fill-opacity", 1)
        .attr("stroke", d => colorScale(d.label))
        .attr("r", BASE_RADIUS)
        .attr("stroke-width", BASE_STROKE)
        .on("mouseover", function (event, d) {
            d3.select(this).raise();
            const transform = d3.zoomTransform(svgSelection.node());
            const k = transform.k;

            d3.select(this)
                .attr("stroke-width", 2 / k)
                .attr("r", HOVER_RADIUS / Math.sqrt(k));

            const html = `
                <div><strong>upid:</strong> ${d.upid}</div>
                <div><strong>Spec:</strong> ${d.steelspec}</div>
                <div style="font-size:11px; color:#666; margin-top:2px;">${d.toc}</div>
                <div style="font-size:11px; color:#666;">Label: ${d.label}</div>
            `;
            chartTooltip.show(event, html, colorScale(d.label));
        })
        .on("mouseout", function (event, d) {
            const transform = d3.zoomTransform(svgSelection.node());
            const k = transform.k;

            // 注意这里：鼠标移出时，只恢复大小和边框，不要修改 opacity，否则会破坏高亮状态
            d3.select(this)
                .attr("stroke-width", function () {
                    // 如果当前存在高亮且是高亮项，边框要保持稍粗
                    const isHighlighted = props.highlightUpids?.includes(d.upid);
                    return isHighlighted ? (BASE_STROKE * 1.5 / k) : (BASE_STROKE / k);
                })
                .attr("r", BASE_RADIUS / Math.sqrt(k));

            chartTooltip.hide();
        });

    function handleZoom(e) {
        g.attr("transform", e.transform);
        const k = e.transform.k;
        g.selectAll("circle")
            .attr("r", BASE_RADIUS / Math.sqrt(k))
            .attr("stroke-width", function (d) {
                // 缩放时也要尊重高亮状态的粗细
                const isHighlighted = props.highlightUpids?.includes(d.upid);
                return isHighlighted ? (BASE_STROKE * 1.5 / k) : (BASE_STROKE / k);
            });
    }

    // ==========================================
    // 🌟 核心优化：图表初始化完成后，立刻应用一次高亮状态 (无动画)
    // ==========================================
    if (props.highlightUpids && props.highlightUpids.length > 0) {
        applyHighlight(props.highlightUpids, false);
    }
};

// 监听 highlightUpids 变化，使用带动画的方式应用高亮
watch(() => props.highlightUpids, (newUpids) => {
    applyHighlight(newUpids, true);
}, { deep: true });

const resetZoom = () => {
    if (svgSelection && zoomBehavior) {
        svgSelection.transition()
            .duration(750)
            .call(zoomBehavior.transform, d3.zoomIdentity);
    }
};

defineExpose({ resetZoom });

watch(() => props.rawScatterData, () => {
    nextTick(() => { initChart(); });
}, { deep: true });

// 这里不用防抖，因为 ResizeObserver 已经很敏捷了，但如果点太多卡顿可以加 requestAnimationFrame
const handleResize = () => { initChart(); };

onMounted(() => {
    initChart();
    resizeObserver = new ResizeObserver(() => handleResize());
    if (chartContainer.value) resizeObserver.observe(chartContainer.value);
});

onUnmounted(() => {
    chartTooltip.hide();
    if (resizeObserver) resizeObserver.disconnect();
});
</script>

<style scoped>
.scatter-container {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    border-radius: 4px;
}

.d3-chart {
    width: 100%;
    height: 100%;
}
</style>