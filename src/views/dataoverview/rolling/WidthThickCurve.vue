<script setup>
import { ref, onMounted, onBeforeUnmount, watch, shallowRef, nextTick } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
    curveData: {
        type: Object,
        default: () => ({ Passes: [], Width: [], Thickness: [] })
    }
});

const chartRef = ref(null);
const chartInstance = shallowRef(null);

let resizeObserver = null;

// 定义基础配置
const getBaseOptions = () => ({
    textStyle: {
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    },
    title: {
        text: 'Change of Thick & Width',
        left: 'center',
        top: 0,
        textStyle: {
            fontWeight: 700,
            fontSize: 15,
            color: '#333'
        }
    },
    legend: [
        {
            data: ['Thick', 'Width'],
            top: 8,
            right: '5%',
            textStyle: { color: '#666' },
            itemGap: 15
        }
    ],
    tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', snap: true },
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: '#ccc',
        borderWidth: 1,
        textStyle: { color: '#333' },
        formatter: function (params) {
            if (!Array.isArray(params) || params.length === 0) return '';
            const xVal = params[0].name;
            let html = `<b>Pass: ${xVal}</b><br/>`;
            params.forEach(item => {
                const val = item.value;
                if (val !== undefined && val !== null) {
                    const unit = item.seriesName === 'Width' ? ' m' : ' mm';
                    html += `${item.marker} ${item.seriesName}: ${val}${unit}<br/>`;
                }
            });
            return html;
        }
    },
    grid: {
        left: '7%',
        right: '7%',
        bottom: '15%',
        top: '12%',
        containLabel: false
    },
    xAxis: {
        type: 'category',
        name: 'Passes',
        nameLocation: 'middle',
        nameGap: 30, // 调整X轴标题距离
        nameTextStyle: { lineHeight: 15, fontWeight: 500, color: '#333', fontSize: 13 },
        boundaryGap: false,
        axisLabel: { formatter: '{value}' },
        axisTick: { show: true },
        axisLine: { show: true, lineStyle: { color: '#333' } }, // X轴底线保留淡淡的灰色
        data: []
    },
    yAxis: [
        {
            type: 'value',
            name: 'Thick(mm)',
            position: 'left',
            nameLocation: 'middle',
            nameRotate: 90,
            nameGap: 35,
            nameTextStyle: { padding: [0, 0, 0, 0], align: 'center', color: '#333', fontWeight: '500', fontSize: 13 },
            splitLine: { show: false },
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#666' }
        },
        {
            type: 'value',
            name: 'Width(m)',
            position: 'right',
            alignTicks: true,
            nameLocation: 'middle',
            nameRotate: -90,
            nameGap: 35,
            nameTextStyle: { padding: [0, 0, 0, 0], align: 'center', color: '#333', fontWeight: '500', fontSize: 13 },
            splitLine: { show: true, lineStyle: { color: '#E0E6F1' } },
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { formatter: '{value}', color: '#666' }
        }
    ],
    series: []
});

const updateChart = () => {
    if (!chartInstance.value) return;

    const rawData = props.curveData || {};
    const passes = rawData.Passes || [];

    if (passes.length === 0) {
        chartInstance.value.clear();
        return;
    }

    const processThick = (dataArray) => {
        return (dataArray || []).map(val => val !== null ? parseFloat((val * 100).toFixed(3)) : null);
    };
    const series = [
        {
            name: 'Thick',
            type: 'line',
            yAxisIndex: 0,
            data: processThick(rawData.Thickness) || [],
            smooth: false,
            showSymbol: false,
            symbol: 'emptyCircle',
            symbolSize: 8,
            itemStyle: { color: '#9400D3' },
            lineStyle: { width: 2 }
        },
        {
            name: 'Width',
            type: 'line',
            yAxisIndex: 1,
            data: rawData.Width || [],
            smooth: false,
            showSymbol: false,
            symbol: 'emptyCircle',
            symbolSize: 8,
            itemStyle: { color: '#FFB90F' },
            lineStyle: { width: 2 }
        }
    ];

    const options = getBaseOptions();
    options.xAxis.data = passes;
    options.series = series;

    chartInstance.value.setOption(options, true);
};

const initChart = () => {
    if (chartRef.value) {
        chartInstance.value = echarts.init(chartRef.value);
        updateChart();
        resizeObserver = new ResizeObserver(() => {
            chartInstance.value?.resize();
        });
        resizeObserver.observe(chartRef.value);
    }
};

watch(
    () => props.curveData,
    () => { nextTick(updateChart); },
    { deep: true }
);

onMounted(() => {
    initChart();
});

onBeforeUnmount(() => {
    if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
    }
    if (chartInstance.value) {
        chartInstance.value.dispose();
        chartInstance.value = null;
    }
});
</script>

<template>
    <div ref="chartRef" style="height: 100%; width: 100%"></div>
</template>