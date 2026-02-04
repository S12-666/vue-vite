<script setup>
import { ref } from 'vue';
import { Histogram } from '@element-plus/icons-vue'; // 记得引入图标
import TimeBrushD3 from './TimeBrushD3.vue';

const props = defineProps({
    chartData: {
        type: Object,
        default: () => null
    }
});

const emit = defineEmits(['timeBrushed']);

const handleBrush = (range) => {
    emit('timeBrushed', range);
};
</script>

<template>
    <el-card class="visual-card">
        <template #header>
            <div class="card-header">
                <el-icon class="header-icon">
                    <Histogram />
                </el-icon>
                <span>趋势监控</span>
            </div>
        </template>
        <div class="trend-chart">
            <TimeBrushD3 :chart-data="props.chartData" @timeBrushed="handleBrush" />
        </div>
        <div class="spec-chart"></div>
        <div class="detail-chart">
        </div>
    </el-card>
</template>

<style scoped>
@import '@/views/visual/style/card-style.css';

.visual-card {
    height: 100%;
    display: flex;
    flex-direction: column;
}

/* 2. 穿透修改 el-card 的 body，让其占据剩余空间并成为 flex 容器 */
:deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 10px;
}

.trend-chart {
    height: 120px;
    flex-shrink: 0;
    width: 100%;
}

.spec-chart {
    flex: 2;
    width: 100%;
    min-height: 0;
}

.detail-chart {
    flex: 3;
    width: 100%;
    min-height: 0;
    margin-top: 10px;

}
</style>