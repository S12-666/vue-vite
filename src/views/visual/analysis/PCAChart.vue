<template>
    <div class="pca-container">
        <template v-if="plateData">
            <div class="pca-header">
                <div class="upid-box">
                    <span class="label-value">{{ plateData.upid }}</span>
                </div>
                <div class="sort-controls">
                    <button :class="['sort-btn', { 'active-t2': activeSort === 'T2' }]" @click="setSort('T2')">
                        T2
                    </button>
                    <button :class="['sort-btn', { 'active-q': activeSort === 'Q' }]" @click="setSort('Q')">
                        SPE
                    </button>
                </div>
            </div>
            <div class="charts-area" ref="chartsAreaRef">
                <div class="main-chart-container" ref="mainChartRef"></div>
                <div class="bottom-chart-container" ref="bottomChartRef"></div>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick, shallowRef } from 'vue';
import * as d3 from 'd3';
import { chartTooltip } from '@/utils/tooltip_utils/tooltip.js';

const props = defineProps({
    detailData: {
        type: Array,
        default: () => []
    }
});

// ==== 状态管理 ====
const activeSort = ref('T2'); // 'T2' 或是 'Q'
const mainChartRef = ref(null);
const bottomChartRef = ref(null);
const chartsAreaRef = ref(null);
let resizeObserver = null;
let rafId = null;

const containerSize = shallowRef({ width: 0, height: 0, bottomHeight: 40 });

const setSort = (type) => {
    if (activeSort.value !== type) {
        activeSort.value = type;
        renderAll();
    }
};

// ==== 数据计算 ====
const plateData = computed(() => {
    return props.detailData && props.detailData.length > 0 ? props.detailData[0] : null;
});

const globalStatus = computed(() => {
    if (!plateData.value?.diagnosis?.length) return {};
    const sample = plateData.value.diagnosis[0];
    if (!sample) return {};

    const real_ucl_t2 = plateData.value.T2UCL1 || sample.T2UCL1 || 20;
    const real_ucl_q = plateData.value.QUCL || sample.QUCL || 20;

    return {
        T2_val: sample.T2,
        Q_val: sample.Q,
        T2_isFault: sample.T2 > real_ucl_t2,
        Q_isFault: sample.Q > real_ucl_q,
        UCL_T2: real_ucl_t2,
        UCL_Q: real_ucl_q
    };
});

const displayData = computed(() => {
    if (!plateData.value?.diagnosis?.length) return [];

    const rawArray = plateData.value.diagnosis.filter(d => isFinite(d.T2_cont) && isFinite(d.Q_cont));
    const targetKey = activeSort.value === 'T2' ? 'T2_cont' : 'Q_cont';

    let sortedList = [...rawArray].sort((a, b) => b[targetKey] - a[targetKey]);
    sortedList = sortedList.slice(0, 15);

    const totalT2 = sortedList.reduce((sum, item) => sum + item.T2_cont, 0);
    const totalQ = sortedList.reduce((sum, item) => sum + item.Q_cont, 0);

    let currentT2Sum = 0;
    let currentQSum = 0;

    return sortedList.map(item => {
        currentT2Sum += item.T2_cont;
        currentQSum += item.Q_cont;
        return {
            name: item.name,
            T2_cont: item.T2_cont,
            Q_cont: item.Q_cont,
            T2_pct: totalT2 ? (item.T2_cont / totalT2) * 100 : 0,
            Q_pct: totalQ ? (item.Q_cont / totalQ) * 100 : 0,
            cum_T2_pct: totalT2 ? (currentT2Sum / totalT2) * 100 : 0,
            cum_Q_pct: totalQ ? (currentQSum / totalQ) * 100 : 0
        };
    });
});

// ==== Tooltip 交互逻辑 ====
const handleHover = (event, d, type) => {
    const isT2 = type === 'T2';
    d3.select(event.currentTarget).attr('opacity', 0.8);

    const borderColor = isT2 ? '#409EFF' : '#67C23A';
    const title = isT2 ? 'T2 贡献' : 'SPE 贡献';
    const val = isT2 ? d.T2_cont : d.Q_cont;
    const pct = isT2 ? d.T2_pct : d.Q_pct;
    const cumPct = isT2 ? d.cum_T2_pct : d.cum_Q_pct;

    const htmlContent = `
        <div style="font-weight: bold; font-size: 13px; margin-bottom: 8px; color: #303133;">
            ${d.name}
        </div>
        <div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 4px;">
            <span style="color: #909399;">${title}值:</span>
            <span style="font-weight: bold; color: ${borderColor};">${val.toFixed(3)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 4px;">
            <span style="color: #909399;">单项占比:</span>
            <span style="font-weight: bold; color: #606266;">${pct.toFixed(1)}%</span>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 20px;">
            <span style="color: #909399;">累计占比:</span>
            <span style="font-weight: bold; color: #606266;">${cumPct.toFixed(1)}%</span>
        </div>
    `;
    chartTooltip.show(event, htmlContent, borderColor);
};

const handleBottomHover = (event, type) => {
    const isT2 = type === 'T2';
    d3.select(event.currentTarget).attr('opacity', 0.85); // 悬浮时整个组微微透明

    const { T2_val, Q_val, T2_isFault, Q_isFault, UCL_T2, UCL_Q } = globalStatus.value;

    const isFault = isT2 ? T2_isFault : Q_isFault;
    const borderColor = isFault ? '#F56C6C' : (isT2 ? '#409EFF' : '#67C23A');

    const title = isT2 ? '全局 T2 诊断指标' : '全局 SPE 诊断指标';
    const val = isT2 ? T2_val : Q_val;
    const ucl = isT2 ? UCL_T2 : UCL_Q;
    const statusHtml = isFault
        ? '<span style="color: #F56C6C;">偏离超限 (Fault)</span>'
        : '<span style="color: #67C23A;">正常 (Normal)</span>';

    const htmlContent = `
        <div style="font-weight: bold; font-size: 13px; margin-bottom: 8px; color: #303133;">
            ${title}
        </div>
        <div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 4px;">
            <span style="color: #909399;">当前监测值:</span>
            <span style="font-weight: bold; color: #303133;">${val.toFixed(3)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 4px;">
            <span style="color: #909399;">控制限(UCL):</span>
            <span style="font-weight: bold; color: #303133;">${ucl.toFixed(3)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 20px;">
            <span style="color: #909399;">诊断状态:</span>
            <span style="font-weight: bold;">${statusHtml}</span>
        </div>
    `;
    chartTooltip.show(event, htmlContent, borderColor);
};

const handleMouseOut = (event) => {
    d3.select(event.currentTarget).attr('opacity', 1);
    chartTooltip.hide();
};

// ==== 主图表渲染 ====
const renderMainChart = () => {
    if (!mainChartRef.value || !displayData.value.length) return;
    const { width, height } = containerSize.value;
    const actualHeight = height - containerSize.value.bottomHeight;
    if (width === 0 || actualHeight <= 0) return;

    d3.select(mainChartRef.value).selectAll('*').remove();

    const margin = { top: 0, right: 5, bottom: 0, left: 5 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = actualHeight - margin.top - margin.bottom;
    const centerX = width / 2;

    const svg = d3.select(mainChartRef.value)
        .append('svg')
        .attr('width', width)
        .attr('height', actualHeight)
        .style('display', 'block');

    const maxT2 = d3.max(displayData.value, d => d.T2_cont) || 1;
    const maxQ = d3.max(displayData.value, d => d.Q_cont) || 1;

    const y = d3.scaleBand().domain(displayData.value.map(d => d.name)).range([margin.top, actualHeight - margin.bottom]).padding(0.3);
    const xLeft = d3.scaleLinear().domain([0, maxT2 * 1.1]).range([centerX, margin.left]);
    const xRight = d3.scaleLinear().domain([0, maxQ * 1.1]).range([centerX, width - margin.right]);
    const xLeftLine = d3.scaleLinear().domain([0, 100]).range([centerX, margin.left]);
    const xRightLine = d3.scaleLinear().domain([0, 100]).range([centerX, width - margin.right]);

    const chartArea = svg.append('g');

    chartArea.append('line')
        .attr('x1', centerX).attr('y1', margin.top)
        .attr('x2', centerX).attr('y2', actualHeight - margin.bottom)
        .attr('stroke', '#dcdfe6').attr('stroke-width', 1);

    chartArea.selectAll('rect.bar-left')
        .data(displayData.value)
        .enter().append('rect')
        .attr('class', 'bar-left')
        .attr('x', d => xLeft(d.T2_cont))
        .attr('y', d => y(d.name))
        .attr('width', d => centerX - xLeft(d.T2_cont))
        .attr('height', y.bandwidth())
        .attr('fill', '#A0CFFF')
        .style('cursor', 'pointer')
        .on('mouseover', (event, d) => handleHover(event, d, 'T2'))
        .on('mousemove', (event, d) => handleHover(event, d, 'T2'))
        .on('mouseout', handleMouseOut);

    chartArea.selectAll('rect.bar-right')
        .data(displayData.value)
        .enter().append('rect')
        .attr('class', 'bar-right')
        .attr('x', centerX)
        .attr('y', d => y(d.name))
        .attr('width', d => xRight(d.Q_cont) - centerX)
        .attr('height', y.bandwidth())
        .attr('fill', '#B3E19D')
        .style('cursor', 'pointer')
        .on('mouseover', (event, d) => handleHover(event, d, 'Q'))
        .on('mousemove', (event, d) => handleHover(event, d, 'Q'))
        .on('mouseout', handleMouseOut);

    const lineLeft = d3.line().x(d => xLeftLine(d.cum_T2_pct)).y(d => y(d.name) + y.bandwidth() / 2).curve(d3.curveMonotoneY);
    const lineRight = d3.line().x(d => xRightLine(d.cum_Q_pct)).y(d => y(d.name) + y.bandwidth() / 2).curve(d3.curveMonotoneY);

    chartArea.append('path').datum(displayData.value).attr('fill', 'none').attr('stroke', '#E6A23C').attr('stroke-width', 2).attr('d', lineLeft).style('pointer-events', 'none');

    chartArea.selectAll('circle.dot-left')
        .data(displayData.value)
        .enter().append('circle')
        .attr('class', 'dot-left')
        .attr('cx', d => xLeftLine(d.cum_T2_pct))
        .attr('cy', d => y(d.name) + y.bandwidth() / 2)
        .attr('r', 4)
        .attr('fill', '#E6A23C')
        .style('cursor', 'pointer')
        .on('mouseover', (event, d) => handleHover(event, d, 'T2'))
        .on('mousemove', (event, d) => handleHover(event, d, 'T2'))
        .on('mouseout', handleMouseOut);

    chartArea.append('path').datum(displayData.value).attr('fill', 'none').attr('stroke', '#F56C6C').attr('stroke-width', 2).attr('d', lineRight).style('pointer-events', 'none');

    chartArea.selectAll('circle.dot-right')
        .data(displayData.value)
        .enter().append('circle')
        .attr('class', 'dot-right')
        .attr('cx', d => xRightLine(d.cum_Q_pct))
        .attr('cy', d => y(d.name) + y.bandwidth() / 2)
        .attr('r', 4)
        .attr('fill', '#F56C6C')
        .style('cursor', 'pointer')
        .on('mouseover', (event, d) => handleHover(event, d, 'Q'))
        .on('mousemove', (event, d) => handleHover(event, d, 'Q'))
        .on('mouseout', handleMouseOut);
};

// ==== 底部进度条图表渲染 ====
const renderBottomChart = () => {
    if (!bottomChartRef.value || !globalStatus.value.T2_val) return;
    const { width, bottomHeight } = containerSize.value;
    if (width === 0) return;

    d3.select(bottomChartRef.value).selectAll('*').remove();

    const svg = d3.select(bottomChartRef.value)
        .append('svg')
        .attr('width', width)
        .attr('height', bottomHeight)
        .style('display', 'block');

    const centerX = width / 2;
    const margin = { left: 10, right: 10 };
    const barHeight = 16;
    const yPos = (bottomHeight - barHeight) / 2;

    const { T2_val, Q_val, T2_isFault, Q_isFault, UCL_T2, UCL_Q } = globalStatus.value;

    const maxLeft = Math.max(T2_val, UCL_T2) * 1.1;
    const xLeft = d3.scaleLinear().domain([0, maxLeft]).range([centerX, margin.left]);

    const maxRight = Math.max(Q_val, UCL_Q) * 1.1;
    const xRight = d3.scaleLinear().domain([0, maxRight]).range([centerX, width - margin.right]);

    const t2_color = T2_isFault ? '#F56C6C' : '#409EFF';
    const q_color = Q_isFault ? '#F56C6C' : '#67C23A';

    // ---------------- 左侧 T2 进度条 ----------------
    const t2Group = svg.append('g')
        .style('cursor', 'pointer')
        .on('mouseover', (event) => handleBottomHover(event, 'T2'))
        .on('mousemove', (event) => handleBottomHover(event, 'T2'))
        .on('mouseout', handleMouseOut);

    // 1. T2 容器边框 (一直延伸到边界)
    t2Group.append('rect')
        .attr('x', margin.left)
        .attr('y', yPos)
        .attr('width', centerX - margin.left)
        .attr('height', barHeight)
        .attr('fill', '#f4f4f5')
        .attr('stroke', '#dcdfe6')
        .attr('stroke-width', 1)
        .attr('rx', 1);

    // 2. T2 实际填充值
    t2Group.append('rect')
        .attr('x', xLeft(T2_val))
        .attr('y', yPos)
        .attr('width', centerX - xLeft(T2_val))
        .attr('height', barHeight)
        .attr('fill', t2_color)
        .attr('rx', 2);

    // 3. T2 UCL 阈值线 (约束在柱子内部)
    t2Group.append('line')
        .attr('x1', xLeft(UCL_T2)).attr('y1', yPos)
        .attr('x2', xLeft(UCL_T2)).attr('y2', yPos + barHeight)
        .attr('stroke', '#999').attr('stroke-width', 1).attr('stroke-dasharray', '3,2');

    // 4. T2 文字 (黑色，定位在中心轴附近)
    t2Group.append('text')
        .attr('x', centerX - 10)
        .attr('y', yPos + 12)
        .attr('text-anchor', 'end')
        .text(`${T2_val.toFixed(2)}`)
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .attr('fill', '#333')
        .style('pointer-events', 'none');

    // ---------------- 右侧 SPE(Q) 进度条 ----------------
    const qGroup = svg.append('g')
        .style('cursor', 'pointer')
        .on('mouseover', (event) => handleBottomHover(event, 'Q'))
        .on('mousemove', (event) => handleBottomHover(event, 'Q'))
        .on('mouseout', handleMouseOut);

    // 1. Q 容器边框 (一直延伸到边界)
    qGroup.append('rect')
        .attr('x', centerX)
        .attr('y', yPos)
        .attr('width', width - margin.right - centerX)
        .attr('height', barHeight)
        .attr('fill', '#f4f4f5')
        .attr('stroke', '#dcdfe6')
        .attr('stroke-width', 1)
        .attr('rx', 2);

    // 2. Q 实际填充值
    qGroup.append('rect')
        .attr('x', centerX)
        .attr('y', yPos)
        .attr('width', xRight(Q_val) - centerX)
        .attr('height', barHeight)
        .attr('fill', q_color)
        .attr('rx', 2);

    // 3. Q UCL 阈值线 (约束在柱子内部)
    qGroup.append('line')
        .attr('x1', xRight(UCL_Q)).attr('y1', yPos)
        .attr('x2', xRight(UCL_Q)).attr('y2', yPos + barHeight)
        .attr('stroke', '#999').attr('stroke-width', 1).attr('stroke-dasharray', '3,2');

    // 4. Q 文字 (黑色，定位在中心轴附近)
    qGroup.append('text')
        .attr('x', centerX + 10)
        .attr('y', yPos + 12)
        .attr('text-anchor', 'start')
        .text(`${Q_val.toFixed(2)}`)
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .attr('fill', '#333')
        .style('pointer-events', 'none');
};

const renderAll = () => {
    renderMainChart();
    renderBottomChart();
};

watch(() => props.detailData, async () => {
    await nextTick();
    if (containerSize.value.width > 0 && containerSize.value.height > 0) {
        renderAll();
    }
}, { deep: true });

watch(chartsAreaRef, (newEl) => {
    if (newEl && resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver.observe(newEl);
    }
});

onMounted(() => {
    resizeObserver = new ResizeObserver(entries => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
            const entry = entries[0];
            if (entry) {
                const { width, height } = entry.contentRect;
                if (width !== containerSize.value.width || height !== containerSize.value.height) {
                    containerSize.value.width = width;
                    containerSize.value.height = height;
                    renderAll();
                }
            }
        });
    });
});

onUnmounted(() => {
    if (resizeObserver) resizeObserver.disconnect();
    if (rafId) cancelAnimationFrame(rafId);
    chartTooltip.hide();
});
</script>

<style scoped>
.pca-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: transparent;
}

.pca-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    /* padding-bottom: 8px; */
    margin-bottom: 8px;
    flex-shrink: 0;
}

.upid-box {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background-color: #f8f9fa;
}

.label-value {
    font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
    font-size: 11px;
    color: #303133;
    font-weight: bold;
}

.sort-controls {
    display: flex;
    gap: 10px;
}

.sort-btn {
    background-color: #fff;
    border: 1px solid #dcdfe6;
    border-radius: 5px;
    padding: 3px 12px;
    font-size: 11px;
    color: #606266;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
}

.sort-btn:hover {
    border-color: #c0c4cc;
}

.sort-btn.active-t2 {
    background-color: #409EFF;
    color: #fff;
    border-color: #409EFF;
    font-weight: bold;
}

.sort-btn.active-q {
    background-color: #67C23A;
    color: #fff;
    border-color: #67C23A;
    font-weight: bold;
}

.charts-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
}

.main-chart-container {
    flex: 1;
    width: 100%;
    min-height: 0;
}

.bottom-chart-container {
    height: 40px;
    flex-shrink: 0;
    width: 100%;
}

.empty-state {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>