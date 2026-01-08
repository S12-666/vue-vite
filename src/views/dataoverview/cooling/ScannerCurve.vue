<script setup>
import { ref, onMounted, onBeforeUnmount, watch, shallowRef, nextTick } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
    scannerData: {
        type: Object,
        default: () => ({ position: [], data: [] })
    }
});


const chartRef = ref(null);
const chartInstance = shallowRef(null);
let resizeObserver = null;

const metallurgyColors = [
    "#3d4655", // 区间1: 0-300 (深蓝灰)
    "#505050", // 区间2: 300-400 (深灰)
    "#643131", // 区间3: 400-500 (暗褐红)
    "#940e0e", // 区间4: 500-600 (深红)
    "#bd1212", // 区间5: 600-650 (红)
    "#d71717", // 区间6: 650-700 (鲜红)
    "#eb1c24", // 区间7: 700-750 (正红)
    "#ef4a25", // 区间8: 750-800 (橘红)
    "#de6628", // 区间9: 800-850 (橙色)
    "#de8728", // 区间10: 850-900 (浅橙)
    "#ea9c29"  // 区间11: 900-950 (金黄橙)
];

const getBaseOptions = (minVal, maxVal) => ({
    textStyle: {
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    },
    title: {
        text: 'Scanner Temperature',
        left: 'center',
        top: 5,
        textStyle: { fontWeight: 700, fontSize: 16, color: '#333' }
    },
    tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: '#ccc',
        borderWidth: 1,
        textStyle: { color: '#000' },
        formatter: (params) => {
            const xVal = parseFloat(params.name).toFixed(2);
            const row = params.value[1];
            const val = params.value[2];

            let html = `<b>Position: ${xVal} m</b><br/>`;
            const marker = `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${params.color};"></span>`;
            html += `${marker} Scanner ${row}: ${Number(val).toFixed(1)} °C`;
            return html;
        }
    },
    grid: {
        top: '12%',
        bottom: '5%',
        left: '3%',
        right: '3%',
        containLabel: true
    },
    xAxis: {
        type: 'category',
        data: [],
        name: 'Position (m)',
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: { fontWeight: 500, color: '#333', fontSize: 13 },
        splitArea: { show: false },
        axisLabel: {
            formatter: (val) => {
                return typeof val === 'number' ? val.toFixed(2) : parseFloat(val).toFixed(2);
            }
        },
        axisLine: { lineStyle: { color: '#333' } },
        axisTick: { alignWithLabel: true }
    },
    yAxis: {
        type: 'category',
        name: 'Scanner Index',
        nameLocation: 'middle',
        nameRotate: 90,
        nameGap: 25,
        nameTextStyle: { align: 'center', color: '#333', fontWeight: '500', fontSize: 13 },
        data: [],
        splitArea: { show: false },
        axisLine: { lineStyle: { color: '#333' } }
    },
    visualMap: {
        min: minVal,
        max: maxVal,
        calculable: false,
        inRange: {
            color: metallurgyColors
        },
        text: null,
        orient: 'horizontal',
        right: '3%',
        top: 8,
        itemHeight: 120,
        itemWidth: 20,
    },
    series: [{
        name: 'Heat',
        type: 'heatmap',
        data: [],
        label: { show: false },
        // 强制方块显示的关键：
        itemStyle: {
            // borderColor: '#333', // 每个方块加一点深色边框，增加“方块感”
            borderWidth: 0.5
        },
        emphasis: {
            itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
                borderColor: '#fff',
                borderWidth: 1
            }
        }
    }]
});

const updateChart = () => {
    if (!chartInstance.value) return;
    const rawData = props.scannerData || {};

    const positions = rawData.position || [];
    const rowsData = rawData.data || [];

    if (positions.length === 0 || rowsData.length === 0) {
        chartInstance.value.clear();
        return;
    }
    const seriesData = [];
    const allValues = [];

    rowsData.forEach((rowArray, rowIndex) => {
        rowArray.forEach((val, colIndex) => {
            if (val !== null && val !== undefined) {
                seriesData.push([colIndex, rowIndex, val]);
                allValues.push(val);
            }
        });
    });

    let minVal = 0;
    let maxVal = 1000;

    if (allValues.length > 0) {
        const dataMin = Math.min(...allValues);
        const dataMax = Math.max(...allValues);
        minVal = Math.floor(dataMin / 10) * 10;
        maxVal = Math.ceil(dataMax / 10) * 10;
    }
    const yAxisData = rowsData.map((_, i) => `${i}`);

    const options = getBaseOptions(minVal, maxVal);
    options.xAxis.data = positions;
    options.yAxis.data = yAxisData;
    options.series[0].data = seriesData;

    chartInstance.value.setOption(options, true);
};

const initChart = () => {
    if (chartInstance.value) {
        chartInstance.value.dispose();
    }

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
    () => props.scannerData,
    () => { nextTick(updateChart); },
    { deep: true }
);

onMounted(() => {
    initChart();
});

onBeforeUnmount(() => {
    if (resizeObserver) resizeObserver.disconnect();
    if (chartInstance.value) chartInstance.value.dispose();
});
</script>

<template>
    <div class="heat-details">
        <div ref="chartRef" style="height: 100%; width: 100%"></div>
    </div>
</template>

<style lang="scss" scoped>
.heat-details {
    height: 100%;
    width: 100%;
}
</style>