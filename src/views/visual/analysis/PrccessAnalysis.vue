<script setup>
import { ref } from 'vue';
import { Histogram } from '@element-plus/icons-vue';



</script>

<template>
    <el-card class="visual-card">
        <template #header>
            <div class="card-header">
                <el-icon class="header-icon">
                    <Histogram />
                </el-icon>
                <span>监控分析</span>
            </div>
        </template>
        <div class="trend-chart">
            
        </div>
    </el-card>
</template>

<style scoped>
@import '@/views/visual/style/card-style.css';

.trend-chart {
    width: 100%;
    height: 567px;
    /* 确保有高度 */
}
</style>