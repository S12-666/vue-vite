<script setup>
import { ref, nextTick } from 'vue'
import { Monitor } from '@element-plus/icons-vue';
import CtrlPanel from './panel/CtrlPanel.vue';
import TrendChart from './trend/TrendChart.vue'; // 这里面包含了 TimeBrush 和 Gantt
import Embedding from './dimenreduc/Embedding.vue';
import ProccessAnalysis from './analysis/ProccessAnalysis.vue';

// --- 数据状态 ---
const trendData = ref(null);         // 传给 TimeBrushD3 的数据
const currentBrushRange = ref([]);   // 时间刷选的时间范围
const currentScatterData = ref({});  // 传给 ScatterChart 的数据
const currentGanttData = ref({});    // 传给 GanttChart 的数据 (新增)
const currentMethod = ref('tsne');
const ctrlPanelRef = ref(null);
const selectedPlateData = ref(null);

// 你已经定义好了这个，现在我们来使用它
const currentHighlightUpids = ref([]);

// --- 事件处理 ---

// 1. 基础查询 (GetTrendData) -> 传给 TrendChart 里的 TimeBrush
const handlePanelData = (data) => {
    trendData.value = data;
};

// 2. 时间刷选回调
const handleTimeBrush = (range) => {
    currentBrushRange.value = range;
};

// 3. 分析结果：散点图
const handleScatterData = (res) => {
    // 兼容处理
    currentScatterData.value = (res && res.data) ? res.data : res;
};

// 4. 分析结果：甘特图/条形图 (新增)
const handleGanttData = (res) => {
    console.log('Visual收到甘特图数据:', res);
    currentGanttData.value = (res && res.data) ? res.data : res;
}

// 5. 降维算法切换 -> 通知 CtrlPanel 只刷新散点图
const handleMethodChange = async (method) => {
    currentMethod.value = method;
    await nextTick();
    if (ctrlPanelRef.value) {
        ctrlPanelRef.value.handleAnalysis('scatter');
    }
};

// 6. 新增：接收 TrendChart 冒泡上来的甘特图卡片点击事件
const handleGanttCardClick = (payload) => {
    currentHighlightUpids.value = payload.upids || [];
};

const onPlateSelected = (plateData) => {
    selectedPlateData.value = plateData;
};
</script>

<template>
    <div class="visual">
        <el-row :gutter="20" class="equal-height-row">
            <el-col :span="4" class="left-column-wrapper">
                <CtrlPanel ref="ctrlPanelRef" @query-success="handlePanelData" @scatter-success="handleScatterData"
                    @gantt-success="handleGanttData" :brush-range="currentBrushRange"
                    :reductionMethod="currentMethod" />

                <Embedding style="margin-top: 20px;" :scatter-data="currentScatterData"
                    :highlight-upids="currentHighlightUpids" @update:method="handleMethodChange" @clear-highlight="currentHighlightUpids = []"/>
            </el-col>

            <el-col :span="16" class="center-column-wrapper">
                <TrendChart :chart-data="trendData" :gantt-data="currentGanttData" @timeBrushed="handleTimeBrush"
                    @cardClick="handleGanttCardClick" @plateClicked="onPlateSelected"/>
            </el-col>

            <el-col :span="4" class="right-column-wrapper">
                <ProccessAnalysis :plate-data="selectedPlateData" />
            </el-col>
        </el-row>
    </div>
</template>

<style scoped lang="less">
/* 保持之前的 Flex 布局样式不变，确保高度对齐 */
.visual {
    :deep(.equal-height-row) {
        display: flex;
        flex-wrap: wrap;
        align-items: stretch;
    }

    :deep(.el-col) {
        display: flex;
        flex-direction: column;
    }

    .left-column-wrapper {
        /* 保持默认，无需特殊处理 */
    }

    /* 核心魔法：剥离中间和右侧撑开高度的能力 */
    .center-column-wrapper, .right-column-wrapper {
        position: relative; /* 将 column 设置为绝对定位的基准 */

        /* :deep(> *) 会选中 TrendChart 和 ProccessAnalysis 的最外层根节点 */
        :deep(> *) {
            position: absolute;
            top: 0;
            bottom: 0;
            /* 因为 el-row 的 gutter="20"，el-col 左右自带 10px padding */
            /* 用 left 和 right 完美抵消，防止内容贴边 */
            width: calc(100% - 20px);
            left: 10px;
            right: 10px;
            height: auto;
            margin: 0;
        }
    }
}
</style>