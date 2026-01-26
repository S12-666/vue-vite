<template>
    <div ref="chartContainer" class="time-brush-chart"></div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, nextTick, toRaw } from 'vue';
import * as d3 from 'd3';
import { chartTooltip } from '@/utils/tooltip_utils/tooltip.js';

const util = { flagColor: ['#409eff', '#f56c6c', '#b5bac2'] };

const props = defineProps({
    chartData: {
        type: Object,
        default: () => null
    }
});

const emit = defineEmits(['timeBrushed']);
const chartContainer = ref(null);
let svgInstance = null;
let resizeObserver = null;
let resizeTimer = null;

// 顶部留白稍微增加一点，给文字更多呼吸空间
const margin = { top: 30, right: 0, bottom: 0, left: 0 };

const formatShortDate = (dateStr) => {
    if (!dateStr) return '';
    const [datePart, timePart] = dateStr.toString().split(' ');
    const [y, m, d] = datePart.split('-');
    const h = timePart ? timePart.split(':')[0] : '00';
    return `${parseInt(m)}.${parseInt(d)} ${h}`;
};

const initChart = async () => {
    const rawData = toRaw(props.chartData);
    if (!rawData || !rawData.endTimeOutput || rawData.endTimeOutput.length === 0) return;
    if (!chartContainer.value) return;

    await nextTick();
    const bbox = chartContainer.value.getBoundingClientRect();
    const width = bbox.width - margin.left - margin.right;
    const height = bbox.height - margin.top - margin.bottom;

    if (width <= 0 || height <= 0) return;

    d3.select(chartContainer.value).selectAll('svg').remove();

    // 数据准备
    const categories = rawData.endTimeOutput.slice();
    const seriesNames = ['good_flag', 'bad_flag', 'no_flag'];

    // 预先计算总数，用于初始化显示
    const totalCounts = {
        good_flag: d3.sum(rawData.good_flag || []),
        bad_flag: d3.sum(rawData.bad_flag || []),
        no_flag: d3.sum(rawData.no_flag || [])
    };

    const stackedInput = categories.map((cat, i) => ({
        category: cat,
        good_flag: rawData.good_flag?.[i] || 0,
        bad_flag: rawData.bad_flag?.[i] || 0,
        no_flag: rawData.no_flag?.[i] || 0
    }));

    const stackGen = d3.stack().keys(seriesNames);
    const stackedSeries = stackGen(stackedInput);

    const xScale = d3.scaleBand().domain(categories).range([0, width]).paddingInner(0.1).paddingOuter(0.05);
    const maxY = d3.max(stackedSeries[stackedSeries.length - 1], d => d[1]) || 0;
    const yScale = d3.scaleLinear().domain([0, maxY]).range([height, 0]);
    const colorScale = d3.scaleOrdinal().domain(seriesNames).range(util.flagColor);

    svgInstance = d3.select(chartContainer.value)
        .append('svg')
        .attr('width', '100%').attr('height', '100%')
        .attr('viewBox', `0 0 ${bbox.width} ${bbox.height}`)
        .attr('preserveAspectRatio', 'none')
        .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // 底部基准线
    svgInstance.append('line')
        .attr('x1', 0).attr('y1', height).attr('x2', width).attr('y2', height)
        .attr('stroke', '#BEBEBE').attr('stroke-width', 2).style('shape-rendering', 'crispEdges');

    const labelMap = { good_flag: 'Good', bad_flag: 'Bad', no_flag: 'No_Flag' }; // 名字可以改短点
    const legendGroup = svgInstance.append('g').attr('class', 'legend-group');

    let offsetX = 0;
    const colorBoxSize = 12;

    const gapAfterColor = 6;
    const gapNameValue = 6;
    const itemGap = 12;

    seriesNames.forEach(key => {
        const g = legendGroup.append('g')
            .attr('class', 'legend-item')
            .datum(key);

        g.append('rect')
            .attr('width', colorBoxSize).attr('height', colorBoxSize)
            .attr('rx', 2).attr('ry', 2) // 圆角稍微美化
            .attr('fill', colorScale(key))
            .attr('y', -colorBoxSize / 2 - 1); // 微调垂直居中

        const nameText = g.append('text')
            .text(labelMap[key] ?? key)
            .attr('x', colorBoxSize + gapAfterColor)
            .attr('y', 0).attr('dy', '0.35em')
            .style('font-family', '"Helvetica Neue", Helvetica, Arial, sans-serif')
            .style('font-size', '12px')
            .style('fill', '#333') // 灰色字体
            .style('font-weight', '500');

        const nameWidth = nameText.node().getComputedTextLength();

        const valueText = g.append('text')
            .attr('class', 'legend-value')
            .text(totalCounts[key])
            .attr('x', colorBoxSize + gapAfterColor + nameWidth + gapNameValue)
            .attr('y', 0).attr('dy', '0.35em')
            .style('font-size', '12px')
            .style('fill', '#333')
            .style('font-weight', '600')
            .style('font-family', '"Helvetica Neue", Helvetica, Arial, sans-serif');

        const valueWidth = valueText.node().getComputedTextLength();

        g.attr('transform', `translate(${offsetX}, 0)`);
        const itemWidth = colorBoxSize + gapAfterColor + nameWidth + gapNameValue + valueWidth;
        offsetX += itemWidth + itemGap;
    });

    const legendX = width - offsetX;
    legendGroup.attr('transform', `translate(${legendX}, ${-15})`);

    const dateLabel = svgInstance.append('text')
        .attr('class', 'date-label')
        .attr('x', legendX - 30)
        .attr('y', -15)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .style('font-size', '12px')
        .style('font-weight', '550')
        .style('fill', '#333')
        .style('font-family', '"Helvetica Neue", Helvetica, Arial, sans-serif')
        .text('DateRange: 全量数据');

    const updateStats = (selectedSet) => {
        let indices = [];

        if (!selectedSet || selectedSet.size === 0) {
            indices = categories.map((_, i) => i);
            const s = formatShortDate(categories[0]);
            const e = formatShortDate(categories[categories.length - 1]);
            dateLabel.text(`DateRange: ${s} - ${e}`);
        } else {
            categories.forEach((cat, i) => {
                if (selectedSet.has(cat)) indices.push(i);
            });
            const s = formatShortDate(categories[indices[0]]);
            const e = formatShortDate(categories[indices[indices.length - 1]]);
            dateLabel.text(`DateRange: ${s} - ${e}`);
        }
        const currentSums = { good_flag: 0, bad_flag: 0, no_flag: 0 };
        indices.forEach(idx => {
            currentSums.good_flag += (rawData.good_flag?.[idx] || 0);
            currentSums.bad_flag += (rawData.bad_flag?.[idx] || 0);
            currentSums.no_flag += (rawData.no_flag?.[idx] || 0);
        });

        legendGroup.selectAll('.legend-item').each(function (d) {
            d3.select(this).select('.legend-value')
                .text(currentSums[d]);
        });
    };

    // 初始化运行一次
    updateStats(null);

    // --- Brush 定义 ---
    const onBrushMove = (event) => {
        if (!event || !event.sourceEvent || event.type !== 'brush') return;
        const selection = event.selection;
        const allRects = svgInstance.selectAll('.series-group rect');

        if (!selection) {
            allRects.attr('fill-opacity', 1);
            updateStats(null);
            return;
        }

        const [x0, x1] = selection;
        const selectedSet = new Set();
        categories.forEach(cat => {
            const xPos = xScale(cat);
            const bw = xScale.bandwidth();
            if (xPos + bw / 2 >= x0 && xPos + bw / 2 <= x1) selectedSet.add(cat);
        });

        updateStats(selectedSet);

        allRects.attr('fill-opacity', (d, i) => {
            return selectedSet.has(categories[i % categories.length]) ? 1 : 0.3;
        });
    };

    const onBrushEnd = (event) => {
        const selection = event.selection;
        const allRects = svgInstance.selectAll('.series-group rect');

        if (!selection) {
            allRects.attr('fill-opacity', 1);
            updateStats(null);
            emit('timeBrushed', []);
            return;
        }

        const [x0, x1] = selection;
        const selectedSet = new Set();
        categories.forEach(cat => {
            const xPos = xScale(cat);
            const bw = xScale.bandwidth();
            if (xPos + bw / 2 >= x0 && xPos + bw / 2 <= x1) selectedSet.add(cat);
        });

        updateStats(selectedSet);

        allRects.attr('fill-opacity', (d, i) => {
            return selectedSet.has(categories[i % categories.length]) ? 1 : 0.3;
        });

        if (selectedSet.size > 0) {
            const sorted = [...selectedSet].sort();
            emit('timeBrushed', [sorted[0], sorted[sorted.length - 1]]);
        } else {
            updateStats(null);
            emit('timeBrushed', []);
        }
    };

    const brush = d3.brushX()
        .extent([[0, 0], [width, height]])
        .on('brush', onBrushMove)
        .on('end', onBrushEnd);

    // 先画 Brush
    svgInstance.append('g').attr('class', 'x-brush').call(brush);

    // 再画柱子
    const seriesGroup = svgInstance.selectAll('.series-group')
        .data(stackedSeries)
        .enter().append('g')
        .attr('class', 'series-group')
        .attr('fill', d => colorScale(d.key));

    seriesGroup.selectAll('rect')
        .data(d => d)
        .enter().append('rect')
        .attr('x', (d, i) => xScale(categories[i]))
        .attr('y', d => yScale(d[1]))
        .attr('height', d => yScale(d[0]) - yScale(d[1]))
        .attr('width', xScale.bandwidth())
        .on('mouseover', (event, d) => {
            const item = d.data;
            const seriesKey = d3.select(event.target.parentNode).datum().key;
            const color = colorScale(seriesKey);
            const html = `
                <div style="font-weight:600; margin-bottom:6px; font-size:13px;">${item.category}</div>
                <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                    <span style="width:8px;height:8px;border-radius:2px;background:${color};"></span>
                    <span style="color:#666">${labelMap[seriesKey]}:</span>
                    <span style="font-weight:500; color:#333">${item[seriesKey]}</span>
                </div>
                <div style="height:1px; background:rgba(0,0,0,0.15); margin:6px 0;"></div>
                <div style="display:grid; grid-template-columns: 1fr auto; gap: 8px; font-size:12px; opacity:0.9;">
                    <span>Good:</span> <span>${item.good_flag}</span>
                    <span>Bad:</span> <span>${item.bad_flag}</span>
                    <span>No_flag:</span> <span>${item.no_flag}</span>
                </div>
            `;
            chartTooltip.show(event, html);
            d3.select(event.target).attr('opacity', 0.8);
        })
        .on('mouseout', (event) => {
            chartTooltip.hide();
            d3.select(event.target).attr('opacity', 1);
        });
};

const handleResize = (entries) => {
    const entry = entries[0];
    const { width, height } = entry.contentRect;
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { initChart(); }, 100);
};

watch(() => props.chartData, (val) => { if (val) initChart(); }, { deep: true });

onMounted(() => {
    initChart();
    if (chartContainer.value) {
        resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(chartContainer.value);
    }
});
onUnmounted(() => {
    if (resizeObserver) resizeObserver.disconnect();
    if (resizeTimer) clearTimeout(resizeTimer);
    chartTooltip.hide();
});
</script>

<style scoped>
.time-brush-chart {
    width: 100%;
    height: 100%;
    min-height: 120px;
    overflow: hidden;
    position: relative;
    /* 可以在这里设置字体，让 SVG 继承 */
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
}

:deep(svg) {
    display: block;
}

:deep(.x-brush .selection) {
    fill: rgba(64, 158, 255, 0.2);
    /* Element Plus 风格蓝色 */
    stroke: #409EFF;
    stroke-width: 1px;
    shape-rendering: crispEdges;
}
</style>