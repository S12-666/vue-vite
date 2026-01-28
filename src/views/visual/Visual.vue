<script setup>
import { ref, reactive, computed, onActivated } from 'vue'
import { ElConfigProvider, ElMessage } from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import CtrlPanel from './panel/CtrlPanel.vue';
import TrendChart from './trend/TrendChart.vue';
import Embedding from './dimenreduc/Embedding.vue';

// 趋势图数据
const trendData = ref(null);
const currentBrushRange = ref([]);
const currentScatterData = ref({});

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


</script>

<template>
    <div class="visual">
        <el-row :gutter="20">
            <el-col :span="4" class="left-column-wrapper">
                <CtrlPanel @query-success="handlePanelData" @scatter-success="handleScatterData" :brush-range="currentBrushRange"/>
                <Embedding style="margin-top: 20px;" :scatter-data="currentScatterData"/>
            </el-col>
            <el-col :span="16" class="center-column-wrapper">
                <TrendChart :chart-data="trendData" @timeBrushed="handleTimeBrush"/>
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

<style scoped lang="less"></style>