<template>
    <div ref="chartRef" style="height: 100%; width: 100%"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, shallowRef, nextTick } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
    curveData: {
        type: Object,
        default: () => ({ position: [], seg_u: [], seg_d: [], plate: [] })
    }
});

const boundaryLines = [
    { xAxis: 8.20, name: 'Pre Heat Start' },
    { xAxis: 19.79, name: '1st Heat Start' },
    { xAxis: 32.29, name: '2st Heat Start' },
    { xAxis: 38.98, name: 'Soak Start' },
];

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

const chartRef = ref(null);
const chartInstance = shallowRef(null);

const getBaseOptions = () => ({
    textStyle: {
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    },
    title: {
        text: 'Furnace Temperature', // 标题
        left: 'center',
        textStyle: {
            fontWeight: 700,
            fontSize: 15,
            color: '#333'
        }
    },
    legend: {
        data: ['seg_u', 'seg_d', 'plate'],
        top: 8,
        right: '5%',
        textStyle: { color: '#666' },
        itemGap: 20
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', snap: true },
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: '#ccc',
        borderWidth: 1,
        formatter: function (params) {
            if (!Array.isArray(params) || params.length === 0) return '';
            const xVal = params[0].value[0]; // 获取 X 轴位置

            let html = `Position: ${xVal} m<br/>`;
            params.forEach(item => {
                html += `${item.marker} ${item.seriesName}: ${item.value[1].toFixed(1)} °C<br/>`;
            });
            return html;
        }
    },
    grid: {
        left: '3%',
        right: '4%',
        bottom: '7%',
        // top: '18%',
        containLabel: true
    },
    xAxis: {
        type: 'value',
        name: 'Position(m)',
        nameLocation: 'middle',
        nameTextStyle: { lineHeight: 40, fontWeight: 500, color: '#333', fontSize: 13 },
        min: 0,
        axisLabel: { formatter: '{value}' }
    },
    yAxis: {
        type: 'value',
        name: 'Temp(°C)',
        min: 0, // 或者 'dataMin' 让曲线更明显
        nameLocation: 'middle',
        nameTextStyle: { padding: [0, 0, 30, 0], fontWeight: 500, color: '#333', fontSize: 13 },
        // splitLine: { show: true, lineStyle: { type: 'dashed' } } // 虚线网格
        splitLine: { show: true }
    },
    series: []
});

const updateChart = () => {
    if (!chartInstance.value) return;
    const rawData = props.curveData || {};
    const position = rawData.position || [];
    const source = rawData.furnace || rawData;
    const seg_u = source.seg_u || [];
    const seg_d = source.seg_d || [];
    const plate = source.plate || [];
    if (position.length === 0) {
        chartInstance.value.clear();
        return;
    }

    const dataU = position.map((p, i) => [p, seg_u[i]]);
    const dataD = position.map((p, i) => [p, seg_d[i]]);
    const dataP = position.map((p, i) => [p, plate[i]]);

    // 3. 构建 Series
    const series = [
        {
            name: 'seg_u',
            type: 'line',
            smooth: true,
            symbol: 'emptyCircle',
            symbolSize: 10,
            showSymbol: false,
            data: dataU,
            itemStyle: { color: '#ff4d4f' }, // 红色代表上部高温
            lineStyle: { width: 2 },
        },
        {
            name: 'seg_d',
            type: 'line',
            smooth: true,
            symbol: 'emptyCircle',
            symbolSize: 10,
            showSymbol: false,
            data: dataD,
            itemStyle: { color: '#1890ff' },
            lineStyle: { width: 2 }
        },
        {
            name: 'plate',
            type: 'line',
            smooth: true,
            symbol: 'emptyCircle',
            symbolSize: 10,
            showSymbol: false,
            data: dataP,
            itemStyle: { color: '#52c41a' }, // 绿色代表板温
            lineStyle: { width: 3, type: 'solid' }, // 板温加粗一点突出显示
            z: 10 // 让板温线显示在最上层
        },
        {
            name: 'Boundary Helper',
            type: 'line',
            data: [],
            showSymbol: false,
            markLine: {
                symbol: ['none', 'none'],
                silent: false,
                label: { show: false },
                lineStyle: { opacity: 0, width: 20 },
                // tooltip: { trigger: 'item', formatter: (p) => `${p.name}<br/>Pos: ${p.value}m` },
                data: boundaryLines
            },
            markArea: markAreaConfig,
        }
    ];

    const maxPos = Math.max(...position);
    const xAxisMax = maxPos > 51.21 ? maxPos : 51.21;

    const options = getBaseOptions();
    options.series = series;
    options.xAxis.max = xAxisMax;

    chartInstance.value.setOption(options, true);
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

watch(
    () => props.curveData,
    () => { nextTick(updateChart); },
    { deep: true }
);

onMounted(() => { initChart(); });

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