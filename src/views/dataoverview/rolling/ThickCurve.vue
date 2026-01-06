<script setup>
import { ref, onMounted, onBeforeUnmount, watch, shallowRef, nextTick } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
    curveData: {
        type: Object,
        default: () => ({ position: [], centerthickness: [], leftthickness: [], rightthickness: [], tgtplatethickness2 : null, maxplatethickness2 : null, minplatethickness2 : null })
    }
});

const chartRef = ref(null);
const chartInstance = shallowRef(null);

let resizeObserver = null;

const getBaseOptions = () => ({
    textStyle: {
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    },
    title: {
        text: 'Thickness(Convexity Meter)',
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
            data: ['centerthickness', 'leftthickness', 'rightthickness'],
            top: 8,
            right: '5%',
            textStyle: { color: '#666' },
            itemGap: 15
        },
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
            let html = `<b>Postition: ${xVal}</b><br/>`;
            const colorMap = {
                'centerthickness': '#FF3E96',
                'leftthickness': '#1E90FF',
                'rightthickness': '#EECBAD'
            };
            params.forEach(item => {
                const val = item.value;
                if (item.seriesName === 'BaseLines') return;
                if (val !== undefined && val !== null) {
                    // Tooltip 保持原来的颜色标识，显示处理后的数值
                    const color = colorMap[item.seriesName] || item.color;
                    const marker = `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>`;
                    html += `${marker} ${item.seriesName}: ${val} mm<br/>`;
                }
            });
            return html;
        }
    },
    grid: {
        left: '4%',
        right: '6%',
        bottom: '15%',
        top: '12%',
        containLabel: false
    },
    xAxis: {
        type: 'category',
        name: 'Length Position(m)',
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
            // 修改单位名称
            name: 'Thickness(mm)',
            position: 'left',
            scale: true,
            nameLocation: 'middle',
            nameRotate: 90,
            nameGap: 35,
            nameTextStyle: { padding: [0, 0, 10, 0], align: 'center', color: '#333', fontWeight: '500', fontSize: 13 },
            splitLine: { show: true, lineStyle: { color: '#E0E6F1' } },
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#666' }
        }
    ],
    series: []
});

const updateChart = () => {
    if (!chartInstance.value) return;

    const rawData = props.curveData || {};
    const position = rawData.position || [];

    if (position.length === 0) {
        chartInstance.value.clear();
        return;
    }
    const processVal = (val) => {
        if (val === null || val === undefined || val === '') return null;
        return parseFloat((Number(val) * 1000).toFixed(3));
    };

    const tgtVal = processVal(rawData.tgtplatethickness2);
    const maxVal = processVal(rawData.maxplatethickness2);
    const minVal = processVal(rawData.minplatethickness2);

    let allValues = [];
    if (rawData.centerthickness) allValues = allValues.concat(rawData.centerthickness);
    if (rawData.leftthickness) allValues = allValues.concat(rawData.leftthickness);
    if (rawData.rightthickness) allValues = allValues.concat(rawData.rightthickness);

    if (tgtVal !== null) allValues.push(tgtVal);
    if (maxVal !== null) allValues.push(maxVal);
    if (minVal !== null) allValues.push(minVal);

    allValues = allValues.filter(v => v !== null && v !== undefined && !isNaN(v)).map(Number);

    let finalMin = null;
    let finalMax = null;

    if (allValues.length > 0) {
        const dataMin = Math.min(...allValues);
        const dataMax = Math.max(...allValues);
        const range = dataMax - dataMin;
        const padding = range === 0 ? 0.5 : range * 0.1;
        finalMin = (dataMin - padding).toFixed(3);
        finalMax = (dataMax + padding).toFixed(3);
    }
    const markLineData = [];
    if (maxVal !== null) {
        markLineData.push({ 
            yAxis: maxVal, 
            name: 'Max', 
            lineStyle: { color: '#FF0000', type: 'dashed', width: 1 }, // 红色虚线
            label: { formatter: 'Max: {c}', position: 'end', color: '#FF0000' } 
        });
    }
    if (tgtVal !== null) {
        markLineData.push({ 
            yAxis: tgtVal, 
            name: 'Target', 
            lineStyle: { color: '#32CD32', type: 'dashed', width: 2 }, // 绿色加粗虚线
            label: { formatter: 'Target: {c}', position: 'end', color: '#32CD32' } 
        });
    }
    if (minVal !== null) {
        markLineData.push({ 
            yAxis: minVal, 
            name: 'Min', 
            lineStyle: { color: '#FF0000', type: 'dashed', width: 1 }, // 红色虚线
            label: { formatter: 'Min: {c}', position: 'end', color: '#FF0000' } 
        });
    }
    const series = [
        {
            name: 'BaseLines',
            type: 'line',
            data: [],
            yAxisIndex: 0,
            silent: true,
            showSymbol: false,
            tooltip: { show: false },
            markLine: {
                symbol: ['none', 'arrow'],
                label: { show: true, fontSize: 11, distance: 10 },
                data: markLineData,
                animation: false
            }
        },
        {
            name: 'centerthickness',
            type: 'line',
            yAxisIndex: 0,
            data: rawData.centerthickness || [],
            smooth: false,
            showSymbol: false,
            symbol: 'emptyCircle',
            symbolSize: 8,
            itemStyle: { color: '#FF3E96' },
            lineStyle: { width: 2 }
        },
        {
            name: 'leftthickness',
            type: 'line',
            yAxisIndex: 0,
            data: rawData.leftthickness || [],
            smooth: false,
            showSymbol: false,
            symbol: 'emptyCircle',
            symbolSize: 8,
            itemStyle: { color: '#1E90FF' },
            lineStyle: { width: 2 }
        },
        {
            name: 'rightthickness',
            type: 'line',
            yAxisIndex: 0,
            data: rawData.rightthickness || [],
            smooth: false,
            showSymbol: false,
            symbol: 'emptyCircle',
            symbolSize: 8,
            itemStyle: { color: '#EECBAD' },
            lineStyle: { width: 2 }
        },
    ];

    const options = getBaseOptions();
    options.xAxis.data = position;
    options.series = series;

    if (finalMin !== null && finalMax !== null) {
        options.yAxis[0].min = finalMin;
        options.yAxis[0].max = finalMax;
    }

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

<style scoped></style>