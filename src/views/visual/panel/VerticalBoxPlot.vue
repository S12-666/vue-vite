<template>
    <div ref="chartContainer" class="vertical-box-container"></div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, toRaw } from 'vue';
import * as d3 from 'd3';

const props = defineProps({
    fullData: { type: Array, default: () => [] },
    activeData: { type: Array, default: () => [] }
});

const chartContainer = ref(null);

const margin = { top: 0, right: 5, bottom: 5, left: 70 };

const dimensions = [
    { key: 'tgtthick', name: 'thick', precision: 1 },
    { key: 'tgtwidth', name: 'width', precision: 1 },
    { key: 'tgtlength', name: 'length', precision: 1 },
    { key: 'dis_temp', name: 'disTemp', precision: 0 },
    { key: 'fm_temp', name: 'fmTemp', precision: 0 }
];

const calcStats = (data, key) => {
    const values = data.map(d => +d[key]).filter(v => !isNaN(v)).sort(d3.ascending);
    if (values.length === 0) return null;

    const min = d3.min(values);
    const max = d3.max(values);
    const q1 = d3.quantile(values, 0.25);
    const median = d3.quantile(values, 0.5);
    const q3 = d3.quantile(values, 0.75);

    const iqr = q3 - q1;
    const k = 1.5;

    const rawRangeMin = Math.max(min, q1 - k * iqr);
    const rawRangeMax = Math.min(max, q3 + k * iqr);

    const fmt = (v) => parseFloat(v.toFixed(3));

    const result = {
        min: fmt(min),
        q1: fmt(q1),
        median: fmt(median),
        q3: fmt(q3),
        max: fmt(max),
        rangeMin: fmt(rawRangeMin),
        rangeMax: fmt(rawRangeMax)
    };

    console.log(
        result.min, result.q1, result.median, result.q3, result.max,
        result.rangeMin, result.rangeMax
    );

    return result;
};

const initChart = async () => {
    const fullRaw = toRaw(props.fullData);
    const activeRaw = toRaw(props.activeData);

    if (!chartContainer.value) return;
    if (!fullRaw || fullRaw.length === 0) return;

    await nextTick();
    d3.select(chartContainer.value).selectAll('*').remove();

    const containerWidth = chartContainer.value.clientWidth;
    const containerHeight = chartContainer.value.clientHeight;
    const rowHeight = containerHeight / dimensions.length;

    const svg = d3.select(chartContainer.value)
        .append('svg')
        .attr('width', containerWidth)
        .attr('height', containerHeight);

    dimensions.forEach((dim, i) => {
        const g = svg.append('g').attr('transform', `translate(0, ${i * rowHeight})`);

        const fullStats = calcStats(fullRaw, dim.key);
        const hasSelection = activeRaw.length > 0 && activeRaw.length < fullRaw.length;
        const activeStats = hasSelection ? calcStats(activeRaw, dim.key) : null;

        if (!fullStats) return;

        // X轴比例尺
        const chartWidth = containerWidth - margin.left - margin.right;
        const xScale = d3.scaleLinear()
            .domain([
                fullStats.rangeMin === fullStats.rangeMax ? fullStats.min * 0.9 : fullStats.rangeMin,
                fullStats.rangeMin === fullStats.rangeMax ? fullStats.max * 1.1 : fullStats.rangeMax
            ])
            .range([0, chartWidth])
            .nice();

        const centerY = rowHeight / 2;

        // ========================================================
        // 左侧文字绘制
        // ========================================================

        // 标题
        g.append('text')
            .attr('x', 2)
            .attr('y', centerY - 6)
            .style('font-size', '12px')
            .style('font-weight', '550')
            .style('fill', '#303133')
            .style('font-family', 'Helvetica Neue, sans-serif')
            .text(dim.name);

        // 实时范围数据
        const displayStats = activeStats || fullStats;
        const isFiltered = !!activeStats;

        // 2. 【修改显示逻辑】使用配置中的 precision
        const p = dim.precision; // 获取精度 (0 或 1)

        g.append('text')
            .attr('x', 2)
            .attr('y', centerY + 8)
            .style('font-size', '11px')
            .style('fill', isFiltered ? '#409EFF' : '#909399')
            .style('font-family', 'Monaco, Consolas, monospace')
            .text(`${displayStats.min.toFixed(p)}-${displayStats.max.toFixed(p)}`);


        // ========================================================
        // 绘图区域
        // ========================================================
        const plotG = g.append('g').attr('transform', `translate(${margin.left}, 0)`);
        const axisY = centerY + 12;

        // 绘制轴线
        const xAxis = d3.axisBottom(xScale).ticks(3).tickSize(3);

        plotG.append('g')
            .attr('transform', `translate(0, ${axisY})`)
            .call(xAxis)
            .select('.domain').attr('stroke', '#EBEEF5');

        plotG.selectAll('.tick line').attr('stroke', '#E4E7ED');
        plotG.selectAll('.tick text')
            .style('fill', '#909399')
            .style('font-size', '10px');

        const drawHorizontalBox = (stats, type) => {
            const boxHeight = type === 'full' ? 16 : 8;
            const color = type === 'full' ? '#E4E7ED' : '#409EFF';
            const stroke = type === 'full' ? '#C0C4CC' : '#409EFF';

            const xDomainMin = xScale.domain()[0];
            const xDomainMax = xScale.domain()[1];

            const drawStart = Math.max(stats.min, xDomainMin);
            const drawEnd = Math.min(stats.max, xDomainMax);

            plotG.append('line')
                .attr('x1', xScale(drawStart))
                .attr('x2', xScale(drawEnd))
                .attr('y1', centerY)
                .attr('y2', centerY)
                .attr('stroke', stroke)
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', type === 'full' ? '3,3' : '0');

            const whiskerSize = type === 'full' ? 10 : 6;
            [drawStart, drawEnd].forEach(val => {
                plotG.append('line')
                    .attr('x1', xScale(val))
                    .attr('x2', xScale(val))
                    .attr('y1', centerY - whiskerSize / 2)
                    .attr('y2', centerY + whiskerSize / 2)
                    .attr('stroke', stroke)
                    .attr('stroke-width', 1.5);
            });

            const drawQ1 = Math.max(stats.q1, xDomainMin);
            const drawQ3 = Math.min(stats.q3, xDomainMax);

            if (drawQ3 > drawQ1) {
                const boxW = xScale(drawQ3) - xScale(drawQ1);
                plotG.append('rect')
                    .attr('x', xScale(drawQ1))
                    .attr('y', centerY - boxHeight / 2)
                    .attr('width', boxW)
                    .attr('height', boxHeight)
                    .attr('fill', color)
                    .attr('stroke', stroke)
                    .attr('rx', 2);
            }

            if (stats.median >= xDomainMin && stats.median <= xDomainMax) {
                plotG.append('line')
                    .attr('x1', xScale(stats.median)).attr('x2', xScale(stats.median))
                    .attr('y1', centerY - boxHeight / 2)
                    .attr('y2', centerY + boxHeight / 2)
                    .attr('stroke', type === 'full' ? '#909399' : '#fff')
                    .attr('stroke-width', 2);
            }
        };

        drawHorizontalBox(fullStats, 'full');
        if (activeStats) {
            drawHorizontalBox(activeStats, 'active');
        }
    });
};

const handleResize = () => { initChart(); };
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