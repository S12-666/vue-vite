<template>
    <div ref="chartContainer" class="time-brush-chart"></div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, nextTick, toRaw } from 'vue';
import * as d3 from 'd3';

const util = { flagColor: ['#67C23A', '#F56C6C', '#909399'] };

const props = defineProps({
    chartData: {
        type: Object,
        default: () => null
    }
});

const emit = defineEmits(['timeBrushed']);

const chartContainer = ref(null);
let svgInstance = null;
let brushDebounceTimer = null; // 专门用于 Brush 的定时器
let resizeObserver = null;     // 专门用于 Resize 的监听器
let resizeTimer = null;        // 专门用于 Resize 的防抖定时器

const margin = { top: 20, right: 2, bottom: 2, left: 2 };

// --- 辅助函数 ---

// 1. Brush 的防抖
const debounceBrush = (fn, delay) => {
    return (...args) => {
        if (brushDebounceTimer) clearTimeout(brushDebounceTimer);
        brushDebounceTimer = setTimeout(() => {
            fn(...args);
        }, delay);
    };
};

// 2. 日期格式化
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.toString().substring(5, 10); // "06-14"
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

    const categories = rawData.endTimeOutput.slice();
    const seriesNames = ['good_flag', 'bad_flag', 'no_flag'];

    const stackedInput = categories.map((cat, i) => ({
        category: cat,
        good_flag: rawData.good_flag?.[i] || 0,
        bad_flag: rawData.bad_flag?.[i] || 0,
        no_flag: rawData.no_flag?.[i] || 0
    }));

    const stackGen = d3.stack().keys(seriesNames);
    const stackedSeries = stackGen(stackedInput);

    // --- 比例尺 ---
    const xScale = d3.scaleBand()
        .domain(categories)
        .range([0, width])
        .paddingInner(0.1)
        .paddingOuter(0.05);

    const maxY = d3.max(stackedSeries[stackedSeries.length - 1], d => d[1]) || 0;
    const yScale = d3.scaleLinear()
        .domain([0, maxY])
        .range([height, 0]);

    const colorScale = d3.scaleOrdinal()
        .domain(seriesNames)
        .range(util.flagColor);

    // --- SVG 创建 ---
    svgInstance = d3.select(chartContainer.value)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${bbox.width} ${bbox.height}`)
        // 这一行保证 SVG 在容器变窄时不会被裁剪，而是缩放
        .attr('preserveAspectRatio', 'none')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    svgInstance.append('line')
        .attr('x1', 0)
        .attr('y1', height)
        .attr('x2', width)
        .attr('y2', height)
        .attr('stroke', '#ccc') // 浅灰色，类似坐标轴颜色
        .attr('stroke-width', 1)
        .style('shape-rendering', 'crispEdges');

    // --- 绘制图例 (Legend) ---
    const labelMap = { good_flag: 'Good', bad_flag: 'Bad', no_flag: 'No_Flag' };
    const legendGroup = svgInstance.append('g').attr('class', 'legend-group');

    let offsetX = 0;
    const colorBoxSize = 14;
    seriesNames.forEach(key => {
        const g = legendGroup.append('g').attr('class', 'legend-item');
        g.append('rect')
            .attr('width', colorBoxSize).attr('height', colorBoxSize)
            .attr('fill', colorScale(key)).attr('y', -colorBoxSize / 2);

        g.append('text')
            .text(labelMap[key])
            .attr('x', colorBoxSize + 6).attr('y', 0).attr('dy', '0.35em')
            .style('font-size', '12px').style('fill', '#333');

        // 固定间距
        g.attr('transform', `translate(${offsetX}, 0)`);
        offsetX += (colorBoxSize + 6 + 45 + 15);
    });

    // 图例右对齐
    const legendX = width - offsetX;
    legendGroup.attr('transform', `translate(${legendX}, ${-15})`);

    // --- 时间标签 ---
    const timeLabel = svgInstance.append('text')
        .attr('class', 'chart-time-label')
        .attr('x', legendX - 20)
        .attr('y', -15)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .style('fill', '#333')
        .text('');

    if (categories.length > 0) {
        const startStr = formatDate(categories[0]);
        const endStr = formatDate(categories[categories.length - 1]);
        timeLabel.text(`${startStr} 到 ${endStr}`);
    }

    // --- 绘制柱子 ---
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
        .attr('width', xScale.bandwidth()); // 宽度自适应

    const onBrushMove = (event) => {
        // 如果是程序触发的清除，或者空事件，不做处理
        if (!event || !event.sourceEvent) return;
        if (event.type !== 'brush') return;

        const selection = event.selection;
        const allRects = svgInstance.selectAll('.series-group rect');

        // 如果当前没有选区（比如用户正在双击清空的过程中），全部高亮
        if (!selection) {
            allRects.attr('fill-opacity', 1);
            return;
        }

        const [x0, x1] = selection;
        const timePointCount = categories.length;
        const selectedSet = new Set();

        // 计算哪些柱子在范围内
        categories.forEach(cat => {
            const xPos = xScale(cat);
            const bw = xScale.bandwidth();
            // 中心点判断法
            if (xPos + bw / 2 >= x0 && xPos + bw / 2 <= x1) {
                selectedSet.add(cat);
            }
        });

        // 实时更新顶部时间文字 (让用户知道自己选了啥)
        if (selectedSet.size > 0) {
            const sorted = [...selectedSet].sort();
            const startStr = formatDate(sorted[0]);
            const endStr = formatDate(sorted[sorted.length - 1]);
            timeLabel.text(`${startStr} 到 ${endStr}`);
        } else {
            timeLabel.text('未选择');
        }

        // 实时更新柱子透明度
        allRects.attr('fill-opacity', (d, i) => {
            const timeIndex = i % timePointCount;
            return selectedSet.has(categories[timeIndex]) ? 1 : 0.3;
        });
    };

    // B. 处理最终逻辑 (鼠标松开时触发)
    // 只有这里才会 emit 数据
    const onBrushEnd = (event) => {
        // 这里的 event.selection 是最终的范围
        const selection = event.selection;
        const allRects = svgInstance.selectAll('.series-group rect');
        const timePointCount = categories.length;

        // 1. 情况一：没有选区 (用户点击空白处取消了刷选)
        if (!selection) {
            allRects.attr('fill-opacity', 1); // 恢复高亮
            // 恢复显示全范围时间
            if (categories.length > 0) {
                const s = formatDate(categories[0]);
                const e = formatDate(categories[categories.length - 1]);
                timeLabel.text(`${s} 到 ${e}`);
            }
            // 发送空数组
            console.log('刷选结束：未选择区域');
            emit('timeBrushed', []);
            return;
        }

        // 2. 情况二：有选区 (计算最终结果)
        const [x0, x1] = selection;
        const selectedSet = new Set();

        categories.forEach(cat => {
            const xPos = xScale(cat);
            const bw = xScale.bandwidth();
            if (xPos + bw / 2 >= x0 && xPos + bw / 2 <= x1) {
                selectedSet.add(cat);
            }
        });

        // 再次确认样式 (防止快速拖动时 brushMove 没跟上)
        allRects.attr('fill-opacity', (d, i) => {
            const timeIndex = i % timePointCount;
            return selectedSet.has(categories[timeIndex]) ? 1 : 0.3;
        });

        if (selectedSet.size > 0) {
            const sorted = [...selectedSet].sort();
            // 最终确认文字
            timeLabel.text(`${formatDate(sorted[0])} 到 ${formatDate(sorted[sorted.length - 1])}`);

            console.log('刷选结束：发送数据', sorted[0], sorted[sorted.length - 1]);
            // ★★★ 只有在这里才发送事件 ★★★
            emit('timeBrushed', [sorted[0], sorted[sorted.length - 1]]);
        } else {
            // 选区太小没选中任何柱子
            timeLabel.text('未选择');
            emit('timeBrushed', []);
        }
    };

    const brush = d3.brushX()
        .extent([[0, 0], [width, height]])
        // ★★★ 关键修改：分开监听 ★★★
        .on('brush', onBrushMove)  // 拖动时：只改样式，不发数据
        .on('end', onBrushEnd);    // 松手时：发送数据

    svgInstance.append('g').attr('class', 'x-brush').call(brush);

    // const brush = d3.brushX()
    //     .extent([[0, 0], [width, height]])
    //     .on('brush end', debounceBrush(emitBrushHandler, 50));

    // svgInstance.append('g').attr('class', 'x-brush').call(brush);
};

const handleResize = () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        initChart();
    }, 100);
};

watch(() => props.chartData, (val) => {
    if (val) initChart();
}, { deep: true });

onMounted(() => {
    initChart();
    if (chartContainer.value) {
        resizeObserver = new ResizeObserver(() => {
            handleResize();
        });
        resizeObserver.observe(chartContainer.value);
    }
});

onUnmounted(() => {
    if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
    }
    if (resizeTimer) clearTimeout(resizeTimer);
    if (brushDebounceTimer) clearTimeout(brushDebounceTimer);
});
</script>

<style scoped>
.time-brush-chart {
    width: 100%;
    height: 100%;
    min-height: 120px;

    overflow: hidden;
    position: relative;
}

:deep(svg) {
    display: block;
}

:deep(.x-brush .selection) {
    fill: rgba(150, 200, 255, 0.3);
    stroke: #96c8ff;
}
</style>