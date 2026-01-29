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
    }
});

const chartContainer = ref(null);
const svgRef = ref(null);
let resizeObserver = null;
let zoomBehavior = null;
let svgSelection = null;

// 定义基础视觉大小 (像素)
const BASE_RADIUS = 2;       // 点的默认半径
const BASE_STROKE = 1.5;     // 边框默认粗细
const HOVER_RADIUS = 6;      // 悬浮时半径

const margin = { top: 10, right: 10, bottom: 10, left: 10 };

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

    const colorScale = (label) => {
        return colorMap[String(label)] || '#999';
    };

    const getLightSolidColor = (hex) => {
        return d3.interpolateRgb("white", hex)(0.5); 
    };

    svgSelection = d3.select(svgRef.value)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('background', '#fff')
        // .style('cursor', 'grab');

    // Zoom 行为定义
    zoomBehavior = d3.zoom()
        .scaleExtent([0.5, 50]) // 允许放大倍数更大，方便看清密集区
        .on("zoom", handleZoom);

    svgSelection.call(zoomBehavior);

    // 主绘图容器
    const g = svgSelection.append('g').attr('class', 'main-group');

    // 比例尺计算
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

    // 绘制散点
    const circles = g.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        // 1. 设置填充颜色：使用 colorScale，但透明度低 (0.2)
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
                // .attr("fill", colorScale(d.label))
                // // .attr("fill-opacity", 1) // 悬浮时填充变实
                // .attr("stroke", colorScale(d.label))
                .attr("stroke-width", 2 / k)
                .attr("r", HOVER_RADIUS / Math.sqrt(k)); // 悬浮时稍微变大

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

            d3.select(this)
                // .attr("fill-opacity", 0.2) // 还原透明度
                // .attr("fill", getLightSolidColor(colorScale(d.label)))
                // .attr("stroke", colorScale(d.label)) // 还原为本来的边框颜色
                .attr("stroke-width", BASE_STROKE / k) // 还原边框粗细
                .attr("r", BASE_RADIUS / Math.sqrt(k)); // 还原半径

            chartTooltip.hide();
        });

    function handleZoom(e) {
        g.attr("transform", e.transform);
        const k = e.transform.k;
        g.selectAll("circle")
            .attr("r", BASE_RADIUS / Math.sqrt(k))
            .attr("stroke-width", BASE_STROKE / k); // 边框建议直接除以 k，防止太粗
    }
};

const resetZoom = () => {
    if (svgSelection && zoomBehavior) {
        svgSelection.transition()
            .duration(750)
            .call(zoomBehavior.transform, d3.zoomIdentity);
    }
};

defineExpose({
    resetZoom
});

watch(() => props.rawScatterData, () => {
    nextTick(() => { initChart(); });
}, { deep: true });

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