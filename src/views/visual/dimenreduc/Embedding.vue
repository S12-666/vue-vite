<script setup>
import { ref } from 'vue';
import { HelpFilled } from '@element-plus/icons-vue';
import ScatterChart from './ScatterChart.vue';

const props = defineProps({
    scatterData: {
        type: Object,
        default: () => ({})
    }
});
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
        </template>
        <div class="trend-chart">
            <ScatterChart :raw-scatter-data="scatterData"/>
        </div>
    </el-card>
</template>

<style scoped>
@import '@/views/visual/style/card-style.css';

.trend-chart {
    width: 100%;
    height: 300px; /* 确保有高度 */
}
</style>