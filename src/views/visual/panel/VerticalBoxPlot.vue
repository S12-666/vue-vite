<template>
    <div ref="chartContainer" class="vertical-box-container"></div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, toRaw } from 'vue';
import * as d3 from 'd3';

const props = defineProps({
    // 全量数据 (用于画灰色背景箱)
    fullData: { type: Array, default: () => [] },
    // 选中数据 (用于画高亮彩色箱)
    activeData: { type: Array, default: () => [] }
});

const chartContainer = ref(null);
const margin = { top: 10, right: 30, bottom: 20, left: 120 }; // 左侧留 120px 给文字标签

// 定义指标配置
const dimensions = [
  { key: 'tgtthick',  name: '目标厚度 (mm)' }, // 后端是 tgtthick
  { key: 'tgtwidth',  name: '目标宽度 (m)' },  // 后端是 tgtwidth (注意单位，看数据2.76像是米)
  { key: 'tgtlength', name: '目标长度 (m)' },  // 后端是 tgtlength
  { key: 'dis_temp',  name: '出炉温度 (°C)' }, // 后端是 dis_temp
  { key: 'fm_temp',   name: '终轧温度 (°C)' }  // 后端是 fm_temp
];

// --- 统计学计算函数 ---
const calcStats = (data, key) => {
    // 1. 提取数值并排序
    const values = data.map(d => +d[key]).filter(v => !isNaN(v)).sort(d3.ascending);

    if (values.length === 0) return null;

    const min = d3.min(values);
    const max = d3.max(values);
    const q1 = d3.quantile(values, 0.25);
    const median = d3.quantile(values, 0.5);
    const q3 = d3.quantile(values, 0.75);

    return { min, q1, median, q3, max };
};

const initChart = async () => {
    const fullRaw = toRaw(props.fullData);
    const activeRaw = toRaw(props.activeData);

    if (!chartContainer.value) return;
    if (!fullRaw || fullRaw.length === 0) return;

    await nextTick();

    // 清空画布
    d3.select(chartContainer.value).selectAll('*').remove();

    const containerWidth = chartContainer.value.clientWidth;
    const containerHeight = chartContainer.value.clientHeight;

    // 每一行的高度
    const rowHeight = containerHeight / dimensions.length;

    const svg = d3.select(chartContainer.value)
        .append('svg')
        .attr('width', containerWidth)
        .attr('height', containerHeight);

    // --- 循环渲染每一行 ---
    dimensions.forEach((dim, i) => {
        // 创建每行的分组，向下平移
        const g = svg.append('g')
            .attr('transform', `translate(0, ${i * rowHeight})`);

        // 1. 计算统计值
        const fullStats = calcStats(fullRaw, dim.key);
        // 如果没有刷选，activeStats 为 null 或者等于 fullStats
        const hasSelection = activeRaw.length > 0 && activeRaw.length < fullRaw.length;
        const activeStats = hasSelection ? calcStats(activeRaw, dim.key) : null;

        if (!fullStats) return;

        // 2. 建立 X 轴比例尺 (横向)
        // 范围基于全量数据的 min/max，并稍微扩展 5%
        const chartWidth = containerWidth - margin.left - margin.right;
        const xScale = d3.scaleLinear()
            .domain([fullStats.min * 0.95, fullStats.max * 1.05])
            .range([0, chartWidth]);

        // 3. 绘制左侧文字标签
        g.append('text')
            .attr('x', margin.left - 15) // 靠右对齐
            .attr('y', rowHeight / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'end')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#606266')
            .text(dim.name);

        // 绘制内容区域 Group
        const plotG = g.append('g').attr('transform', `translate(${margin.left}, 0)`);

        // 4. 绘制 X 轴线 (底部)
        const xAxis = d3.axisBottom(xScale).ticks(5).tickSize(4);
        plotG.append('g')
            .attr('transform', `translate(0, ${rowHeight - margin.bottom})`)
            .call(xAxis)
            .select('.domain').attr('stroke', '#E4E7ED'); // 轴线颜色变浅

        // ----------------------------------------------------
        // 绘图辅助函数：画横向箱子
        // ----------------------------------------------------
        const drawHorizontalBox = (stats, type) => {
            const centerY = (rowHeight - margin.bottom - margin.top) / 2 + margin.top;
            const boxHeight = type === 'full' ? 24 : 14; // 全量箱子高一点，选中箱子矮一点
            const color = type === 'full' ? '#f4f4f5' : '#409EFF'; // 灰色 vs 蓝色
            const stroke = type === 'full' ? '#c8c9cc' : '#409EFF';
            const opacity = type === 'full' ? 1 : 0.9;

            // A. 中轴线 (Whisker Line) - min 到 max
            plotG.append('line')
                .attr('x1', xScale(stats.min))
                .attr('x2', xScale(stats.max))
                .attr('y1', centerY)
                .attr('y2', centerY)
                .attr('stroke', stroke)
                .attr('stroke-width', type === 'full' ? 1 : 2)
                .attr('stroke-dasharray', type === 'full' ? '4,2' : '0'); // 背景用虚线

            // B. 左右短竖线 (Whiskers)
            const whiskerSize = boxHeight / 2;
            [stats.min, stats.max].forEach(val => {
                plotG.append('line')
                    .attr('x1', xScale(val)).attr('x2', xScale(val))
                    .attr('y1', centerY - whiskerSize / 2).attr('y2', centerY + whiskerSize / 2)
                    .attr('stroke', stroke).attr('stroke-width', 2);
            });

            // C. 箱体 (Box) - Q1 到 Q3
            // 注意：svg rect width 不能为负，需计算 Math.abs
            const boxW = Math.abs(xScale(stats.q3) - xScale(stats.q1));
            plotG.append('rect')
                .attr('x', xScale(stats.q1))
                .attr('y', centerY - boxHeight / 2)
                .attr('width', boxW)
                .attr('height', boxHeight)
                .attr('fill', color)
                .attr('stroke', stroke)
                .attr('opacity', opacity)
                .attr('rx', 2); // 圆角

            // D. 中位数线 (Median)
            plotG.append('line')
                .attr('x1', xScale(stats.median)).attr('x2', xScale(stats.median))
                .attr('y1', centerY - boxHeight / 2)
                .attr('y2', centerY + boxHeight / 2)
                .attr('stroke', type === 'full' ? '#909399' : '#fff') // 选中时的中位数用白色
                .attr('stroke-width', 2);

            // 可选：显示具体数值文本(Min/Max)
            if (type === 'active') {
                // 这里可以加 text 显示具体数值
            }
        };

        // 5. 先画背景 (全量)
        drawHorizontalBox(fullStats, 'full');

        // 6. 再画前景 (选中)
        if (activeStats) {
            drawHorizontalBox(activeStats, 'active');
        }
    });
};

const handleResize = () => {
    initChart();
};

watch([() => props.fullData, () => props.activeData], initChart, { deep: false });

onMounted(() => {
    initChart();
    window.addEventListener('resize', handleResize);
});
</script>

<style scoped>
.vertical-box-container {
    width: 100%;
    height: 100%;
    position: relative;
}
</style>