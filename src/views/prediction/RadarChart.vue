<template>
    <div class="radar-wrapper" style="width: 100%; height: 100%; min-height: 250px;">
        <div ref="chartRef" class="radar-chart-container"></div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
    radarData: {
        type: Object,
        default: () => ({
            indicators: [],
            values: [],
            bgColors: [],
            rawData: []
        })
    }
});

const chartRef = ref(null);
let myChart = null;
let resizeObserver = null;

const setupResizeObserver = () => {
    if (resizeObserver) resizeObserver.disconnect();
    resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0) {
                window.requestAnimationFrame(() => {
                    if (!myChart) initChart();
                    else myChart.resize();
                });
            }
        }
    });
    if (chartRef.value) resizeObserver.observe(chartRef.value);
};

const initChart = () => {
    if (!chartRef.value) return;
    if (chartRef.value.clientWidth === 0) return;
    if (myChart) myChart.dispose();
    myChart = echarts.init(chartRef.value);
    setOptions();
};

const renderBackgroundItem = (params, api) => {
    const index = api.value(0);
    const r = api.value(1);
    const center = api.coord([0, 0]);
    const currentVertex = api.coord([r, index]);

    // 由于下面设置了 inverse: true (顺时针)，这里的 index 计算逻辑会自动匹配视觉上的顺时针相邻
    const nextIndex = (index + 1) % 5;
    const prevIndex = (index - 1 + 5) % 5;
    const nextVertex = api.coord([r, nextIndex]);
    const prevVertex = api.coord([r, prevIndex]);

    const midNext = [(currentVertex[0] + nextVertex[0]) / 2, (currentVertex[1] + nextVertex[1]) / 2];
    const midPrev = [(currentVertex[0] + prevVertex[0]) / 2, (currentVertex[1] + prevVertex[1]) / 2];
    const color = api.visual('color');

    return {
        type: 'polygon',
        shape: { points: [center, midPrev, currentVertex, midNext] },
        style: { fill: color, stroke: '#B0C4DE', lineWidth: 2 },
        styleEmphasis: { fill: color, stroke: '#409EFF', lineWidth: 3 }
    };
};

const setOptions = () => {
    if (!myChart) return;
    if (!props.radarData.indicators || props.radarData.indicators.length === 0) return;
    if (!props.radarData.values || props.radarData.values.length === 0) return;

    const { indicators, values, bgColors, rawData } = props.radarData;

    const backgroundData = indicators.map((item, index) => ({
        name: item.name,
        value: [index, 1],
        itemStyle: { color: bgColors[index] || '#eee' },
        raw: rawData && rawData[index] ? rawData[index] : {}
    }));

    // 【边距控制】
    // 通过 center 将图表整体向下移一点，模拟 margin-top，防止顶部文字被切
    const chartCenter = ['50%', '55%'];

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            confine: true,
            formatter: (params) => {
                if (params.seriesType === 'custom') {
                    const raw = params.data.raw || {};
                    const statusStr = raw.pred_label === 1 ? '正常' : '异常';
                    const colorStr = raw.pred_label === 1 ? '#409EFF' : '#F56C6C';
                    return `
                        <div style="margin-bottom:5px; font-weight:bold; color:${colorStr}">
                        ${params.name}
                        </div>
                        状态: ${statusStr}<br/>
                        异常概率: ${raw.abnormal_prob ? (raw.abnormal_prob * 100).toFixed(2) + '%' : 'N/A'}
                        `;
                } else {
                    let htmlStr = ``;
                    if (Array.isArray(params.value)) {
                        params.value.forEach((val, index) => {
                            const indicatorName = props.radarData.indicators[index]?.name || '';
                            htmlStr += `
                                    <div style="display:flex; width:80px;">
                                    <span>${indicatorName}:</span>
                                    <span>${(val * 100).toFixed(1)}%</span>
                                    </div>
                            `;
                        });
                    }
                    return htmlStr;
                }
            }
        },
        polar: {
            radius: '75%', // 缩小半径以留出更多边距
            center: chartCenter
        },
        angleAxis: {
            type: 'category',
            data: indicators.map(i => i.name),
            startAngle: 90,

            // 【关键修改】!!!
            // ECharts 坐标轴没有 clockwise 属性。
            // inverse: true 表示"反向"，对于极坐标轴来说，反向=顺时针。
            // 这会让背景五边形的排列顺序和雷达图（默认顺时针）完全一致。
            inverse: true,

            boundaryGap: false,
            splitLine: { show: false },
            axisLine: { show: false },
            axisLabel: { show: false }
        },
        radiusAxis: {
            min: 0, max: 1, axisLine: { show: false }, axisLabel: { show: false }, splitLine: { show: false }
        },
        radar: {
            indicator: indicators,
            center: chartCenter, // 保持与 polar 一致
            radius: '55%', // 保持比 polar 小一圈
            startAngle: 90,
            splitNumber: 4,
            shape: 'polygon',
            nameGap: 30,
            axisName: {
                color: '#666', fontWeight: 'bold', fontSize: 14,
                formatter: (val) => `{a|${val}}`,
                rich: {
                    a: {
                        padding: [4, 8], borderRadius: 4, backgroundColor: '#f5f7fa', color: '#333',
                        shadowColor: 'rgba(0,0,0,0.1)', shadowBlur: 2
                    }
                }
            },
            splitLine: { lineStyle: { color: 'rgba(0,0,0,0.1)' } },
            splitArea: { show: false },
            axisLine: { show: true, lineStyle: { color: 'rgba(0,0,0,0.15)' } }
        },
        series: [
            {
                type: 'custom',
                coordinateSystem: 'polar',
                renderItem: renderBackgroundItem,
                data: backgroundData,
                z: 1
            },
            {
                type: 'radar',
                z: 2,
                symbol: 'rect',
                symbolSize: 8,
                data: [
                    {
                        value: values,
                        name: '预测结果',
                        itemStyle: { color: '#409EFF' },
                        lineStyle: { width: 2, type: 'dashed', color: '#409EFF' },
                        areaStyle: {
                            color: {
                                type: 'radial', x: 0.5, y: 0.5, r: 0.5,
                                colorStops: [
                                    { offset: 0, color: 'rgba(64, 158, 255, 0.1)' },
                                    { offset: 1, color: 'rgba(64, 158, 255, 0.6)' }
                                ],
                                global: false
                            }
                        },
                        label: {
                            show: true,
                            formatter: (params) => (params.value * 100).toFixed(1) + '%',
                            fontSize: 11, color: '#333', position: 'top', distance: 8
                        }
                    }
                ]
            }
        ]
    };

    myChart.setOption(option);
};

watch(() => props.radarData, (val) => { if (myChart && val && val.indicators && val.indicators.length > 0) setOptions(); }, { deep: true });
onUnmounted(() => { if (resizeObserver) resizeObserver.disconnect(); if (myChart) myChart.dispose(); });
onMounted(() => setupResizeObserver());
</script>

<style scoped>
.radar-chart-container {
    width: 100%;
    height: 100%;
    min-height: 250px;
}
</style>