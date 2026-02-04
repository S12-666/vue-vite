<script setup>
import { ref, reactive, computed, onActivated, nextTick } from 'vue'
import { ElConfigProvider, ElMessage } from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import CtrlPanel from './panel/CtrlPanel.vue';
import TrendChart from './trend/TrendChart.vue';
import Embedding from './dimenreduc/Embedding.vue';
// import PrccessAnalysis from './analysis/PrccessAnalysis.vue';

// 趋势图数据
const trendData = ref(null);
const currentBrushRange = ref([]);
const currentScatterData = ref({});
const currentMethod = ref('tsne');
const ctrlPanelRef = ref(null);

const handlePanelData = (data) => {
    console.log('父组件收到了数据:', data);
    trendData.value = data;
};
const handleTimeBrush = (range) => {
    // range 应该是 ["2021-06-01", "2021-06-05"] 这种格式
    currentBrushRange.value = range;
};

const handleScatterData = (res) => {
    console.log('父组件收到了散点图数据:', res);
    if (res && res.data) {
        currentScatterData.value = res.data;
    } else {
        currentScatterData.value = res;
    }
};

const handleMethodChange = async (method) => {
    currentMethod.value = method;
    await nextTick();
    if (ctrlPanelRef.value) {
        ctrlPanelRef.value.handleAnalysis();
    }
};
</script>

<template>
    <div class="visual">
        <el-row :gutter="20" class="equal-height-row">
            <el-col :span="4" class="left-column-wrapper">
                <CtrlPanel ref="ctrlPanelRef" @query-success="handlePanelData" @scatter-success="handleScatterData" :brush-range="currentBrushRange" :reductionMethod="currentMethod"/>
                <Embedding style="margin-top: 20px;" :scatter-data="currentScatterData" @update:method="handleMethodChange"/>
            </el-col>
            <el-col :span="16" class="center-column-wrapper">
                <TrendChart :chart-data="trendData" @timeBrushed="handleTimeBrush"/>
                <!-- <PrccessAnalysis style="margin-top: 20px;" /> -->
            </el-col>
            <el-col :span="4" class="right-column-wrapper">
                <el-card class="visual-card">
                    <template #header>
                        <div class="card-header">
                            <el-icon class="header-icon">
                                <Monitor />
                            </el-icon>
                            <span>详细分析</span>
                        </div>
                    </template>
                    <div class="system-info-list">
                    </div>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<style scoped lang="less">
.visual {
    // 1. 强制行使用 Flex 布局，并拉伸对齐
    :deep(.equal-height-row) {
        display: flex; 
        flex-wrap: wrap; // 防止小屏幕布局崩坏
        align-items: stretch; // 关键：让所有 col 高度一致
    }

    // 2. 确保 el-col 本身也是 flex 容器（可选，视内部布局需要而定）
    :deep(.el-col) {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
    }

    // 3. 让中间和右侧的内部容器填满拉伸后的高度
    .center-column-wrapper {
        // 如果 TrendChart 需要填满高度，需要给它的容器设置 100%
        .full-height-container {
            height: 100%;
            // 如果图表需要滚动，可以加 overflow-y: auto
        }
    }

    .right-column-wrapper {
        // 让 el-card 填满整个列的高度
        .visual-card {
            height: 100%; 
            display: flex;       // 建议：让 card body 也能利用 flex
            flex-direction: column;
            
            // 修正 Element Plus card body 的高度
            :deep(.el-card__body) {
                flex: 1;         // 让内容区域占满剩余空间
                overflow-y: auto; // 如果内容太多，允许卡片内部滚动
            }
        }
    }
}
</style>