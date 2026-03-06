<template>
    <div ref="chartContainer" class="vertical-box-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, toRaw } from 'vue';
import * as d3 from 'd3';

const props = defineProps({
    fullData: { type: Array, default: () => [] },
    activeData: { type: Array, default: () => [] },
    // 【建议新增】如果需要跨路由保持状态，可以让父组件把当前的筛选条件传回来
    // 例如: { tgtthick: [10.5, 20], tgtwidth: [100, 200] }
    filters: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['update:filter']);

const chartContainer = ref(null);
let resizeObserver = null; // 用于精确监听 DOM 尺寸变化

// 【新增】用来在组件生命周期内记住当前的刷选状态，防止重绘时丢失
const brushStates = ref({ ...props.filters });

const margin = { top: 0, right: 10, bottom: 0, left: 80 };

const dimensions = [
    { key: 'tgtthick', name: 'thick', precision: 1 },
    { key: 'tgtwidth', name: 'width', precision: 1 },
    { key: 'tgtlength', name: 'length', precision: 1 },
    { key: 'dis_temp', name: 'disTemp', precision: 0 },
    { key: 'fm_temp', name: 'fmTemp', precision: 0 }
];

// 统计计算函数 (保持不变)
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

    return {
        min: fmt(min),
        q1: fmt(q1),
        median: fmt(median),
        q3: fmt(q3),
        max: fmt(max),
        rangeMin: fmt(rawRangeMin),
        rangeMax: fmt(rawRangeMax)
    };
};

const initChart = async () => {
    const fullRaw = toRaw(props.fullData);
    const activeRaw = toRaw(props.activeData);

    if (!chartContainer.value) return;
    if (!fullRaw || fullRaw.length === 0) {
        d3.select(chartContainer.value).selectAll('*').remove();
        return;
    }

    await nextTick();
    d3.select(chartContainer.value).selectAll('*').remove();

    const containerWidth = chartContainer.value.clientWidth;
    const fixedRowHeight = 60;
    const totalHeight = fixedRowHeight * dimensions.length;

    const svg = d3.select(chartContainer.value)
        .append('svg')
        .attr('width', containerWidth)
        .attr('height', totalHeight);

    dimensions.forEach((dim, i) => {
        const g = svg.append('g').attr('transform', `translate(0, ${i * fixedRowHeight})`);

        const centerY = fixedRowHeight / 2;
        const chartWidth = containerWidth - margin.left - margin.right;

        const fullStats = calcStats(fullRaw, dim.key);
        const hasSelection = activeRaw.length > 0 && activeRaw.length < fullRaw.length;
        const activeStats = hasSelection ? calcStats(activeRaw, dim.key) : null;

        if (!fullStats) return;

        const xScale = d3.scaleLinear()
            .domain([
                fullStats.rangeMin === fullStats.rangeMax ? fullStats.min * 0.9 : fullStats.rangeMin,
                fullStats.rangeMin === fullStats.rangeMax ? fullStats.max * 1.1 : fullStats.rangeMax
            ])
            .range([0, chartWidth])
            .nice();

        // --- A. 左侧文字区域 ---
        g.append('text')
            .attr('x', 4).attr('y', centerY)
            .style('font-size', '12px')
            .style('font-weight', '600')
            .style('fill', '#303133')
            .text(dim.name);

        const displayStats = activeStats || fullStats;
        const p = dim.precision;
        const defaultText = `${displayStats.min.toFixed(p)} ~ ${displayStats.max.toFixed(p)}`;

        const textBg = g.append('rect')
            .attr('x', 2).attr('y', centerY + 4)
            .attr('width', margin.left - 10).attr('height', 16).attr('rx', 3)
            .style('fill', 'transparent')
            .style('stroke', 'none')
            .style('stroke-width', '1px');

        const rangeText = g.append('text')
            .attr('x', 5).attr('y', centerY + 16)
            .style('font-size', '11px')
            .style('fill', hasSelection ? '#409EFF' : '#909399')
            .style('font-family', 'Monaco, Consolas, monospace')
            .style('pointer-events', 'none')
            .text(defaultText);

        const plotG = g.append('g').attr('transform', `translate(${margin.left}, 0)`);

        const axisY = centerY + 14;
        const xAxis = d3.axisBottom(xScale).ticks(3).tickSize(3);

        plotG.append('g')
            .attr('transform', `translate(0, ${axisY})`)
            .call(xAxis)
            .select('.domain').attr('stroke', '#EBEEF5');

        plotG.selectAll('.tick line').attr('stroke', '#E4E7ED');
        plotG.selectAll('.tick text').style('fill', '#C0C4CC').style('font-size', '9px');

        // --- 核心绘图函数 (保持不变) ---
        const drawHorizontalBox = (stats, type) => {
            const boxHeight = type === 'full' ? 16 : 8;
            const color = type === 'full' ? '#F2F6FC' : '#409EFF';
            const stroke = type === 'full' ? '#DCDFE6' : '#409EFF';

            const xDomainMin = xScale.domain()[0];
            const xDomainMax = xScale.domain()[1];

            const drawStart = Math.max(stats.min, xDomainMin);
            const drawEnd = Math.min(stats.max, xDomainMax);

            plotG.append('line')
                .attr('x1', xScale(drawStart)).attr('x2', xScale(drawEnd))
                .attr('y1', centerY).attr('y2', centerY)
                .attr('stroke', stroke).attr('stroke-width', 1)
                .attr('stroke-dasharray', type === 'full' ? '3,3' : '0');

            const whiskerSize = type === 'full' ? 12 : 8;
            [drawStart, drawEnd].forEach(val => {
                plotG.append('line')
                    .attr('x1', xScale(val)).attr('x2', xScale(val))
                    .attr('y1', centerY - whiskerSize / 2).attr('y2', centerY + whiskerSize / 2)
                    .attr('stroke', stroke).attr('stroke-width', 1.5);
            });

            const drawQ1 = Math.max(stats.q1, xDomainMin);
            const drawQ3 = Math.min(stats.q3, xDomainMax);
            if (drawQ3 > drawQ1) {
                plotG.append('rect')
                    .attr('x', xScale(drawQ1)).attr('y', centerY - boxHeight / 2)
                    .attr('width', xScale(drawQ3) - xScale(drawQ1)).attr('height', boxHeight)
                    .attr('fill', color).attr('stroke', stroke).attr('rx', 2);
            }

            if (stats.median >= xDomainMin && stats.median <= xDomainMax) {
                plotG.append('line')
                    .attr('x1', xScale(stats.median)).attr('x2', xScale(stats.median))
                    .attr('y1', centerY - boxHeight / 2).attr('y2', centerY + boxHeight / 2)
                    .attr('stroke', type === 'full' ? '#909399' : '#fff').attr('stroke-width', 2);
            }
        };

        drawHorizontalBox(fullStats, 'full');
        if (activeStats) {
            drawHorizontalBox(activeStats, 'active');
        }

        // --- 刷选事件处理 ---
        if (activeStats) {
            const brush = d3.brushX()
                .extent([[0, 0], [chartWidth, fixedRowHeight]])
                .on('start brush end', (event) => {
                    const { selection, type, sourceEvent } = event;

                    // 【核心优化1】如果是代码主动调用恢复刷选，不触发向父组件 emit (避免死循环)
                    const isUserInteraction = !!sourceEvent;

                    if (!selection) {
                        rangeText.text(defaultText).style('fill', '#409EFF').style('font-weight', 'normal');
                        textBg.style('stroke', 'none');

                        if (type === 'end' && isUserInteraction) {
                            delete brushStates.value[dim.key]; // 清除本地记录
                            emit('update:filter', { key: dim.key, value: [] });
                        }
                        return;
                    }

                    const [x0, x1] = selection;
                    const val0 = xScale.invert(x0);
                    const val1 = xScale.invert(x1);

                    // 更新 UI 样式
                    rangeText
                        .text(`${val0.toFixed(dim.precision)} ~ ${val1.toFixed(dim.precision)}`)
                        .style('fill', '#409EFF')
                        .style('font-weight', 'bold');

                    textBg.style('stroke', '#409EFF').style('stroke-dasharray', '3,2');

                    // 只有真实用户的操作才对外 emit 更新
                    if (type === 'end' && isUserInteraction) {
                        const v0 = parseFloat(val0.toFixed(dim.precision));
                        const v1 = parseFloat(val1.toFixed(dim.precision));
                        brushStates.value[dim.key] = [v0, v1]; // 更新本地记录
                        emit('update:filter', { key: dim.key, value: [v0, v1] });
                    }
                });

            const brushG = plotG.append('g').attr('class', 'brush').call(brush);

            brushG.select('.selection').attr('fill', '#409EFF').attr('fill-opacity', 0.15).attr('stroke', 'none');
            brushG.select('.overlay').style('cursor', 'crosshair');

            // 【核心优化2】初始化或重绘完毕后，检查如果有曾经刷选过的值，恢复刷选框！
            if (brushStates.value[dim.key]) {
                const [v0, v1] = brushStates.value[dim.key];
                // 确保像素点在图表范围内
                const pos0 = Math.max(0, xScale(v0));
                const pos1 = Math.min(chartWidth, xScale(v1));

                if (pos1 > pos0) {
                    // 触发行内调用恢复框选UI (这会触发上面的 on('brush'), 但由于没有 sourceEvent, 不会 emit 死循环)
                    brushG.call(brush.move, [pos0, pos1]);
                }
            }
        }
    });
};

// 【核心优化3】使用 ResizeObserver 替换 window.resize
onMounted(() => {
    initChart();

    // 监听 DOM 本身的 Resize，解决折叠面板变化的问题
    if (chartContainer.value) {
        resizeObserver = new ResizeObserver(() => {
            // 使用 requestAnimationFrame 防抖，避免报 ResizeObserver loop limit exceeded
            requestAnimationFrame(() => {
                initChart();
            });
        });
        resizeObserver.observe(chartContainer.value);
    }
});

onUnmounted(() => {
    if (resizeObserver) {
        resizeObserver.disconnect();
    }
});

// 监听 props
watch(() => props.filters, (newVal) => {
    // 允许父组件重置筛选条件
    brushStates.value = { ...newVal };
}, { deep: true });

watch([() => props.fullData, () => props.activeData], initChart, { deep: false });
</script>

<style scoped>
.vertical-box-container {
    width: 100%;
    position: relative;
}

:deep(.brush .overlay) {
    cursor: crosshair !important;
}
</style>