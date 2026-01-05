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
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    },
    title: {
        text: 'Furnace Time',
        left: 'center',
        textStyle: {
            fontWeight: 700,
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
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: '#ccc',
        borderWidth: 1,
        formatter: function (params) {
            if (Array.isArray(params)) {
                const p = params[0];
                return `Position: ${p.value[0]} m<br/>Time: ${p.value[1].toFixed(2)} min`;
            }
            return '';
        }
    },
    grid: {
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
            color: '#333',
            fontSize: 15
        },
        min: 0,
        axisLabel: {
            formatter: '{value}'
        }
    },
    yAxis: {
        type: 'value',
        min: 0,
        name: 'Time(min)',
        nameLocation: 'middle',
        nameTextStyle: {
            padding: [0, 0, 40, 0],
            fontWeight: 500,
            color: '#333',
            fontSize: 15
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

    const series = [
        {
            name: 'time',
            type: 'line',
            smooth: true,
            showSymbol: false,
            symbol: 'emptyCircle',
            symbolSize: 10,
            lineStyle: {
                color: '#4E5969',
                width: 2,
            },
            data: seriesData,
            markArea: markAreaConfig,
        },

        {
            name: 'Boundary Helper',
            type: 'line',
            data: [], // 空数据，不画线
            showSymbol: false,

            markLine: {
                symbol: ['none', 'none'],
                silent: false,
                label: {
                    show: false
                },
                lineStyle: {
                    opacity: 0,
                    width: 20
                },
                // tooltip: {
                //     trigger: 'item',
                //     formatter: (params) => {
                //         return `${params.name}<br/>Position: ${params.value} m`;
                //     }
                // },
                data: boundaryLines
            }
        }
    ];

    const maxTime = Math.max(...time);
    const yAxisMax = isFinite(maxTime) ? maxTime * 1.2 : null;

    const maxPos = Math.max(...position);
    const xAxisMax = maxPos > 51.21 ? maxPos : 51.21; // 确保能包住 Soak Heat 的 50

    const options = getBaseOptions();
    options.series = series;
    options.xAxis.max = xAxisMax;
    if (yAxisMax) {
        options.yAxis.max = yAxisMax;
    }
    chartInstance.value.setOption(options, true); // true 表示不合并，相当于 clear + set
};

let resizeObserver = null;

const initChart = () => {
    if (chartRef.value) {
        chartInstance.value = echarts.init(chartRef.value);
        if (props.curveData && props.curveData.time) {
            updateChart();
        }

        resizeObserver = new ResizeObserver(() => {
            chartInstance.value?.resize();
        });
        resizeObserver.observe(chartRef.value);
    }
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
    // 1. 停止观察
    if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
    }
    
    // 2. 销毁图表
    if (chartInstance.value) {
        chartInstance.value.dispose();
        chartInstance.value = null;
    }
});
</script>