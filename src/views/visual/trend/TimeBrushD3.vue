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
    },
    // 【新增】接收父组件传入的已选时间范围，解决跨路由恢复状态问题
    // 格式例如: ['2023-10-01 08:00', '2023-10-01 12:00']
    selectedTimeRange: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['timeBrushed']);
const chartContainer = ref(null);
let svgInstance = null;
let resizeObserver = null;
let resizeTimer = null;

// 【新增】本地保存刷选状态，用于 Resize 重绘时恢复
const localTimeRange = ref([...props.selectedTimeRange]);

// Margin: 底部留出 30px 给统计条活动空间
const margin = { top: 30, right: 0, bottom: 20, left: 0 };

// 统计条(Pill) 样式配置
const summaryConfig = {
    barWidth: 100,
    barHeight: 18,
    circleR: 9,
    bgColor: '#f2f6fc',
    fontSize: 10,
    gap: 2
};

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

    // --- 1. 数据准备 ---
    const categories = rawData.endTimeOutput.slice();
    const seriesNames = ['good_flag', 'bad_flag', 'no_flag'];

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

    // --- 2. 比例尺 ---
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
        .attr('stroke', '#BEBEBE').attr('stroke-width', 1).style('shape-rendering', 'crispEdges');

    // --- 3. 顶部图例 (Legend) ---
    const labelMap = { good_flag: 'Good', bad_flag: 'Bad', no_flag: 'No_Flag' };
    const legendGroup = svgInstance.append('g').attr('class', 'legend-group');

    let offsetX = 0;
    const colorBoxSize = 12;
    const itemGap = 12;

    seriesNames.forEach(key => {
        const g = legendGroup.append('g').attr('class', 'legend-item').datum(key);
        g.append('rect')
            .attr('width', colorBoxSize).attr('height', colorBoxSize)
            .attr('rx', 2).attr('ry', 2)
            .attr('fill', colorScale(key))
            .attr('y', -colorBoxSize / 2 - 1);

        const nameText = g.append('text')
            .text(labelMap[key] ?? key)
            .attr('x', colorBoxSize + 6).attr('y', 0).attr('dy', '0.35em')
            .style('font-size', '12px').style('fill', '#333').style('font-weight', '500');

        const valueText = g.append('text')
            .attr('class', 'legend-value')
            .text(totalCounts[key])
            .attr('x', colorBoxSize + 6 + nameText.node().getComputedTextLength() + 6)
            .attr('y', 0).attr('dy', '0.35em')
            .style('font-size', '12px').style('fill', '#333').style('font-weight', '600');

        const itemWidth = colorBoxSize + 6 + nameText.node().getComputedTextLength() + 6 + valueText.node().getComputedTextLength();
        g.attr('transform', `translate(${offsetX}, 0)`);
        offsetX += itemWidth + itemGap;
    });

    const legendX = width - offsetX;
    legendGroup.attr('transform', `translate(${legendX}, ${-15})`);

    const dateLabel = svgInstance.append('text')
        .attr('class', 'date-label')
        .attr('x', legendX - 30).attr('y', -15).attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .style('font-size', '12px').style('font-weight', '550').style('fill', '#333')
        .text('DateRange: 全量数据');

    // --- 4. 底部统计条 (Summary Pill) ---
    const summaryGroup = svgInstance.append('g')
        .attr('class', 'summary-stats')
        .style('opacity', 0)
        .style('transition', 'opacity 0.2s ease-out')
        .attr('pointer-events', 'none');

    summaryGroup.append('rect')
        .attr('x', -summaryConfig.barWidth / 2).attr('y', 0)
        .attr('width', summaryConfig.barWidth).attr('height', summaryConfig.barHeight)
        .attr('rx', summaryConfig.barHeight / 2)
        .attr('fill', summaryConfig.bgColor).attr('stroke', '#dcdfe6')
        .attr('stroke-width', 0.5).attr('fill-opacity', 0.85);

    const leftBadge = summaryGroup.append('g')
        .attr('transform', `translate(${-summaryConfig.barWidth / 2 + summaryConfig.circleR}, ${summaryConfig.barHeight / 2})`);
    leftBadge.append('circle').attr('r', summaryConfig.circleR - 1).attr('fill', util.flagColor[1]);
    const leftText = leftBadge.append('text').attr('dy', '0.35em').attr('text-anchor', 'middle')
        .style('fill', '#fff').style('font-size', '9px').style('font-weight', 'bold');

    const rightBadge = summaryGroup.append('g')
        .attr('transform', `translate(${summaryConfig.barWidth / 2 - summaryConfig.circleR}, ${summaryConfig.barHeight / 2})`);
    rightBadge.append('circle').attr('r', summaryConfig.circleR - 1).attr('fill', util.flagColor[0]);
    const rightText = rightBadge.append('text').attr('dy', '0.35em').attr('text-anchor', 'middle')
        .style('fill', '#fff').style('font-size', '9px').style('font-weight', 'bold');

    const centerText = summaryGroup.append('text')
        .attr('x', 0).attr('y', summaryConfig.barHeight / 2).attr('dy', '0.35em').attr('text-anchor', 'middle')
        .style('fill', '#606266').style('font-size', '11px').style('font-weight', 'bold');

    const updateStats = (selectedSet, centerX = null) => {
        let indices = [];
        if (!selectedSet || selectedSet.size === 0) {
            indices = categories.map((_, i) => i);
            const s = formatShortDate(categories[0]);
            const e = formatShortDate(categories[categories.length - 1]);
            dateLabel.text(`DateRange: ${s} - ${e}`);
        } else {
            categories.forEach((cat, i) => { if (selectedSet.has(cat)) indices.push(i); });
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
            d3.select(this).select('.legend-value').text(currentSums[d]);
        });

        if (!selectedSet || selectedSet.size === 0) {
            summaryGroup.style('opacity', 0);
        } else {
            const total = currentSums.good_flag + currentSums.bad_flag + currentSums.no_flag;
            const badRate = total > 0 ? Math.round((currentSums.bad_flag / total) * 100) : 0;
            const goodRate = total > 0 ? Math.round((currentSums.good_flag / total) * 100) : 0;

            leftText.text(badRate);
            rightText.text(goodRate);
            centerText.text(total);

            if (centerX !== null) {
                const minX = summaryConfig.barWidth / 2;
                const maxX = width - summaryConfig.barWidth / 2;
                const clampedX = Math.max(minX, Math.min(maxX, centerX));
                const posY = height;
                summaryGroup.attr('transform', `translate(${clampedX}, ${posY})`).style('opacity', 1);
            }
        }
    };

    updateStats(null);

    // --- 6. Brush 逻辑 ---
    const onBrushMove = (event) => {
        // 注意：这里移除了 return !event.sourceEvent 的阻断，
        // 因为代码主动调用 brush.move 时，我们也希望走这里的逻辑更新 UI 样式。
        if (!event) return;
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

        const centerX = (x0 + x1) / 2;
        updateStats(selectedSet, centerX);

        allRects.attr('fill-opacity', (d, i) => {
            return selectedSet.has(categories[i % categories.length]) ? 1 : 0.3;
        });
    };

    const onBrushEnd = (event) => {
        const selection = event.selection;

        // 【核心判断】区分是用户鼠标操作，还是代码触发的 brush.move
        const isUserEvent = !!event.sourceEvent;

        if (!selection) {
            updateStats(null);
            svgInstance.selectAll('.series-group rect').attr('fill-opacity', 1);

            if (isUserEvent) {
                localTimeRange.value = [];
                emit('timeBrushed', []);
            }
        } else {
            const [x0, x1] = selection;
            const selectedSet = new Set();
            categories.forEach(cat => {
                const xPos = xScale(cat);
                const bw = xScale.bandwidth();
                if (xPos + bw / 2 >= x0 && xPos + bw / 2 <= x1) selectedSet.add(cat);
            });

            updateStats(selectedSet, (x0 + x1) / 2);

            // 只有真实用户的操作才对外 emit 和保存状态
            if (isUserEvent) {
                if (selectedSet.size > 0) {
                    const sorted = [...selectedSet].sort();
                    const newRange = [sorted[0], sorted[sorted.length - 1]];
                    localTimeRange.value = newRange; // 更新本地记录
                    emit('timeBrushed', newRange);
                } else {
                    localTimeRange.value = [];
                    emit('timeBrushed', []);
                }
            }
        }
    };

    const brush = d3.brushX()
        .extent([[0, 0], [width, height]])
        .on('brush', onBrushMove)
        .on('end', onBrushEnd);

    const brushG = svgInstance.append('g').attr('class', 'x-brush').call(brush);

    // 再画柱子 (在顶层)
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
            // ... (Tooltip 逻辑保持不变)
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

    summaryGroup.raise();

    // ==========================================
    // 🌟 核心优化：渲染完成后恢复刷选状态
    // ==========================================
    if (localTimeRange.value && localTimeRange.value.length === 2) {
        const startCat = localTimeRange.value[0];
        const endCat = localTimeRange.value[1];

        // 确保类别在当前数据中存在
        if (categories.includes(startCat) && categories.includes(endCat)) {
            const x0 = xScale(startCat);
            const x1 = xScale(endCat) + xScale.bandwidth();

            // 自动触发行内刷选恢复 (这会触发上面的 onBrushMove, 但不会死循环 emit)
            brushG.call(brush.move, [x0, x1]);
        }
    }
};

const handleResize = (entries) => {
    const entry = entries[0];
    const { width, height } = entry.contentRect;
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { initChart(); }, 100);
};

// 监听父组件属性，同步重置选项
watch(() => props.selectedTimeRange, (newVal) => {
    localTimeRange.value = [...newVal];
    // 这里可以选择主动调用 initChart() 或由父组件传入 chartData 时一并触发
}, { deep: true });

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
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
}

:deep(svg) {
    display: block;
}

:deep(.x-brush .selection) {
    fill: rgba(64, 158, 255, 0.2);
    stroke: #409EFF;
    stroke-width: 1px;
    shape-rendering: crispEdges;
}
</style>