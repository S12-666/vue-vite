<template>
    <div class="gantt-chart-wrapper">
        <div ref="chartContainer" class="chart-body"></div>

        <div ref="tooltipRef" class="dna-tooltip" v-show="tooltipData.visible" :style="tooltipStyle">
            <div class="tooltip-header" :style="{ backgroundColor: tooltipData.color }">
                <span class="batch-id">{{ tooltipData.bid }}</span>
                <span class="grade-id">{{ tooltipData.cid }}</span>
            </div>
            <div class="tooltip-body">
                <div class="info-row">
                    <label>Mode:</label> <span>{{ tooltipData.smode || '-' }}</span>
                </div>
                <div class="info-row">
                    <label>Time:</label> <span>{{ tooltipData.duration }} min</span>
                </div>
                <div class="sep"></div>

                <div class="metric-row">
                    <span class="m-label">T</span>
                    <div class="m-bar">
                        <div :style="{ width: '80%', background: tooltipData.color }"></div>
                    </div>
                    <span class="m-val">{{ tooltipData.thickness }} mm</span>
                </div>
                <div class="metric-row">
                    <span class="m-label">W</span>
                    <div class="m-bar">
                        <div :style="{ width: '60%', background: tooltipData.color }"></div>
                    </div>
                    <span class="m-val">{{ tooltipData.width }} m</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, nextTick, computed, toRaw } from 'vue';
import * as d3 from 'd3';

// --- Props 定义 ---
const props = defineProps({
    // 接收父组件传入的数据
    // 预期格式：数据库 deba_dump_batch 表的记录列表或处理后的标准格式
    chartData: {
        type: Array,
        default: () => []
    },
    // 可选：图表的高度
    height: {
        type: Number,
        default: 160
    }
});

// --- Emits ---
const emit = defineEmits(['itemClick']);

// --- Refs & State ---
const chartContainer = ref(null);
const tooltipData = ref({
    visible: false, x: 0, y: 0,
    bid: '', cid: '', smode: '', color: '#ccc',
    thickness: 0, width: 0, duration: 0
});

// 计算 Tooltip 位置样式
const tooltipStyle = computed(() => ({
    left: `${tooltipData.value.x}px`,
    top: `${tooltipData.value.y}px`
}));

// --- 配置项 ---
const margin = { top: 20, right: 20, bottom: 20, left: 20 };
const trackHeight = 40; // DNA 条的高度
let resizeObserver = null;
let resizeTimer = null;

// --- 辅助函数：字符串转颜色 (用于根据规格号 cid 生成固定颜色) ---
const stringToColor = (str) => {
    if (!str) return '#e0e0e0';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
};

// --- 核心逻辑：数据转换 ---
// 后续你告诉我数据结构后，我们只需修改这里
const transformData = (rawData) => {
    if (!rawData || rawData.length === 0) return [];

    // 假设传入的是简单的对象数组，这里做一个防御性映射
    // 实际对接时，会根据数据库字段 bid, cid, times, cindex 等进行解析
    return rawData.map((item, i) => {
        // 模拟时间处理
        const startTime = item.startTime ? new Date(item.startTime) : new Date();
        const endTime = item.endTime ? new Date(item.endTime) : new Date(startTime.getTime() + 1000 * 60 * 60);
        const durationMin = ((endTime - startTime) / 60000).toFixed(0);

        return {
            raw: item, // 保留原始数据
            id: item.id || i,
            bid: item.bid || 'Unknown',      // 批次号
            cid: item.cid || 'N/A',          // 规格/钢种
            smode: item.smode || '',         // 模式
            startTime: startTime,
            endTime: endTime,
            duration: durationMin,
            // 模拟指标，如果没有则给默认值
            thickness: item.thickness || '0.00',
            width: item.width || '0.00',
            color: stringToColor(item.cid || 'N/A') // 相同规格同色
        };
    }).sort((a, b) => a.startTime - b.startTime);
};

// --- 渲染图表 ---
const initChart = async () => {
    const rawData = toRaw(props.chartData);
    const data = transformData(rawData);

    if (!chartContainer.value) return;

    // 清空旧图表
    d3.select(chartContainer.value).selectAll('svg').remove();

    if (data.length === 0) {
        // 可以显示一个 Empty State
        d3.select(chartContainer.value).append('div')
            .style('text-align', 'center').style('color', '#999').style('padding-top', '40px')
            .text('暂无甘特图数据');
        return;
    }

    await nextTick();
    const bbox = chartContainer.value.getBoundingClientRect();
    const width = bbox.width - margin.left - margin.right;
    // 如果容器高度不够，给个默认高度
    const height = (bbox.height || props.height) - margin.top - margin.bottom;

    const svg = d3.select(chartContainer.value)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${bbox.width} ${bbox.height || props.height}`)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // 1. X轴：连续时间轴
    const minTime = d3.min(data, d => d.startTime);
    const maxTime = d3.max(data, d => d.endTime);

    // 留一点余量，别顶头
    const timeSpan = maxTime - minTime;
    const paddingTime = timeSpan * 0.02;

    const xScale = d3.scaleTime()
        .domain([new Date(minTime.getTime() - paddingTime), new Date(maxTime.getTime() + paddingTime)])
        .range([0, width]);

    // 2. 绘制轨道背景 (槽)
    const trackY = (height - trackHeight) / 2;

    svg.append('rect')
        .attr('x', 0)
        .attr('y', trackY)
        .attr('width', width)
        .attr('height', trackHeight)
        .attr('fill', '#f5f7fa')
        .attr('rx', 4);

    // 3. 绘制 DNA 块 (Block)
    const blocks = svg.selectAll('.dna-block')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'dna-block')
        .attr('x', d => xScale(d.startTime))
        .attr('y', trackY)
        // 宽度至少 1px，避免看不见
        .attr('width', d => Math.max(1.5, xScale(d.endTime) - xScale(d.startTime)))
        .attr('height', trackHeight)
        .attr('fill', d => d.color)
        // 关键：描边同色，实现视觉聚合
        .attr('stroke', d => d.color)
        .attr('stroke-width', 1)
        .style('cursor', 'pointer');

    // 4. 交互事件
    blocks
        .on('mouseenter', (event, d) => {
            // 高亮效果：变亮一点，或者加白色描边
            d3.select(event.target)
                .attr('filter', 'brightness(1.1)')
                .attr('stroke', '#fff')
                .raise(); // 浮起

            // 计算 Tooltip 位置
            const rectBox = event.target.getBoundingClientRect();
            const containerBox = chartContainer.value.getBoundingClientRect();

            // 相对容器的坐标
            const tooltipX = rectBox.left - containerBox.left + rectBox.width / 2;
            const tooltipY = rectBox.bottom - containerBox.top + 10;

            tooltipData.value = {
                visible: true,
                x: tooltipX,
                y: tooltipY,
                ...d
            };
        })
        .on('mouseleave', (event, d) => {
            // 恢复样式
            d3.select(event.target)
                .attr('filter', null)
                .attr('stroke', d.color); // 恢复同色描边

            tooltipData.value.visible = false;
        })
        .on('click', (event, d) => {
            emit('itemClick', d.raw);
        });

    // 5. 绘制时间轴刻度 (顶部)
    const xAxis = d3.axisTop(xScale)
        .ticks(5)
        .tickFormat(d3.timeFormat('%m-%d %H:%M'))
        .tickSize(-height); // 网格线贯穿

    const gX = svg.append('g')
        .attr('class', 'axis-x')
        .call(xAxis);

    // 样式优化：虚线网格，隐藏轴线
    gX.selectAll('.tick line')
        .attr('stroke', '#ebeef5')
        .attr('stroke-dasharray', '4,4');
    gX.select('.domain').remove();
    gX.selectAll('.tick text')
        .attr('fill', '#909399')
        .attr('font-size', '11px');
};

// --- 生命周期与监听 ---
const handleResize = () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initChart, 200);
};

watch(() => props.chartData, (val) => {
    if (val) initChart();
}, { deep: true });

onMounted(() => {
    initChart();
    resizeObserver = new ResizeObserver(handleResize);
    if (chartContainer.value) resizeObserver.observe(chartContainer.value);
});

onUnmounted(() => {
    if (resizeObserver) resizeObserver.disconnect();
});
</script>

<style scoped>
.gantt-chart-wrapper {
    width: 100%;
    height: 100%;
    min-height: 120px;
    position: relative;
    /* 基础字体设置 */
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    overflow: hidden;
    /* 防止Tooltip溢出容器造成滚动条，视情况可去掉 */
}

.chart-body {
    width: 100%;
    height: 100%;
}

/* Tooltip 卡片样式 */
.dna-tooltip {
    position: absolute;
    width: 150px;
    background: white;
    border: 1px solid #ebeef5;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    padding: 0;
    pointer-events: none;
    /* 让鼠标事件穿透，不影响图表操作 */
    z-index: 100;
    transform: translateX(-50%);
    /* 水平居中 */
    transition: opacity 0.1s ease, top 0.1s ease;
    font-size: 12px;
}

/* 小三角箭头 */
.dna-tooltip::before {
    content: '';
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 0 6px 6px 6px;
    border-style: solid;
    border-color: transparent transparent #fff transparent;
}

.tooltip-header {
    padding: 6px 10px;
    color: white;
    font-weight: 600;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 4px 4px 0 0;
}

.batch-id {
    font-size: 12px;
}

.grade-id {
    font-size: 10px;
    opacity: 0.9;
    background: rgba(0, 0, 0, 0.1);
    padding: 1px 4px;
    border-radius: 2px;
}

.tooltip-body {
    padding: 8px 10px;
    background: #fff;
    border-radius: 0 0 4px 4px;
}

.info-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
    color: #606266;
}

.sep {
    height: 1px;
    background: #f2f6fc;
    margin: 6px 0;
}

.metric-row {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
    color: #909399;
    font-size: 11px;
}

.m-label {
    width: 15px;
    font-weight: bold;
}

.m-bar {
    flex: 1;
    height: 6px;
    background: #f0f2f5;
    margin: 0 8px;
    border-radius: 2px;
    overflow: hidden;
}

.m-bar>div {
    height: 100%;
    border-radius: 2px;
}

.m-val {
    width: 45px;
    text-align: right;
    font-family: monospace;
}
</style>