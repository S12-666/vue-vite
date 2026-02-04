<script setup>
import { ref, reactive, computed, onActivated } from 'vue';
import { ElConfigProvider, ElMessage } from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { Monitor } from '@element-plus/icons-vue';
import { getTrendData, getSpecBox, getScatterData, getGanttData } from '@/api/api';
import VerticalBoxPlot from './VerticalBoxPlot.vue';

const value6 = ref('2021-06');
const loading = ref(false);
const loading1 = ref(false);
const specDetails = ref([]);

const filterParams = reactive({
    tgtthick: "[]",
    tgtwidth: "[]",
    tgtlength: "[]",
    dis_temp: "[]",
    fm_temp: "[]"
});

const emit = defineEmits(['query-success', 'scatter-success']);
const props = defineProps({
    brushRange: {
        type: Array,
        default: () => []
    },
    reductionMethod: { type: String, default: 'tsne' }
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
                Object.keys(filterParams).forEach(k => filterParams[k] = "[]");
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

const handleFilterUpdate = (payload) => {
    const { key, value } = payload;
    if (!value || value.length === 0) {
        filterParams[key] = "[]";
    } else {
        filterParams[key] = `[${value[0]}, ${value[1]}]`;
    }
    console.log('当前所有筛选条件:', JSON.stringify(filterParams));
};


const handleAnalysis = async (updateType = 'all') => {
    if (typeof updateType !== 'string') {
        updateType = 'all';
    }

    loading1.value = true;

    // 构造参数 (参数构造逻辑不变)
    const finalPayload = { ...filterParams, method: props.reductionMethod };
    if (props.brushRange && props.brushRange.length === 2) {
        finalPayload.date_range = `['${props.brushRange[0]}', '${props.brushRange[1]}']`;
    } else {
        finalPayload.date_range = "[]";
    }
    console.log(`执行分析模式: ${updateType}`, finalPayload);

    try {
        const tasks = [];

        // 1. 如果模式是 'all' 或 'scatter'，则添加散点图请求
        // 我们给 promise 加一个 then，把结果包装成 { type: 'scatter', data: res } 方便后续识别
        if (updateType === 'all' || updateType === 'scatter') {
            const task = getScatterData(finalPayload)
                .then(res => ({ type: 'scatter', data: res }));
            tasks.push(task);
        }

        // 2. 如果模式是 'all' 或 'gantt'，则添加甘特图请求
        if (updateType === 'all' || updateType === 'gantt') {
            const task = getGanttData(finalPayload)
                .then(res => ({ type: 'gantt', data: res }));
            tasks.push(task);
        }

        // 3. 并行执行所有添加的任务
        const results = await Promise.all(tasks);

        let hasSuccess = false;

        // 4. 遍历结果进行分发
        results.forEach(result => {
            if (result.type === 'scatter' && result.data) {
                emit('scatter-success', result.data);
                hasSuccess = true;
            }
            if (result.type === 'gantt' && result.data) {
                emit('gantt-success', result.data);
                hasSuccess = true;
            }
        });

        if (hasSuccess) {
            // 如果只是更新局部，提示语可以简化，或者保持“分析完成”
            ElMessage.success('分析完成');
        } else {
            ElMessage.warning('未能获取有效数据');
        }

    } catch (error) {
        console.error('分析请求失败', error);
        ElMessage.error('分析失败');
    } finally {
        loading1.value = false;
    }
};

defineExpose({
    handleAnalysis
});
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
            <VerticalBoxPlot :full-data="specDetails" :active-data="filteredSpecData"
                @update:filter="handleFilterUpdate" />
        </div>
        <div class="divider-line2"></div>
        <div class="diag-button">
            <el-button :loading="loading1" @click="handleAnalysis" style="width: 20%; height: 30px;">分析</el-button>
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