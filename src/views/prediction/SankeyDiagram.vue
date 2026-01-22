<template>
    <div ref="chartRef" :style="{ width: '100%', height: CHART_CONFIG.height }"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, shallowRef, watch, nextTick } from 'vue';
import * as echarts from 'echarts/core';
import { SankeyChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([SankeyChart, TooltipComponent, CanvasRenderer]);

// ==========================================
// 🛠️ 配置区域
// ==========================================
const CHART_CONFIG = {
    height: '400px',
    top: 10,
    bottom: 10,
    left: '1%',
    right: '3%',
    nodeWidth: 20,
    nodeGap: 8,       // 保持固定间距，让数据去填满剩余空间
    labelThreshold: 0.15
};

const POS_COLOR = '#e74c3c';
const NEG_COLOR = '#3498db';

const props = defineProps({
    sankeyData: {
        type: Object,
        default: () => ({ status_cooling: null, nodes: [], links: [] })
    }
});

const chartRef = ref(null);
const chartInstance = shallowRef(null);
let resizeObserver = null;

function disposeChart() {
    if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
    }
    if (chartInstance.value) {
        chartInstance.value.dispose();
        chartInstance.value = null;
    }
}

function initChart() {
    disposeChart();
    if (!chartRef.value) return;
    chartInstance.value = echarts.init(chartRef.value);
    updateChart();
    resizeObserver = new ResizeObserver(() => chartInstance.value?.resize());
    resizeObserver.observe(chartRef.value);
}

// ==========================================
// 🛠️ Tooltip 修改：使用 rawValue 显示真实值
// ==========================================
const getTooltipFormatter = (p) => {
    const d = p.data;
    if (!d) return '';

    if (p.dataType === 'node') {
        const meta = d.meta || {};

        // 【核心修改】优先取 rawValue (真实值)，取不到则取 value
        // 这样即使图表上的节点被放大了，悬浮显示的数值依然是真实的
        const realValue = meta.rawValue !== undefined ? meta.rawValue : d.value;
        const totalVal = Number(realValue).toFixed(4);

        if (meta.type === 'feature') {
            const netVal = Number(meta.shap_value).toFixed(4);
            const rows = (meta.items || [])
                .map(x => {
                    const s = Number(x.shap_value);
                    const color = s >= 0 ? POS_COLOR : NEG_COLOR;
                    return `<span style="color:${color}">●</span> ${x.model}: ${s.toFixed(4)} (val:${x.actual_value})`;
                }).join('<br/>');

            return `
                <div style="font-size:13px;">
                    <b>${meta.label}</b><br/>
                    真实权重: ${totalVal}<br/>
                    净 SHAP 值: ${netVal}<br/>
                    <hr style="margin:5px 0;border:0;border-top:1px solid #ddd"/>
                    ${rows}
                </div>
            `;
        }
        return `<div><b>${meta.label}</b><br/>权重: ${totalVal}</div>`;
    }

    if (p.dataType === 'edge') {
        // 这里的 Value 是被放大过的，用于展示流量粗细
        // 如果想显示真实流量，可以在 logic 层把 rawValue 也存进 link.meta
        const meta = d.meta || {};
        const signText = meta.sign === 'pos' ? '(+)' : '(-)';
        return `${d.source} → ${d.target}<br/>${signText}`;
    }
    return '';
};

const getLabelFormatter = (p, isHover = false) => {
    const meta = p.data?.meta;
    // 注意：这里的 labelThreshold 判断的是放大后的 value
    // 如果希望按真实值判断，可以使用 meta.rawValue
    const value = meta?.rawValue || p.data?.value || 0;

    if (!isHover && value < CHART_CONFIG.labelThreshold) {
        return '';
    }
    if (meta?.type === 'feature') return `${meta.label}`;
    return meta?.label || p.name;
};

// ==========================================
// 🛠️ Option 配置：去除所有高度补偿逻辑
// ==========================================
function getOption(nodes, links) {
    return {
        tooltip: {
            trigger: 'item',
            confine: true,
            formatter: getTooltipFormatter
        },
        series: [{
            type: 'sankey',
            data: nodes,
            links: links,
            left: CHART_CONFIG.left,
            right: CHART_CONFIG.right,
            top: CHART_CONFIG.top,
            bottom: CHART_CONFIG.bottom,
            nodeWidth: CHART_CONFIG.nodeWidth,
            nodeGap: CHART_CONFIG.nodeGap,

            // 两端对齐：保证左右两列都能顶天立地
            nodeAlign: 'justify',

            // 0 迭代：防止节点乱跑，严格按照数据大小排序
            layoutIterations: 0,

            draggable: false,

            label: {
                position: 'right',
                fontSize: 11,
                distance: 5,
                formatter: (p) => getLabelFormatter(p, false)
            },
            emphasis: {
                focus: 'trajectory',
                label: {
                    show: true,
                    formatter: (p) => getLabelFormatter(p, true)
                }
            },
            lineStyle: {
                curveness: 0.5,
                color: 'gradient',
                opacity: 0.3
            }
        }]
    };
}

async function updateChart() {
    await nextTick();
    if (!chartInstance.value) return;

    const nodes = props.sankeyData?.nodes || [];
    const links = props.sankeyData?.links || [];

    if (!nodes.length || !links.length) {
        chartInstance.value.clear();
        return;
    }

    chartInstance.value.setOption(getOption(nodes, links), { notMerge: true });
}

watch(() => props.sankeyData, () => updateChart(), { deep: true });
onMounted(() => initChart());
onBeforeUnmount(() => disposeChart());
</script>