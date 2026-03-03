<script setup>
import { ref } from 'vue';
import { Promotion } from '@element-plus/icons-vue';



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