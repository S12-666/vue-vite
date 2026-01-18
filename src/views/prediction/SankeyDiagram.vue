<template>
    <div ref="chartRef" style="width: 100%; height: 600px;"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, shallowRef, watch, nextTick } from 'vue';
import * as echarts from 'echarts/core';
import { SankeyChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// 注册 ECharts 组件
echarts.use([SankeyChart, TooltipComponent, CanvasRenderer]);

const POS_COLOR = '#e74c3c'; // 正向红
const NEG_COLOR = '#3498db'; // 负向蓝

const props = defineProps({
    sankeyData: {
        type: Object,
        default: () => ({ status_cooling: null, nodes: [], links: [] })
    }
});

const chartRef = ref(null);
// 使用 shallowRef 存储 chart 实例，性能更好
const chartInstance = shallowRef(null);
// 定义 Observer 变量
let resizeObserver = null;

// --- 核心修改：统一销毁逻辑 ---
function disposeChart() {
    // 1. 断开监听
    if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
    }
    // 2. 销毁实例
    if (chartInstance.value) {
        chartInstance.value.dispose();
        chartInstance.value = null;
    }
}

// --- 核心修改：初始化与监听 ---
function initChart() {
    // 初始化前先清理
    disposeChart();

    if (!chartRef.value) return;

    // 初始化实例
    chartInstance.value = echarts.init(chartRef.value);

    // 渲染数据
    updateChart();

    // 添加 Resize 监听
    resizeObserver = new ResizeObserver(() => {
        chartInstance.value?.resize();
    });
    resizeObserver.observe(chartRef.value);
}

// 配置项生成逻辑 (保持原样，未修改)
function getOption(nodes, links) {
    return {
        tooltip: {
            trigger: 'item',
            confine: true, // 建议加上：防止 tooltip 超出容器被遮挡
            formatter: (p) => {
                const d = p.data;
                if (!d) return '';

                // --- 节点 Tooltip ---
                if (p.dataType === 'node') {
                    const meta = d.meta || {};
                    const totalVal = Number(d.value).toFixed(4);

                    if (meta.type === 'feature') {
                        const netVal = Number(meta.shap_value).toFixed(4);
                        const rows = (meta.items || [])
                            .map(x => {
                                const s = Number(x.shap_value);
                                const color = s >= 0 ? POS_COLOR : NEG_COLOR;
                                return `<span style="color:${color}">●</span> ${x.model}: ${s.toFixed(4)} (val:${x.actual_value})`;
                            })
                            .join('<br/>');

                        return `
                            <div style="font-size:13px;">
                                <b>${meta.label}</b><br/>
                                绝对值占比权重: ${totalVal}<br/>
                                净 SHAP 值: ${netVal}<br/>
                                <hr style="margin:5px 0;border:0;border-top:1px solid #ddd"/>
                                ${rows}
                            </div>
                        `;
                    }
                    return `<div><b>${meta.label}</b><br/>权重: ${totalVal}</div>`;
                }

                // --- 连线 Tooltip ---
                if (p.dataType === 'edge') {
                    const meta = d.meta || {};
                    const val = Number(d.value).toFixed(4);
                    const signText = meta.sign === 'pos' ? '正向贡献 (+)' : '负向贡献 (-)';

                    if (meta.type === 'f2c') {
                        return `${meta.feature} → ${meta.category}<br/>${signText}: ${val}`;
                    }
                    if (meta.type === 'c2m') {
                        return `${meta.category} → ${meta.model}<br/>${signText}: ${val}`;
                    }
                    return `${d.source} → ${d.target} : ${val}`;
                }
                return '';
            }
        },
        series: [{
            type: 'sankey',
            data: nodes,
            links: links,
            emphasis: {
                focus: 'trajectory'
            },
            left: '5%',
            right: '5%',
            nodeWidth: 15,
            nodeGap: 5,
            nodeAlign: 'justify',
            draggable: false,
            label: {
                position: 'right',
                fontSize: 11,
                formatter: (p) => {
                    const meta = p.data?.meta;
                    if (meta?.type === 'feature') {
                        return `${meta.label}`;
                    }
                    return meta?.label || p.name;
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

    // 注意：这里用 console.log 调试数据
    // console.log(props.sankeyData);

    const nodes = props.sankeyData?.nodes || [];
    const links = props.sankeyData?.links || [];

    if (!nodes.length || !links.length) {
        chartInstance.value.clear();
        return;
    }

    chartInstance.value.setOption(getOption(nodes, links), true);
}

// 监听数据变化
watch(
    () => props.sankeyData,
    () => updateChart(),
    { deep: true }
);

// 生命周期
onMounted(() => {
    initChart();
});

onBeforeUnmount(() => {
    disposeChart();
});
</script>