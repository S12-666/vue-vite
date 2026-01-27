<script setup>
import { ref } from 'vue';
import { Monitor } from '@element-plus/icons-vue'; // 记得引入图标
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
                    <Monitor />
                </el-icon>
                <span>趋势监控</span>
            </div>
        </template>
        <div class="trend-chart">
            <TimeBrushD3 :chart-data="props.chartData" @timeBrushed="handleBrush" />
        </div>
    </el-card>
</template>

<style scoped>
@import '@/views/visual/style/card-style.css';

.trend-chart {
    width: 100%;
    height: 120px; /* 确保有高度 */
}
</style>