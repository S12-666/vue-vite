<template>
    <div ref="chartRef" style="height: 100%; width: 100%"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, shallowRef, nextTick } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
    curveData: {
        type: Object,
        default: () => ({ position: [], time: [] })
    }
});

const boundaryLines = [
    { xAxis: 8.20, name: 'Pre Heat Start' },
    { xAxis: 19.79, name: '1st Heat Start' },
    { xAxis: 32.29, name: '2st Heat Start' },
    { xAxis: 38.98, name: 'Soak Start' },
];

const chartRef = ref(null);
const chartInstance = shallowRef(null);
const areaColor = '#7BE188';
const markAreaConfig = {
    data: [
        [
            { itemStyle: { color: areaColor, opacity: 0.2 }, name: 'Pre Heat', xAxis: 8.20 },
            { xAxis: 19.79 }
        ],
        [
            { itemStyle: { color: 'transparent' }, name: '1st Heat', xAxis: 19.79 },
            { xAxis: 32.29 }
        ],
        [
            { itemStyle: { color: areaColor, opacity: 0.2 }, name: '2st Heat', xAxis: 32.29 },
            { xAxis: 38.98 }
        ],
        [
            { itemStyle: { color: 'transparent' }, name: 'Soak Heat', xAxis: 38.98 },
            { xAxis: 50 }
        ]
    ]
};

// 基础配置 Options
const getBaseOptions = () => ({
    textStyle: {
        // fontFamily: 'Futura',
        fontFamily: "Helvetica Neue",
    },
    title: {
        text: 'Furnace Time',
        left: 'center',
        textStyle: { 
            fontWeight: 500,
            fontSize: 15,
            color: '#333'
        }
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'cross',
            snap: false
        },
        formatter: function (params) {
            if (Array.isArray(params)) {
                const p = params[0];
                return `Position: ${p.value[0]} m<br/>Time: ${p.value[1].toFixed(2)}`;
            }
            return '';
        }
    },
    grid: {
        // 稍微调整 grid 防止文字被遮挡
        left: '3%',
        right: '4%',
        bottom: '7%',
        containLabel: true
    },
    xAxis: {
        type: 'value',
        name: 'Position(m)',
        nameLocation: 'middle',
        nameTextStyle: {
            lineHeight: 40,
            fontWeight: 500,
            color: '#333'
        }, 
        min: 0,
        axisLabel: {
            formatter: '{value}'
        }
    },
    yAxis: {
        type: 'value',
        min: 0,
        name: 'Time',
        nameLocation: 'middle',
        nameTextStyle: { 
            padding: [0, 0, 40, 0],
            fontWeight: 500,
            color: '#333'
        }, // 增加 padding 防止和轴标注重叠
        splitNumber: 5,
        axisLabel: { formatter: val => val.toFixed(2) }
    },
    series: []
});

// 绘图逻辑
const updateChart = () => {
    if (!chartInstance.value) return;
    const { position, time } = props.curveData || {};
    if (!position || !time || position.length === 0) {
        chartInstance.value.clear();
        return;
    }

    const seriesData = position.map((p, index) => {
        return [p, time[index]];
    });

    // 1. 构建 Series
    const series = [{
        name: 'time',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: {
            type: [5, 8],
            dashOffset: 5,
            color: '#4E5969',
            width: 2
        },
        data: seriesData,
        markArea: markAreaConfig,
        markLine: {
            symbol: ['none', 'none'],
            silent: false,
            label: {
                show: false
            },
            emphasis: {
                label: { show: true, fontWeight: 'bold' },
                lineStyle: { width: 2, opacity: 1 }
            },
            // 开启标线的 Tooltip
            tooltip: {
                trigger: 'item',
                formatter: (params) => {
                    return `${params.name}<br/>Position: ${params.value} m`;
                }
            },
            data: boundaryLines // 使用上面定义的关键点数据
        }
    }];


    // 3. 计算 Y轴 最大值
    const maxTime = Math.max(...time);
    const yAxisMax = isFinite(maxTime) ? maxTime * 1.2 : null;

    const maxPos = Math.max(...position);
    const xAxisMax = maxPos > 51.21 ? maxPos : 51.21; // 确保能包住 Soak Heat 的 50

    // 4. 更新配置
    const options = getBaseOptions();
    options.series = series;
    options.xAxis.max = xAxisMax;
    if (yAxisMax) {
        options.yAxis.max = yAxisMax;
    }

    // setOption
    chartInstance.value.setOption(options, true); // true 表示不合并，相当于 clear + set
};

// 初始化图表
const initChart = () => {
    if (chartRef.value) {
        chartInstance.value = echarts.init(chartRef.value);
        // 初始化时如果有数据则直接绘制
        if (props.curveData && props.curveData.time) {
            updateChart();
        }

        // 添加 resize 监听
        window.addEventListener('resize', handleResize);
    }
};

const handleResize = () => {
    chartInstance.value?.resize();
};

// 监听数据变化
watch(
    () => props.curveData,
    () => {
        nextTick(() => {
            updateChart();
        });
    },
    { deep: true }
);

// 生命周期
onMounted(() => {
    initChart();
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
    if (chartInstance.value) {
        chartInstance.value.dispose();
        chartInstance.value = null;
    }
});
</script>