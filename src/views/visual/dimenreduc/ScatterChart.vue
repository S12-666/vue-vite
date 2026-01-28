<template>
    <div class="scatter-container" ref="chartContainer">
        <div ref="svgRef" class="d3-chart"></div>

        <div ref="tooltipRef" class="scatter-tooltip" style="opacity: 0;"></div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as d3 from 'd3';

const props = defineProps({
    // 接收后端返回的原始数据对象
    rawScatterData: {
        type: Object,
        default: () => ({})
    }
});

const chartContainer = ref(null);
const svgRef = ref(null);
const tooltipRef = ref(null);
let resizeObserver = null;

// 配置项
const margin = { top: 20, right: 30, bottom: 30, left: 40 };

// 核心绘图函数
const initChart = async () => {
    // 1. 数据转换：将 Object {"0":{...}, "1":{...}} 转换为 Array [{...}, {...}]
    if (!props.rawScatterData || Object.keys(props.rawScatterData).length === 0) return;

    const data = Object.values(props.rawScatterData);

    // 清理旧图表
    d3.select(svgRef.value).selectAll('*').remove();

    // 获取容器尺寸
    const width = chartContainer.value.clientWidth;
    const height = chartContainer.value.clientHeight;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // 2. 创建 SVG
    const svg = d3.select(svgRef.value)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        // 添加缩放行为 (Zoom) 支持
        .call(d3.zoom().on("zoom", (event) => {
            g.attr("transform", event.transform);
        }))
        .append('g'); // 这里的 g 不应用 margin，我们在内部再包一层

    // 创建实际绘图区域 (用于应用 margin 和 zoom)
    // 为了让 zoom 效果更好，我们通常在 svg 上 zoom，然后变换这个 g
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // 3. 创建比例尺 (Scales)
    // X轴
    const xExtent = d3.extent(data, d => d.x);
    const xScale = d3.scaleLinear()
        .domain([xExtent[0] - 1, xExtent[1] + 1]) // 稍微留点边距
        .range([0, innerWidth]);

    // Y轴
    const yExtent = d3.extent(data, d => d.y);
    const yScale = d3.scaleLinear()
        .domain([yExtent[0] - 1, yExtent[1] + 1])
        .range([innerHeight, 0]);

    // 颜色比例尺 (根据 label 分类)
    // 获取所有唯一的 label
    const labels = Array.from(new Set(data.map(d => d.label)));
    const colorScale = d3.scaleOrdinal()
        .domain(labels)
        .range(d3.schemeSet2); // 使用 D3 内置的配色方案，也可以自定义 ['red', 'blue']

    // 4. 绘制坐标轴 (Axes)
    // X Axis
    g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).ticks(5))
        .attr("class", "axis");

    // Y Axis
    g.append("g")
        .call(d3.axisLeft(yScale).ticks(5))
        .attr("class", "axis");

    // 5. 绘制散点 (Circles)
    g.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("r", 5) // 半径，可以根据数据量调整，数据量大就小一点
        .attr("fill", d => colorScale(d.label))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .attr("opacity", 0.8)
        .style("cursor", "pointer")
        // 交互事件
        .on("mouseover", (event, d) => {
            // 高亮当前点
            d3.select(event.currentTarget)
                .transition().duration(200)
                .attr("r", 8)
                .attr("opacity", 1);

            // 显示 Tooltip
            showTooltip(event, d);
        })
        .on("mouseout", (event, d) => {
            // 还原点
            d3.select(event.currentTarget)
                .transition().duration(200)
                .attr("r", 5)
                .attr("opacity", 0.8);

            // 隐藏 Tooltip
            hideTooltip();
        });
};

// Tooltip 显示逻辑
const showTooltip = (event, d) => {
    const tooltip = d3.select(tooltipRef.value);

    // 这里是你要求展示的三个字段
    const htmlContent = `
        <div class="tip-row"><strong>UPID:</strong> ${d.upid}</div>
        <div class="tip-row"><strong>Time:</strong> ${d.toc}</div>
        <div class="tip-row"><strong>Spec:</strong> ${d.steelspec}</div>
        <div class="tip-row"><strong>Label:</strong> ${d.label}</div>
    `;

    tooltip
        .style("opacity", 1)
        .html(htmlContent)
        // 计算位置，防止超出屏幕
        .style("left", (event.layerX + 15) + "px")
        .style("top", (event.layerY - 28) + "px");
};

const hideTooltip = () => {
    d3.select(tooltipRef.value).style("opacity", 0);
};

// 监听数据变化
watch(() => props.rawScatterData, () => {
    nextTick(() => {
        initChart();
    });
}, { deep: true });

// 自适应窗口
const handleResize = () => { initChart(); };

onMounted(() => {
    initChart();
    resizeObserver = new ResizeObserver(() => {
        handleResize();
    });
    if (chartContainer.value) {
        resizeObserver.observe(chartContainer.value);
    }
});

onUnmounted(() => {
    if (resizeObserver) resizeObserver.disconnect();
});
</script>

<style scoped>
.scatter-container {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    /* 防止 Tooltip 撑开容器 */
}

.d3-chart {
    width: 100%;
    height: 100%;
}

/* Tooltip 基础样式 */
.scatter-tooltip {
    position: absolute;
    background-color: rgba(50, 50, 50, 0.9);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    pointer-events: none;
    /* 让鼠标事件穿透 tooltip，防止闪烁 */
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: opacity 0.2s;
    z-index: 10;
    min-width: 150px;
}

.tip-row {
    margin-bottom: 4px;
    white-space: nowrap;
}
</style>