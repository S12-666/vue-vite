<script setup>
import { ref } from 'vue';
import { Promotion } from '@element-plus/icons-vue';
import SHAPChart from './SHAPChart.vue';
import PCAChart from './PCAChart.vue';

const props = defineProps({
    plateData: {
        type: Object,
        default: () => null
    },
    shapData: {
        type: Object,
        default: () => null
    }
});
</script>

<template>
    <el-card class="visual-card">
        <template #header>
            <div class="card-header">
                <el-icon class="header-icon">
                    <Promotion />
                </el-icon>
                <span>预测&诊断分析</span>
            </div>
        </template>
        <div class="charts-wrapper">
            <div class="shap-chart-container">
                <SHAPChart :shap-data="props.shapData"/>
            </div>

            <div class="pca-chart-container">
                <PCAChart :detail-data="props.plateData ? [props.plateData] : []" />
            </div>
        </div>
    </el-card>
</template>

<style scoped>
@import '@/views/visual/style/card-style.css';

/* 1. 卡片撑满外部的绝对定位容器 */
.visual-card {
    display: flex;
    flex-direction: column;
    height: 100%;
    margin: 0;
}

/* 2. body 自适应占据剩余空间 */
:deep(.el-card__body) {
    flex: 1;
    min-height: 0;
    /* 切断向下的撑开链条 */
    padding: 10px;
    display: flex;
    flex-direction: column;
}

/* 3. 图表包装器内部均分 */
.charts-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    /* gap: 15px; */
    overflow: hidden;
    /* 防止溢出 */
    min-height: 0;
}

.shap-chart-container,
.pca-chart-container {
    flex: 1;
    min-height: 0;
}
</style>