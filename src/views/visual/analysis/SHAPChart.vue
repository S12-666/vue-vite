<template>
    <div class="shap-container">
        <template v-if="metricsData.length > 0">
            <div class="shap-header">
                <div class="header-left">
                    <div class="upid-box">
                        <span class="label-value">{{ upid }}</span>
                    </div>

                    <div class="upid-box" v-if="activeMetricId">
                        <span class="label-value">{{ activeMetricId.toUpperCase() }}</span>
                    </div>
                </div>

                <div class="metrics-svg-container" ref="metricsNavRef"></div>
            </div>

            <div class="chart-area" ref="chartsAreaRef">
                <div class="d3-container" ref="chartRef"></div>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick, shallowRef } from 'vue';
import * as d3 from 'd3';
import { chartTooltip } from '@/utils/tooltip_utils/tooltip.js';

const props = defineProps({
    shapData: {
        type: Object,
        default: () => null
    }
});

// ==== 状态管理 ====
const upid = ref('--');
const metricsData = ref([]);
const activeMetricId = ref('');

const chartRef = ref(null);
const chartsAreaRef = ref(null);
const metricsNavRef = ref(null);

let resizeObserver = null;
let rafId = null;
const containerSize = shallowRef({ width: 0, height: 0 });

const LABEL_COLORS = {
    1: '#409eff', // 正常
    0: '#f56c6c', // 异常
    2: '#b5bac2'  // 无标签
};

const switchMetric = (id) => {
    if (activeMetricId.value !== id) {
        activeMetricId.value = id;
        renderMetricsNav();
        renderChart();
    }
};

// ==== 渲染顶部 D3 矩形导航色块 ====
const renderMetricsNav = () => {
    if (!metricsNavRef.value || !metricsData.value.length) return;

    const boxSize = 16;
    const gap = 8;
    const strokePadding = 2;
    const totalWidth = metricsData.value.length * (boxSize + gap) + (strokePadding * 2);
    const height = 24;

    const svg = d3.select(metricsNavRef.value)
        .selectAll('svg')
        .data([1])
        .join('svg')
        .attr('width', totalWidth)
        .attr('height', height);

    svg.selectAll('.label-rect')
        .data(metricsData.value, d => d.id)
        .join('rect')
        .attr('class', 'label-rect')
        .attr('x', (d, i) => strokePadding + i * (boxSize + gap))
        .attr('y', (height - boxSize) / 2)
        .attr('width', boxSize)
        .attr('height', boxSize)
        .attr('rx', 2)
        .attr('fill', d => LABEL_COLORS[d.labelStatus] || LABEL_COLORS[2])
        .attr('stroke', d => activeMetricId.value === d.id ? '#303133' : null)
        .attr('stroke-width', d => activeMetricId.value === d.id ? 2 : null)
        .style('cursor', 'pointer')
        .on('click', (event, d) => {
            switchMetric(d.id);
        })
        .on('mousemove', (event, d) => {
            event.stopPropagation();
            const borderColor = LABEL_COLORS[d.labelStatus] || LABEL_COLORS[2];

            // 💡 统一展示异常概率
            const htmlContent = `
                <div style="font-weight: bold; font-size: 13px; color: #333; margin-bottom: 4px;">
                    ${d.name.toUpperCase()}
                </div>
                <div style="font-size: 12px; color: #606266;">
                    异常概率: <span style="color:${borderColor}; font-weight:bold;">${d.abnormalProb.toFixed(2)}%</span>
                </div>
            `;

            chartTooltip.show(event, htmlContent, borderColor);
            if (activeMetricId.value !== d.id) {
                d3.select(event.currentTarget).attr('stroke', '#333').attr('stroke-width', 1);
            }
        })
        .on('mouseout', (event, d) => {
            chartTooltip.hide();
            if (activeMetricId.value !== d.id) {
                d3.select(event.currentTarget).attr('stroke', null);
            }
        });
};

// ==== 计算瀑布图累加数据 ====
const getWaterfallData = () => {
    const metric = metricsData.value.find(m => m.id === activeMetricId.value);
    if (!metric) return [];

    let currentSum = metric.baseValue || 0;
    const steps = [];

    metric.features.forEach(f => {
        steps.push({
            name: f.name,
            val: f.value,
            actualValue: f.actualValue,
            start: currentSum,
            end: currentSum + f.value
        });
        currentSum += f.value;
    });
    return steps;
};

// ==== 解析数据 ====
watch(() => props.shapData, (newData) => {
    // 💡 纯粹的按需显示：如果没有数据，清空状态，v-if 会自动卸载 DOM
    if (!newData || !newData.predictions) {
        metricsData.value = [];
        activeMetricId.value = '';
        return;
    }

    upid.value = newData.upid || '--';

    const nameMap = {
        'pa': '抗拉(PA)',
        'pf': '冲击(PF)',
        'pn': '落锤(PN)',
        'ps': '硬度(PS)',
        'gs': '晶粒度(GS)'
    };

    const parsedMetrics = [];
    for (const [key, detail] of Object.entries(newData.predictions)) {
        const isPCA = detail.model_metrics?.model_type === 'PCA_Reconstruction';

        // 💡 统一使用异常概率
        let abnormalProb = (detail.abnormal_prob || 0) * 100;
        let labelStatus = isPCA ? (!detail.instance_metrics?.is_safe ? 0 : 1) : (abnormalProb > 50 ? 0 : 1);

        parsedMetrics.push({
            id: key,
            name: nameMap[key] || key,
            abnormalProb: abnormalProb, // 统一存为概率
            labelStatus: labelStatus,
            baseValue: detail.shap_base_value,
            features: (detail.top_features || []).slice(0, 10).map(f => ({
                name: f.feature,
                value: f.shap_value,
                actualValue: f.actual_value
            }))
        });
    }

    metricsData.value = parsedMetrics;

    if (parsedMetrics.length > 0) {
        if (!activeMetricId.value || !parsedMetrics.find(m => m.id === activeMetricId.value)) {
            activeMetricId.value = parsedMetrics[0].id;
        }

        // 确保 v-if 渲染完成 DOM 后，再执行 D3 绘制和绑定 Observer
        nextTick(() => {
            renderMetricsNav();
            renderChart();

            if (chartsAreaRef.value && resizeObserver) {
                resizeObserver.observe(chartsAreaRef.value);
            }
        });
    }
}, { immediate: true, deep: true });

// ==== 渲染水平双向柱状图 (SHAP风格) ====
const renderChart = () => {
    if (!chartRef.value) return;
    const { width, height } = containerSize.value;
    if (width === 0 || height <= 0) return;

    const data = getWaterfallData();

    // 拦截无数据的情况
    if (!data.length) {
        d3.select(chartRef.value).selectAll('*').remove();
        return;
    }

    d3.select(chartRef.value).selectAll('*').remove();

    const margin = { top: 0, right: 35, bottom: 0, left: 35 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(chartRef.value)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('display', 'block');

    const chartArea = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const minX = d3.min(data, d => Math.min(d.start, d.end));
    const maxX = d3.max(data, d => Math.max(d.start, d.end));

    const padding = (maxX - minX) * 0.05 || 1;
    const x = d3.scaleLinear()
        .domain([minX - padding, maxX + padding])
        .range([0, innerWidth]);

    const y = d3.scaleBand()
        .domain(data.map(d => d.name))
        .range([0, innerHeight])
        .padding(0.5);

    for (let i = 0; i < data.length - 1; i++) {
        chartArea.append('line')
            .attr('x1', x(data[i].end))
            .attr('y1', y(data[i].name) + y.bandwidth())
            .attr('x2', x(data[i + 1].start))
            .attr('y2', y(data[i + 1].name))
            .attr('stroke', '#C0C4CC')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '4,2');
    }

    const bars = chartArea.selectAll('.shap-bar-group')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'shap-bar-group')
        .style('cursor', 'pointer')
        .on('mouseover', function (event, d) {
            d3.select(this).select('path').attr('opacity', 0.8);
            const isPos = d.val >= 0;
            const color = isPos ? '#F56C6C' : '#409EFF';
            const html = `
                <div style="font-weight:bold; color:#303133; margin-bottom:4px;">${d.name}</div>
                <div style="color:#606266; font-size:12px;">实际值: <span style="color:#303133; font-weight:bold;">${d.actualValue}</span></div>
                <div style="color:#606266; font-size:12px;">
                    SHAP贡献: <span style="color:${color}; font-weight:bold;">${isPos ? '+' : ''}${d.val.toFixed(3)}</span>
                </div>
            `;
            chartTooltip.show(event, html, color);
        })
        .on('mouseout', function () {
            d3.select(this).select('path').attr('opacity', 1);
            chartTooltip.hide();
        });

    bars.append('path')
        .attr('d', d => {
            const sx = x(d.start);
            const ex = x(d.end);
            const yPos = y(d.name);
            const h = y.bandwidth();
            const isPos = d.val >= 0;
            const aw = Math.min(8, Math.abs(ex - sx));

            if (isPos) {
                return `M ${sx} ${yPos} L ${ex - aw} ${yPos} L ${ex} ${yPos + h / 2} L ${ex - aw} ${yPos + h} L ${sx} ${yPos + h} Z`;
            } else {
                return `M ${sx} ${yPos} L ${ex + aw} ${yPos} L ${ex} ${yPos + h / 2} L ${ex + aw} ${yPos + h} L ${sx} ${yPos + h} Z`;
            }
        })
        .attr('fill', d => d.val >= 0 ? '#F56C6C' : '#409EFF');

    bars.append('text')
        .attr('x', d => Math.min(x(d.start), x(d.end)))
        .attr('y', d => y(d.name) - 4)
        .text(d => d.name)
        .attr('font-size', '11px')
        .attr('fill', '#606266');

    bars.append('text')
        .attr('x', d => d.val >= 0 ? x(d.end) + 4 : x(d.end) - 4)
        .attr('y', d => y(d.name) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', d => d.val >= 0 ? 'start' : 'end')
        .text(d => (d.val >= 0 ? '+' : '') + d.val.toFixed(3))
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .attr('fill', d => d.val >= 0 ? '#F56C6C' : '#409EFF');
};

// ==== 尺寸监听与生命周期 ====
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
                    if (metricsData.value.length > 0) {
                        renderChart();
                    }
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
.shap-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: transparent;
}

.shap-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 8px;
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

.metrics-svg-container {
    display: flex;
    align-items: center;
}

.chart-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    margin-top: 5px;
}

.d3-container {
    flex: 1;
    width: 100%;
    min-height: 0;
}
</style>