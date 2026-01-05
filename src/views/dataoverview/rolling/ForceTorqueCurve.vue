<script setup>
import { ref, onMounted, onBeforeUnmount, watch, shallowRef, nextTick } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
    curveData: {
        type: Object,
        default: () => ({ Passes: [], Epsilon: [], ForcePost: [], ForceMeas: [], TorquePost: [], TorqueMeas: [] })
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
        text: 'Change Force & Torque',
        left: '58%',
        top: 0,
        textStyle: {
            fontWeight: 700,
            fontSize: 15,
            color: '#333'
        }
    },
    legend: [
        {
            data: ['ForcePost', 'ForceMeas', 'TorquePost', 'TorqueMeas'],
            top: 8,
            left: '5%',
            // right: 'center',
            textStyle: { color: '#666' },
            itemGap: 15
        },
        {
            data: ['Epsilon'],
            top: 8,
            right: '5%',
            textStyle: { color: '#666' }
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
            const colorMap = {
                'Epsilon': '#CD2626',      // 红色
                'ForcePost': '#32CD32',    // 绿色
                'ForceMeas': '#32CD32',    // 绿色
                'TorquePost': '#1E90FF',   // 蓝色
                'TorqueMeas': '#1E90FF'    // 蓝色
            };
            params.forEach(item => {
                const val = item.value;
                if (val !== undefined && val !== null) {
                    // Tooltip 保持原来的颜色标识，显示处理后的数值
                    const color = colorMap[item.seriesName] || item.color;
                    const marker = `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>`;
                    html += `${marker} ${item.seriesName}: ${val}<br/>`;
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
            // 修改单位名称
            name: 'F(KT)/T(MN·m)×10^6',
            position: 'left',
            nameLocation: 'middle',
            nameRotate: 90,
            nameGap: 35, // 距离轴线的距离，防止遮挡数值
            nameTextStyle: { padding: [0, 0, 0, 0], align: 'center', color: '#333', fontWeight: '500', fontSize: 13 },

            // 样式修改：去除实线和刻度，去除特定颜色
            splitLine: { show: true, lineStyle: { color: '#E0E6F1' } },
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#666' }
        },
        {
            type: 'value',
            name: 'Epsilon(%)',
            position: 'right',
            nameLocation: 'middle',
            nameRotate: -90,
            nameGap: 35,
            nameTextStyle: { padding: [0, 0, 0, 0], align: 'center', color: '#333', fontWeight: '500', fontSize: 13 },

            // 样式修改：去除实线和刻度，去除特定颜色
            splitLine: { show: false },
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
    const convertToMN = (dataArray) => {
        return (dataArray || []).map(val => val !== null && val !== undefined ? parseFloat((val / 1000000).toFixed(3)) : null);
    };

    const series = [
        {
            name: 'Epsilon',
            type: 'line',
            yAxisIndex: 1,
            data: rawData.Epsilon || [],
            smooth: false,
            showSymbol: false,
            symbol: 'emptyCircle',
            symbolSize: 8,
            itemStyle: { color: '#CD2626' },
            lineStyle: { width: 2 }
        },
        {
            name: 'ForcePost',
            type: 'line',
            yAxisIndex: 0,
            data: convertToMN(rawData.ForcePost), // 转换数据
            smooth: false,
            showSymbol: false,
            symbol: 'roundRect',
            symbolSize: 8,
            itemStyle: { color: '#fff', borderColor: '#32CD32', borderWidth: 2 },
            lineStyle: { width: 2, color: '#32CD32' }
        },
        {
            name: 'ForceMeas',
            type: 'line',
            yAxisIndex: 0,
            data: convertToMN(rawData.ForceMeas), // 转换数据
            smooth: false,
            showSymbol: false,
            symbol: 'roundRect',
            symbolSize: 8,
            itemStyle: { color: '#fff', borderColor: '#32CD32', borderWidth: 2 },
            lineStyle: { width: 2, color: '#32CD32', type: 'dashed' }
        },
        {
            name: 'TorquePost',
            type: 'line',
            yAxisIndex: 0,
            data: convertToMN(rawData.TorquePost), // 转换数据
            smooth: false,
            showSymbol: false,
            symbol: 'triangle',
            symbolSize: 10,
            itemStyle: { color: '#fff', borderColor: '#1E90FF', borderWidth: 2 },
            lineStyle: { width: 2, color: '#1E90FF' }
        },
        {
            name: 'TorqueMeas',
            type: 'line',
            yAxisIndex: 0,
            data: convertToMN(rawData.TorqueMeas), // 转换数据
            smooth: false,
            showSymbol: false,
            symbol: 'triangle',
            symbolSize: 10,
            itemStyle: { color: '#fff', borderColor: '#1E90FF', borderWidth: 2 },
            lineStyle: { width: 2, color: '#1E90FF', type: 'dashed'}
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