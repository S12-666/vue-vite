<script setup>
import { ref, onMounted, onBeforeUnmount, watch, shallowRef, nextTick } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
    curveData: {
        type: Object,
        default: () => ({ temp: [] })
    }
});

const chartRef = ref(null);
const chartInstance = shallowRef(null);
let resizeObserver = null;
const colorPalette = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'];

const getBaseOptions = () => ({
    textStyle: {
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    },
    title: {
        text: 'Temperature Surface',
        left: 'center',
        top: 5,
        textStyle: {
            fontWeight: 700,
            fontSize: 16,
            color: '#333'
        }
    },
    legend: {
        top: 8,
        right: '4%',
        type: 'scroll',
        itemGap: 15,
        textStyle: { color: '#666' },
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'line',
            lineStyle: { color: '#999', type: 'dashed' },
            snap: true
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#ccc',
        borderWidth: 1,
        formatter: (params) => {
            if (!params.length) return '';
            let html = `<div style="font-weight:bold;border-bottom:1px solid #eee;padding-bottom:5px;margin-bottom:5px;">
                        Position: ${parseFloat(params[0].axisValue).toFixed(2)} m
                        </div>`;
            params.forEach(item => {
                if (item.value !== undefined && item.value !== null) {
                    html += `<div style="display:flex;justify-content:space-between;min-width:140px;">
                                <span>${item.marker} ${item.seriesName}</span>
                                <span style="font-weight:bold">${Number(item.value).toFixed(1)}°C</span>
                            </div>`;
                }
            });
            return html;
        }
    },
    grid: {
        left: '3%',
        right: '5%',
        bottom: '5%',
        top: '12%',
        containLabel: true
    },
    xAxis: {
        type: 'category', // 【关键】确认为类目轴
        name: 'Position (m)',
        nameLocation: 'middle',
        nameGap: 25,
        nameTextStyle: { fontWeight: 500, color: '#333', fontSize: 13 },
        boundaryGap: false,
        splitLine: { show: false },
        axisLabel: {
            formatter: (value) => {
                return parseFloat(value).toFixed(2);
            }
        },
        axisTick: { show: true },
        axisLine: { show: true, lineStyle: { color: '#333' } },
        data: []
    },
    yAxis: {
        type: 'value',
        name: 'Temp (°C)',
        scale: true,
        nameLocation: 'middle',
        nameRotate: 90,
        nameGap: 40,
        nameTextStyle: { align: 'center', color: '#333', fontWeight: '500', fontSize: 13 },
        splitLine: { show: true, lineStyle: { color: '#E0E6F1' } },
        axisLine: { show: true, lineStyle: { color: '#333' } },
        axisTick: { show: true },
        axisLabel: { color: '#666' }
    },
    series: []
});

const updateChart = () => {
    if (!chartInstance.value) return;

    const fullData = props.curveData || {};
    const tempData = fullData.temp;

    if (!tempData || Object.keys(tempData).length === 0) {
        chartInstance.value.clear();
        return;
    }

    const seriesList = [];
    const legendData = [];

    let xAxisData = [];
    if (tempData.p6 && tempData.p6.position) {
        xAxisData = tempData.p6.position;
    } else {
        const firstKey = Object.keys(tempData)[0];
        xAxisData = tempData[firstKey]?.position || [];
    }

    Object.keys(tempData).forEach((key, index) => {
        const item = tempData[key];
        if (item && item.data) {
            seriesList.push({
                name: key.toUpperCase(),
                type: 'line',
                data: item.data,
                smooth: true,
                showSymbol: false,
                symbol: 'emptyCircle',
                symbolSize: 8,
                itemStyle: { color: colorPalette[index % colorPalette.length] }
            });
            legendData.push(key.toUpperCase());
        }
    });

    const options = getBaseOptions();

    options.xAxis.data = xAxisData;

    options.series = seriesList;
    options.legend.data = legendData;

    chartInstance.value.setOption(options, true);
};

const initChart = () => {
    if (chartRef.value) {
        chartInstance.value = echarts.init(chartRef.value);
        updateChart();
        resizeObserver = new ResizeObserver(() => chartInstance.value?.resize());
        resizeObserver.observe(chartRef.value);
    }
};

watch(
    () => props.curveData,
    () => { nextTick(updateChart); },
    { deep: true }
);

onMounted(() => { initChart(); });

onBeforeUnmount(() => {
    if (chartInstance.value) {
        chartInstance.value.dispose();
        chartInstance.value = null;
    }
    if (resizeObserver) {
        resizeObserver.disconnect();
    }
});
</script>

<template>
    <div ref="chartRef" style="height: 100%; width: 100%"></div>
</template>