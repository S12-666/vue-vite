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
        required: true, // ✅ 修正拼写
        default: () => []
    },
    yData: {
        type: Array,
        required: true, // ✅ 修正拼写
        default: () => []
    }
});

const chartRef = ref(null);
let chartInstance = null;

// ECharts 基础配置
const baseOptions = {
    textStyle: {
        fontFamily: 'Futura',
    },
    title: {
        text: 'Production Rhythm',
        textStyle: { fontWeight: 500 }
    },
    tooltip: {
        trigger: 'axis'
    },
    grid: {
        // 增加 grid 配置，防止 label 被遮挡
        containLabel: true,
        bottom: '10%',
        left: '5%',
        top: '15%',
        right: '5%'
    },
    xAxis: {
        type: 'category',
        name: 'Slabid',
        nameLocation: 'middle',
        nameGap: 30, // ✅ 解决文字重叠
        data: []
    },
    yAxis: {
        type: 'value',
        name: 'Time(s)',
        nameLocation: 'middle',
        nameGap: 40, // ✅ 解决文字重叠
    },
    series: []
};

// 绘图逻辑
const paint = () => {
    if (!props.xData.length || !props.yData.length || !chartInstance) return;

    let min = Infinity;
    let max = -Infinity;

    // 计算最大最小值
    const newSeries = props.yData.map(d => {
        // 假设 d.data 是纯数字数组
        if (d.data && d.data.length) {
            min = Math.min(min, ...d.data);
            max = Math.max(max, ...d.data);
        }
        return {
            ...d,
            type: 'line',
            showSymbol: false,
            // 优化线条样式
            lineStyle: { width: 2 }
        };
    });

    // 处理没有数据导致 min/max 为 Infinity 的情况
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
            min: Math.floor(min - 50), // 向下取整
            max: Math.ceil(max + 50)   // 向上取整
        },
        series: newSeries
    };

    chartInstance.setOption(finalOptions);
};

// 处理窗口大小变化
const handleResize = () => {
    chartInstance && chartInstance.resize();
};

// 生命周期
onMounted(() => {
    nextTick(() => {
        if (chartRef.value) {
            chartInstance = echarts.init(chartRef.value);
            paint();
            window.addEventListener('resize', handleResize);
        }
    });
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    if (chartInstance) {
        chartInstance.dispose();
        chartInstance = null;
    }
});

// 监听数据变化
watch([() => props.xData, () => props.yData], () => {
    paint();
}, { deep: true }); // ✅ 深度监听，防止对象内部变化不触发
</script>