<script setup>
import { ref, reactive, computed, onActivated } from 'vue';
import { ElConfigProvider, ElMessage } from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { Monitor } from '@element-plus/icons-vue';
import { getTrendData, getSpecBox } from '@/api/api';
import VerticalBoxPlot from './VerticalBoxPlot.vue';

const value6 = ref('2021-06');
const loading = ref(false);
const specDetails = ref([]);

const emit = defineEmits(['query-success']);
const props = defineProps({
    brushRange: {
        type: Array,
        default: () => []
    }
});

const filteredSpecData = computed(() => {
    if (!props.brushRange || props.brushRange.length === 0) {
        return [];
    }
    const [start, end] = props.brushRange;
    return specDetails.value.filter(item => {
        if (!item.toc) return false;
        const datePart = item.toc ? item.toc.split(' ')[0] : '';
        return datePart >= start && datePart <= end;
    });
});

const handleQuery = async () => {
    if (!value6.value) {
        ElMessage.warning('请先选择月份');
        return;
    }

    loading.value = true;
    const params = { date: value6.value };

    try {
        const trendTask = getTrendData(params).then(res => {
            if (res) {
                // 将数据抛给父组件(Visual.vue)去渲染 TrendChart
                emit('query-success', res);
            }
        });

        const specTask = getSpecBox(params).then(res => {
            if (res) {
                specDetails.value = res || [];
            }
        });
        await Promise.all([trendTask, specTask]);
        ElMessage.success('查询成功');
    } catch (error) {
        console.error(error);
        ElMessage.error('查询失败');
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <el-card class="visual-card">
        <template #header>
            <div class="card-header">
                <el-icon class="header-icon">
                    <Monitor />
                </el-icon>
                <span>系统面板</span>
            </div>
        </template>
        <div class="system-info-list">
            <div class="month-pick">
                <el-config-provider :locale="zhCn">
                    <span>选择日期</span>
                    <el-date-picker v-model="value6" type="month" placeholder="选择月份" size="default"
                        style="width: 80%; height: 30px;" value-format="YYYY-MM" />
                </el-config-provider>
            </div>
            <el-button :loading="loading" @click="handleQuery"
                style="margin-left: 12px; width: 20%; height: 30px;">查询</el-button>
        </div>
        <div class="divider-line1"></div>
        <div class="spec-box">
            <VerticalBoxPlot :full-data="specDetails" :active-data="filteredSpecData" />
        </div>
        <div class="divider-line2"></div>
        <div class="diag-button">
            <el-button :loading="loading" style="width: 20%; height: 30px;">分析</el-button>
        </div>
    </el-card>
</template>

<style scoped>
@import '@/views/visual/style/card-style.css';

.system-info-list {
    display: flex;
    align-items: center;
    white-space: nowrap;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 10px;
}

.month-pick {
    display: flex;
    align-items: center;

    span {
        font-size: 14px;
        font-weight: 500;
        font-family: "Helvetica Neue, Helvetica, Arial, sans-serif";
        margin-right: 10px;
        white-space: nowrap;
        flex-shrink: 0;
    }
}

.divider-line1 {
    width: 100%;
    border-top: 1px solid #dcdfe6;
    /* Element Plus 常用边框灰 */
    margin: 10px 0 0 0;
}

.divider-line2 {
    width: 100%;
    border-top: 1px solid #dcdfe6;
    /* Element Plus 常用边框灰 */
    margin: 0 0 10px 0;
}

.spec-box {
    width: 100%;
    height: 300px;
}

.diag-button {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 5px;
}
</style>