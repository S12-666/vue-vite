<template>
    <div ref="chartRef" :class="className" :style="{ height: height, width: width }"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as echarts from 'echarts';

// 定义 Props
const props = defineProps({
    className: {
        type: String,
        default: 'rhythm-chart'
    },
    width: {
        type: String,
        default: '100%'
    },
    height: {
        type: String,
        default: '100%'
    },
    xData: {
        type: Array,
        required: true,
        default: () => []
    },
    yData: {
        type: Array,
        required: true,
        default: () => []
    }
});

const chartRef = ref(null);
let chartInstance = null;

// 1. 在顶层声明 observer 变量
let resizeObserver = null;

// ECharts 基础配置
const baseOptions = {
    textStyle: {
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    },
    title: {
        text: 'Production Rhythm',
        left: 'center',
        textStyle: { fontWeight: 500, fontSize: 15 }
    },
    tooltip: {
        trigger: 'axis'
    },
    grid: {
        containLabel: true,
        bottom: '10%',
        left: '3%',
        top: '15%',
        right: '4%'
    },
    xAxis: {
        type: 'category',
        name: 'Slabid',
        nameLocation: 'middle',
        nameGap: 30,
        data: []
    },
    yAxis: {
        type: 'value',
        name: 'Time(s)',
        nameLocation: 'middle',
        nameGap: 40,
    },
    series: []
};

// 绘图逻辑
const paint = () => {
    if (!props.xData.length || !props.yData.length || !chartInstance) return;

    let min = Infinity;
    let max = -Infinity;

    const newSeries = props.yData.map(d => {
        if (d.data && d.data.length) {
            min = Math.min(min, ...d.data);
            max = Math.max(max, ...d.data);
        }
        return {
            ...d,
            type: 'line',
            showSymbol: false,
            lineStyle: { width: 2 }
        };
    });

    if (min === Infinity) min = 0;
    if (max === -Infinity) max = 100;

    const finalOptions = {
        ...baseOptions,
        xAxis: {
            ...baseOptions.xAxis,
            data: props.xData
        },
        yAxis: {
            ...baseOptions.yAxis,
            min: Math.floor(min - 50),
            max: Math.ceil(max + 50)
        },
        series: newSeries
    };

    chartInstance.setOption(finalOptions);
};

watch([() => props.xData, () => props.yData], () => {
    paint();
}, { deep: true });

onMounted(() => {
    nextTick(() => {
        if (chartRef.value) {
            chartInstance = echarts.init(chartRef.value);
            paint();

            // 2. 初始化 ResizeObserver 监听容器大小
            resizeObserver = new ResizeObserver(() => {
                chartInstance?.resize();
            });
            resizeObserver.observe(chartRef.value);
        }
    });
});

onUnmounted(() => {
    // 3. 销毁 Observer 防止内存泄漏
    if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
    }

    if (chartInstance) {
        chartInstance.dispose();
        chartInstance = null;
    }
});
</script>