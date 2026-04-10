<script setup>
import { ref } from 'vue';
import { Histogram } from '@element-plus/icons-vue'; // 记得引入图标
import { getDetailData } from '@/api/api';
import TimeBrushD3 from './TimeBrushD3.vue';
import GanttChart from './GanttChart.vue';
import DetialChart from './DetialChart.vue';

const props = defineProps({
    chartData: {
        type: Object,
        default: () => null
    },
    ganttData: {
        type: Object,
        default: () => ({})
    }
});

const emit = defineEmits(['timeBrushed', 'cardClick', 'plateClicked', 'predict-clicked']);

const detailData = ref(null);

const handleBrush = (range) => {
    emit('timeBrushed', range);
};

const handleGanttCardClick = async (payload) => {
    const { platetype, upids, cardData } = payload;
    // console.log(`准备请求 ${platetype} 的数据，包含以下 upids:`, upids);
    emit('cardClick', payload);
    try {
        const res = await getDetailData({
            type: platetype,
            upids: upids // 传回后端的数组 ["21614022000", "21614040000", "21614041000"]
        });

        detailData.value = res;
    } catch (error) {
        console.error('获取详情数据失败:', error);
    }
};

const handleSinglePlateClick = (plate) => {
    emit('plateClicked', plate);
};

const handlePredictClick = (params) => {
    emit('predict-clicked', params);
};
</script>

<template>
    <el-card class="visual-card">
        <template #header>
            <div class="card-header">
                <el-icon class="header-icon">
                    <Histogram />
                </el-icon>
                <span>质量监控</span>
            </div>
        </template>
        <div class="trend-chart">
            <TimeBrushD3 :chart-data="props.chartData" @timeBrushed="handleBrush" />
        </div>
        <div class="spec-chart">
            <GanttChart :raw-group-data="props.ganttData" @cardClick="handleGanttCardClick" />
        </div>
        <div class="detail-chart">
            <DetialChart :detail-data="detailData" @plateClick="handleSinglePlateClick" @predict-clicked="handlePredictClick"/>
        </div>
    </el-card>
</template>

<style scoped>
@import '@/views/visual/style/card-style.css';

.visual-card {
    flex: 1;
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
}

:deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 10px;
}

.trend-chart {
    height: 100px;
    flex-shrink: 0;
    width: 100%;
}

.spec-chart {
    height: 220px;
    flex-shrink: 0;
    width: 100%;
    margin-top: 20px;
}

.detail-chart {
    flex: 1;
    width: 100%;
    height: 0;
    min-height: 0;
    /* margin-top: 10px; */
    display: flex;
    flex-direction: column;
    position: relative;
}
</style>