<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import * as echarts from 'echarts/core';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { BarChart, PieChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { getSpecCountByTime } from '@/api/api.js';
import { ElMessage } from 'element-plus';


echarts.use([GridComponent, TooltipComponent, LegendComponent, BarChart, PieChart, CanvasRenderer]);
const chartRef = ref(null);
let myChart = null;

const props = defineProps({
    dateRange: {
        type: Array,
        default: () => []
    }
});

const dataMapping = [
    { key: 'total_count', label: 'Total' },
    { key: 'good_count',  label: 'Good' },
    { key: 'no_p_count',  label: 'No Label' },
    { key: 'pa',          label: 'Pa' },
    { key: 'pf',          label: 'Pf' },
    { key: 'pn',          label: 'Pn' },
    { key: 'ps',          label: 'Ps' },
    { key: 'gs',          label: 'Gs' }
];

const getData = async (dates) => {
    if (!myChart) return;

    if(!dates || dates.length !== 2) {
        ElMessage({
            showClose: true,
            message: 'CountChrat:请选择有效的日期范围',
            type: 'info',
        });
        return;
    }
    myChart.showLoading();
    try {
        const params = {
            startTime: dates[0],
            endTime: dates[1]
        }
        // console.log('子组件参数',params);
        
        const res = await getSpecCountByTime(params);
        // console.log(res);
        
        const data = res;

        const names = dataMapping.map(item => item.label);
        const value = dataMapping.map(item => data[item.key] || 0);

        const source = names.map((name, index) => ({
            name,
            value: value[index],
        })).filter(item => item.name !== 'Total');

        const list = names
            .map((name, index) => ({ name, value: value[index] }))
            .sort((a, b) => a.value - b.value)
            .filter(item => item.name !== 'Total');

        const namesSorted = list.map(item => item.name);
        const valuesSorted = list.map(item => item.value);

        updateOption(namesSorted, valuesSorted, source, data.total_count);
    } catch (error) {
        ElMessage({
            showClose: true,
            message: '获取统计视图数据失败',
            type: 'error',
        });
    } finally {
        myChart.hideLoading();
    }
};

const updateOption = (namesSorted, valuesSorted, source, total) => {

    const pieCenter = ['70%', '50%'];

    let option = {
        tooltip: {
            trigger: 'item',
        },
        grid: {
            left: '0%',
            right: '55%',
            bottom: '5%',
            top: '10px',
            containLabel: true 
        },
        yAxis: {
            type: 'category',
            data: namesSorted,
            axisTick: { show: false },
            axisLabel: { margin: 8 },
            splitLine: { show: false },

        },
        xAxis: {
            type: 'value',
            // max: xMax,
            axisLabel: { show: false },
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: {
                show: false,
            },
        },
        title: {
            text: `{name|Total} : {val|${total}}`,
            fontSize: 16,
            fontWeight: 'bold',
            left: pieCenter[0],
            top: '88%',
            textAlign: 'center',       // ★核心：保证文字水平居中于锚点
            // textVerticalAlign: 'middle', // ★核心：保证文字垂直居中于锚点
            textStyle: {
                rich: {
                    val: {
                        fontSize: 16,
                        fontWeight: 'bold',
                        color: '#666',
                        lineHeight: 30, // 调整行高，拉开数字和Total的间距
                    },
                    name: {
                        fontSize: 16,
                        fontWeight: 'bold',
                        color: '#666',
                    }
                }
            }
        },
        series: [
            {
                data: valuesSorted,
                type: 'bar',
                barWidth: 20,
                barCategoryGap: '40%',
                animationDurationUpdate: 500,
                animationEasingUpdate: 'cubicOut',
                label: {
                    show: true,
                    position: 'right',
                    color: '#000',
                    formatter: '{c}',
                    fontSize: 14,
                }
            },
            {
                type: 'pie',
                radius: ['40%', '70%'],
                center: pieCenter,
                data: source,
                label: {
                    show: true,
                    formatter: '{b}: {c} ({d}%)',
                    fontSize: 11,
                },
            }
        ]
    };

    myChart.setOption(option);
};


const handleResize = () => {
    if (myChart) {
        myChart.resize();
    }
};

watch(() => props.dateRange, (newRange) => {
    getData(newRange);
}, { immediate: true });

onMounted(() => {
    myChart = echarts.init(chartRef.value);
    getData(props.dateRange);
    // myChart.setOption(option);
    window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);

    if (myChart) {
        myChart.dispose();
    }
})

</script>

<template>
    <div ref="chartRef" style="width: 100%; height: 100%;"></div>
</template>

<style scoped lang="less"></style>