<script setup>
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
    accuracyData: {
        type: Array,
        default: () => [] 
    }
});

const chartRef = ref(null);
let myChart = null;
let resizeObserver = null; // 1. 新增 observer 变量

const initChart = () => {
    if (!chartRef.value) return;
    myChart = echarts.init(chartRef.value);
    setOption();
    
    // 2. 使用 ResizeObserver 替代 window.resize
    // 监听 chartRef 容器的大小变化，自动触发 resize
    resizeObserver = new ResizeObserver(() => {
        myChart && myChart.resize();
    });
    resizeObserver.observe(chartRef.value);
};

const setOption = () => {
    if (!myChart) return;
    const xData = props.accuracyData.map(item => item.name.toUpperCase());
    const yData = props.accuracyData.map(item => item.value);

    const option = {
        tooltip: { trigger: 'axis', formatter: '{b} 准确率: {c}' },
        grid: {
            top: '20%', 
            left: '1%',   // 左侧可以设置更小，因为没有坐标轴文字了
            right: '1%', 
            bottom: '5%', 
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: xData,
            axisTick: { show: false },
            axisLine: { lineStyle: { color: '#ccc' } },
            axisLabel: { color: '#666', fontSize: 10 }
        },
        yAxis: {
            type: 'value',
            min: 0.5, 
            max: 1.0,
            splitLine: { show: false }, // 建议连网格线也去掉，看起来更清爽
            // 3. 关键修改：隐藏 Y 轴坐标文字
            axisLabel: { 
                show: false 
            },
            // 可选：如果连 Y 轴那根竖线也不想要，可以加 axisLine: { show: false }
        },
        series: [{
            name: 'Accuracy',
            type: 'bar',
            barWidth: '50%', // 稍微调宽一点，因为没有坐标轴占位了
            data: yData,
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#409EFF' },
                    { offset: 1, color: '#ecf5ff' }
                ]),
                borderRadius: [4, 4, 0, 0]
            },
            label: {
                show: true, 
                position: 'top',
                formatter: (p) => (p.value * 100).toFixed(0) + '%',
                fontSize: 10, 
                color: '#409EFF'
            }
        }]
    };
    myChart.setOption(option);
};

watch(() => props.accuracyData, () => {
    // console.log(props.accuracyData);
    if (myChart) {
        setOption();
    } else {
        nextTick(() => initChart());
    }
}, { deep: true });

onMounted(() => {
    initChart();
});

onUnmounted(() => {
    // 4. 销毁 ResizeObserver
    if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
    }
    if (myChart) {
        myChart.dispose();
        myChart = null;
    }
});
</script>

<template>
    <div ref="chartRef" style="width: 100%; height: 100%;"></div>
</template>