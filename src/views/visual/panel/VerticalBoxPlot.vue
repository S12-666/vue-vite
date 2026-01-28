<template>
    <div ref="chartContainer" class="vertical-box-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, toRaw } from 'vue';
import * as d3 from 'd3';

const props = defineProps({
    fullData: { type: Array, default: () => [] },
    activeData: { type: Array, default: () => [] }
});

const emit = defineEmits(['update:filter']);

const chartContainer = ref(null);

// 调整 margin，左侧留够空间给文字
const margin = { top: 0, right: 10, bottom: 0, left: 80 };

const dimensions = [
    { key: 'tgtthick', name: 'thick', precision: 1 },
    { key: 'tgtwidth', name: 'width', precision: 1 },
    { key: 'tgtlength', name: 'length', precision: 1 },
    { key: 'dis_temp', name: 'disTemp', precision: 0 },
    { key: 'fm_temp', name: 'fmTemp', precision: 0 }
];

// 统计计算函数 (保持之前的浮点数修正逻辑)
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
    // 如果没有全量数据，清空并返回
    if (!fullRaw || fullRaw.length === 0) {
        d3.select(chartContainer.value).selectAll('*').remove();
        return;
    }

    await nextTick();
    d3.select(chartContainer.value).selectAll('*').remove();

    const containerWidth = chartContainer.value.clientWidth;

    // 1. 【紧凑布局】使用固定行高，而不是平分容器高度
    const fixedRowHeight = 60;
    const totalHeight = fixedRowHeight * dimensions.length;

    const svg = d3.select(chartContainer.value)
        .append('svg')
        .attr('width', containerWidth)
        .attr('height', totalHeight);

    dimensions.forEach((dim, i) => {
        const g = svg.append('g').attr('transform', `translate(0, ${i * fixedRowHeight})`);

        // 计算中心线和绘图宽度
        const centerY = fixedRowHeight / 2;
        const chartWidth = containerWidth - margin.left - margin.right;

        const fullStats = calcStats(fullRaw, dim.key);
        const hasSelection = activeRaw.length > 0 && activeRaw.length < fullRaw.length;
        const activeStats = hasSelection ? calcStats(activeRaw, dim.key) : null;

        if (!fullStats) return;

        // X轴比例尺 (使用 fullStats 的 range 避免离群值压缩图表)
        const xScale = d3.scaleLinear()
            .domain([
                fullStats.rangeMin === fullStats.rangeMax ? fullStats.min * 0.9 : fullStats.rangeMin,
                fullStats.rangeMin === fullStats.rangeMax ? fullStats.max * 1.1 : fullStats.rangeMax
            ])
            .range([0, chartWidth])
            .nice();

        // ========================================================
        // A. 左侧文字区域 (调整距离 + 边框逻辑)
        // ========================================================

        // 标题 (稍微往上提一点，centerY - 8)
        g.append('text')
            .attr('x', 4)
            .attr('y', centerY)
            .style('font-size', '12px')
            .style('font-weight', '600') // 加粗一点
            .style('fill', '#303133')
            .style('font-family', 'Helvetica Neue, sans-serif')
            .text(dim.name);

        // 准备显示的文本内容
        const displayStats = activeStats || fullStats;
        const p = dim.precision;
        const defaultText = `${displayStats.min.toFixed(p)} ~ ${displayStats.max.toFixed(p)}`;

        // 【新增】背景框 (默认隐藏，刷选时显示)
        const textBg = g.append('rect')
            .attr('x', 2)
            .attr('y', centerY + 4) // 放在数值文字背后
            .attr('width', margin.left - 10) // 宽度撑满左侧区域
            .attr('height', 16)
            .attr('rx', 3)
            .style('fill', 'transparent')
            .style('stroke', 'none') // 初始无边框
            .style('stroke-width', '1px');

        // 数值文字
        const rangeText = g.append('text')
            .attr('x', 5) // 文字稍微缩进一点，避免贴着边框
            .attr('y', centerY + 16)
            .style('font-size', '11px')
            .style('fill', hasSelection ? '#409EFF' : '#909399')
            .style('font-family', 'Monaco, Consolas, monospace')
            .style('pointer-events', 'none') // 避免遮挡鼠标事件
            .text(defaultText);

        const plotG = g.append('g').attr('transform', `translate(${margin.left}, 0)`);

        // 绘制坐标轴 (轴线稍微下移)
        const axisY = centerY + 14;
        const xAxis = d3.axisBottom(xScale).ticks(3).tickSize(3);

        plotG.append('g')
            .attr('transform', `translate(0, ${axisY})`)
            .call(xAxis)
            .select('.domain').attr('stroke', '#EBEEF5');

        plotG.selectAll('.tick line').attr('stroke', '#E4E7ED');
        plotG.selectAll('.tick text')
            .style('fill', '#C0C4CC') // 轴文字颜色淡一点，不抢视觉
            .style('font-size', '9px');

        // 核心绘图函数 (应用之前修正的边界截断逻辑)
        const drawHorizontalBox = (stats, type) => {
            const boxHeight = type === 'full' ? 16 : 8;
            const color = type === 'full' ? '#F2F6FC' : '#409EFF'; // full 背景色再淡一点
            const stroke = type === 'full' ? '#DCDFE6' : '#409EFF';

            const xDomainMin = xScale.domain()[0];
            const xDomainMax = xScale.domain()[1];

            // 视觉截断：保证一定能画出来，且不超出画布
            const drawStart = Math.max(stats.min, xDomainMin);
            const drawEnd = Math.min(stats.max, xDomainMax);

            // 1. 中轴线 (连接两端)
            plotG.append('line')
                .attr('x1', xScale(drawStart)).attr('x2', xScale(drawEnd))
                .attr('y1', centerY).attr('y2', centerY)
                .attr('stroke', stroke).attr('stroke-width', 1)
                .attr('stroke-dasharray', type === 'full' ? '3,3' : '0');

            // 2. 左右端点竖线 (画在截断处)
            const whiskerSize = type === 'full' ? 12 : 8;
            [drawStart, drawEnd].forEach(val => {
                plotG.append('line')
                    .attr('x1', xScale(val)).attr('x2', xScale(val))
                    .attr('y1', centerY - whiskerSize / 2).attr('y2', centerY + whiskerSize / 2)
                    .attr('stroke', stroke).attr('stroke-width', 1.5);
            });

            // 3. 箱体 (截断保护)
            const drawQ1 = Math.max(stats.q1, xDomainMin);
            const drawQ3 = Math.min(stats.q3, xDomainMax);
            if (drawQ3 > drawQ1) {
                plotG.append('rect')
                    .attr('x', xScale(drawQ1))
                    .attr('y', centerY - boxHeight / 2)
                    .attr('width', xScale(drawQ3) - xScale(drawQ1))
                    .attr('height', boxHeight)
                    .attr('fill', color).attr('stroke', stroke).attr('rx', 2);
            }

            // 4. 中位数
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

        if (activeStats) {
            const brush = d3.brushX()
                // 设置刷选区域：X轴全长，Y轴占满整行
                .extent([[0, 0], [chartWidth, fixedRowHeight]])
                .on('start brush end', (event) => {
                    
                    const { selection, type } = event;
                    // if (!event.selection) {
                    //     // 还原文字
                    //     rangeText.text(defaultText)
                    //         .style('fill', '#409EFF')
                    //         .style('font-weight', 'normal');
                    //     // 隐藏边框
                    //     textBg.style('stroke', 'none');
                    //     return;
                    // }

                    if (!selection) {
                        // 1. UI 还原
                        rangeText.text(defaultText)
                            .style('fill', '#409EFF')
                            .style('font-weight', 'normal');
                        textBg.style('stroke', 'none');

                        if (type === 'end') {
                            emit('update:filter', { key: dim.key, value: [] });
                        }
                        return;
                    }

                    // 获取像素坐标并反算数值
                    const [x0, x1] = event.selection;
                    const val0 = xScale.invert(x0);
                    const val1 = xScale.invert(x1);

                    // 更新文字显示
                    rangeText
                        .text(`${val0.toFixed(dim.precision)} ~ ${val1.toFixed(dim.precision)}`)
                        .style('fill', '#409EFF') // 交互时的强调色 (橙色)
                        .style('font-weight', 'bold');

                    // 显示虚线边框
                    textBg
                        .style('stroke', '#409EFF')
                        .style('stroke-dasharray', '3,2');

                    if (type === 'end') {
                        // 格式化精度，确保传出去的是数字类型
                        const v0 = parseFloat(val0.toFixed(dim.precision));
                        const v1 = parseFloat(val1.toFixed(dim.precision));
                        
                        // 发送数据: { key: 'tgtthick', value: [10.5, 20.0] }
                        emit('update:filter', { key: dim.key, value: [v0, v1] });
                    }
                });

            const brushG = plotG.append('g')
                .attr('class', 'brush')
                .call(brush);

            // 样式优化：去掉自带的灰色遮罩，只保留选区框
            brushG.select('.selection')
                .attr('fill', '#409EFF')
                .attr('fill-opacity', 0.15)
                .attr('stroke', 'none');

            brushG.select('.overlay')
                .style('cursor', 'crosshair'); // 强制十字光标
        }
    });
};

const handleResize = () => { initChart(); };
// 监听数据变化
watch([() => props.fullData, () => props.activeData], initChart, { deep: false });

onMounted(() => {
    initChart();
    window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
});
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