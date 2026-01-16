<template>
    <div ref="chartRef" style="width: 100%; height: 600px;"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue';
import * as echarts from 'echarts/core';
import { SankeyChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([SankeyChart, TooltipComponent, CanvasRenderer]);

const props = defineProps({
    sankeyData: {
        type: Object,
        default: () => ({ status_cooling: null, nodes: [], links: [] })
    }
});

const chartRef = ref(null);
let chartInstance = null;

function initChart() {
    if (!chartRef.value) return;
    chartInstance = echarts.init(chartRef.value);
    updateChart();
}

function getOption(nodes, links) {
    return {
        tooltip: {
            trigger: 'item',
            formatter: (p) => {
                const d = p.data;
                if (!d) return '';

                // --- 节点 Tooltip ---
                if (p.dataType === 'node') {
                    const meta = d.meta || {};
                    const totalVal = Number(d.value).toFixed(4);

                    if (meta.type === 'feature') {
                        // 显示净值(Sum)和绝对值之和(Total)
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

            // 【关键修改】交互高亮模式
            // 'trajectory' 会高亮经过该节点的所有完整路径 (Feature -> Category -> Model)
            emphasis: {
                focus: 'trajectory'
            },

            // 布局设置
            left: '5%',
            right: '5%',
            nodeWidth: 20,
            nodeGap: 8,
            nodeAlign: 'justify',
            draggable: false, // 禁止拖拽，保持排序稳定

            // 节点标签
            label: {
                position: 'right', // 统一放在右侧或者根据位置自动
                fontSize: 11,
                formatter: (p) => {
                    const meta = p.data?.meta;
                    if (meta?.type === 'feature') {
                        const net = Number(meta.shap_value);
                        const symbol = net >= 0 ? '+' : '';
                        return `${meta.label} (${symbol}${net.toFixed(2)})`;
                    }
                    return meta?.label || p.name;
                }
            },

            // 全局线条样式
            lineStyle: {
                curveness: 0.5,
                opacity: 0.3 // 默认淡一点，hover 时高亮更明显
            }
        }]
    };
}

async function updateChart() {
    await nextTick();
    if (!chartInstance) return;
    console.log(props.sankeyData);

    const nodes = props.sankeyData?.nodes || [];
    const links = props.sankeyData?.links || [];

    if (!nodes.length || !links.length) {
        chartInstance.clear();
        return;
    }

    chartInstance.setOption(getOption(nodes, links), true);
    chartInstance.resize();
}

// 监听 sankeyData 变化
watch(
    () => props.sankeyData,
    () => updateChart(),
    { deep: true }
);

onMounted(() => initChart());

onUnmounted(() => {
    if (chartInstance) {
        chartInstance.dispose();
        chartInstance = null;
    }
});
</script>
