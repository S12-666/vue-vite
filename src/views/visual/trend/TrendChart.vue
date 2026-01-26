<script setup>
import { ref, reactive, computed, onActivated } from 'vue';
import { ElMessage } from 'element-plus';
import TimeBrushD3 from './TimeBrushD3.vue';

const props = defineProps({
    chartData: {
        type: Object,
        default: () => null
    }
});

const handleBrush = (range) => {
    console.log('在 TrendChart 这一层也可以处理刷选事件:', range);
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

.month-pick {
    display: flex;
    align-items: center;

    span {
        font-size: 14px;
        font-weight: 500;
        font-family: "Helvetica Neue, Helvetica, Arial, sans-serif";
        margin-right: 10px;
        white-space: nowrap;
    }
}

.trend-chart {
    width: 100%;
    /* height: 100%; */
    height: 120px;
}
</style>