<script setup>
import { ref } from 'vue';
import { HelpFilled } from '@element-plus/icons-vue';
import ScatterChart from './ScatterChart.vue';

// 1. 新增 'clear-highlight' 事件
const emit = defineEmits(['update:method', 'clear-highlight']);

const props = defineProps({
    scatterData: {
        type: Object,
        default: () => ({})
    },
    highlightUpids: {
        type: Array,
        default: () => []
    }
});

const value = ref('tsne')
const options = [
    { value: 'tsne', label: 't-SNE' },
    { value: 'pca', label: 'PCA' }
]

const scatterChartRef = ref(null);

const handleResetZoom = () => {
    // 2. 恢复散点图的物理缩放
    scatterChartRef.value?.resetZoom();
    // 3. 触发事件，通知父组件把高亮数组清空
    emit('clear-highlight');
};

</script>

<template>
    <el-card class="visual-card">
        <template #header>
            <div class="card-header">
                <el-icon class="header-icon" @click="handleResetZoom">
                    <HelpFilled />
                </el-icon>
                <span>降维分析</span>
            </div>
            <el-select v-model="value" @change="val => emit('update:method', val)" placeholder="Select" size="small"
                class="select">
                <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
        </template>
        <div class="trend-chart">
            <ScatterChart ref="scatterChartRef" :raw-scatter-data="scatterData"
                :highlight-upids="props.highlightUpids" />
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

.header-icon {
    cursor: pointer;
    transition: transform 0.3s ease-in-out;
}

.header-icon:hover {
    transform: scale(1.2);
}

.select {
    width: 40%;
}
</style>