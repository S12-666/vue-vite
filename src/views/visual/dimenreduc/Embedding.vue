<script setup>
import { ref } from 'vue';
import { HelpFilled } from '@element-plus/icons-vue';
import ScatterChart from './ScatterChart.vue';

const emit = defineEmits(['update:method']);
const props = defineProps({
    scatterData: {
        type: Object,
        default: () => ({})
    }
});


const value = ref('tsne')
const options = [
    {
        value: 'tsne',
        label: 't-SNE',
    },
    {
        value: 'pca',
        label: 'PCA',
    }
]

const scatterChartRef = ref(null);

const handleResetZoom = () => {
    scatterChartRef.value?.resetZoom();
};

// const handleMethodChange = (newVal) => {
//     emit('update:method', newVal);
// };
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
            <el-select v-model="value" @change="val => emit('update:method', val)" placeholder="Select" size="small" class="select">
                <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
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