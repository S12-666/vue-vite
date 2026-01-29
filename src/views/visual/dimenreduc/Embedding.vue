<script setup>
import { ref } from 'vue';
import { HelpFilled } from '@element-plus/icons-vue';
import ScatterChart from './ScatterChart.vue';
import { Refresh } from '@element-plus/icons-vue';

const props = defineProps({
    scatterData: {
        type: Object,
        default: () => ({})
    }
});

const scatterChartRef = ref(null);

const handleResetZoom = () => {
    scatterChartRef.value?.resetZoom();
};
</script>

<template>
    <el-card class="visual-card">
        <template #header>
            <div class="card-header">
                <el-icon class="header-icon">
                    <HelpFilled />
                </el-icon>
                <span>降维分析</span>
            </div>
            <el-button size="small" circle @click="handleResetZoom">
                <el-icon>
                    <Refresh />
                </el-icon>
            </el-button>
        </template>
        <div class="trend-chart">
            <ScatterChart ref="scatterChartRef" :raw-scatter-data="scatterData" />
        </div>
    </el-card>
</template>

<style scoped>
@import '@/views/visual/style/card-style.css';

.trend-chart {
    width: 100%;
    height: 300px;
    /* 确保有高度 */
}
</style>