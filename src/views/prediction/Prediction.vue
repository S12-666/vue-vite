<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus';
import { useRouter, useRoute } from 'vue-router';
import { loadIcon } from '@/utils/icons_utils/iconLoader.js';
import { buildSankeyFromPredictions } from '@/utils/sankey_utils/sankey_builder.js'
import { getCategoryMapper } from '@/utils/index_utils/index_group.js'
import { getPredictionUpid, getPredictionResult, getSystemConfig } from '@/api/api.js';
import SankeyDiagram from '@/views/prediction/SankeyDiagram.vue';
import RadarChart from '@/views/prediction/RadarChart.vue';
import AccuracyChart from './AccuracyChart.vue';
import { Monitor, Cpu, Connection, Odometer } from '@element-plus/icons-vue'

const router = useRouter();
const route = useRoute();

// 1. 核心变量定义
const order = ['pa', 'pf', 'pn', 'ps', 'gs']

const queryParams = reactive({
    upid: '19327316000',
})

const systemInfo = ref({
    os_version: '等待检测...',
    cpu_config: '---',
    memory_config: '---',
    gpu_config: '---',
    network_status: '---'
})

const searchResult = ref({
    upid: '',
    status_cooling: null,
    platetype: '',
    p_label: []
});

const loading = ref(false)

// 图表数据
const sankeyData = ref({ status_cooling: null, nodes: [], links: [], raw: null })
const radarData = ref({ indicators: [], values: [], bgColors: [], rawData: [] })
const accuracyData = ref([]);

// 表单数据
const processForm = reactive({
    tags: { pa: 2, pf: 2, pn: 2, ps: 2, gs: 2 },
    isCorrect: true,
    isError: false,
    isIntervention: false,
    remarks: ''
});

const originalLabels = ref({ pa: 2, pf: 2, pn: 2, ps: 2, gs: 2 });

const submitDialogVisible = ref(false);
const submitPassword = ref('');
const submitLoading = ref(false);

const submitResultArray = computed(() => {
    return order.map(key => processForm.tags[key]);
});

const handleFormSubmit = () => {
    // 1. 打开前清空密码
    submitPassword.value = '';
    // 2. 显示对话框
    submitDialogVisible.value = true;
};

const handleFinalSubmit = () => {
    if (!submitPassword.value) {
        ElMessage.warning('请输入用户密码');
        return;
    }

    submitLoading.value = true;

    // 模拟 mockData/permission.js 中的校验逻辑
    // 这里假设当前操作用户是 superadmin，密码必须是 woshimima
    setTimeout(() => {
        if (submitPassword.value === 'woshimima') {
            ElMessage.success('密码验证通过，准备提交数据...');

            // TODO: 这里写真正的后端提交接口逻辑
            // const payload = {
            //     upid: searchResult.value.upid,
            //     tags: submitResultArray.value,
            //     remarks: processForm.remarks,
            //     ...
            // }

            // 验证成功后关闭对话框
            submitDialogVisible.value = false;
        } else {
            ElMessage.error('密码错误，权限验证失败');
        }
        submitLoading.value = false;
    }, 500); // 加一点延迟模拟感
};

// 2. 监听器与计算属性
watch(() => searchResult.value.p_label, (newLabels) => {
    if (newLabels && newLabels.length === 5) {
        order.forEach((key, index) => {
            const val = newLabels[index];
            processForm.tags[key] = val;
            originalLabels.value[key] = val;
        });
        processForm.isCorrect = true;
        processForm.isError = false;
        processForm.isIntervention = false;
        processForm.remarks = '';
    }
}, { deep: true });

const performanceTags = computed(() => {
    const tagNames = ['pa', 'pf', 'pn', 'ps', 'gs'];
    const values = searchResult.value.p_label || [];
    return tagNames.map((name, index) => {
        const val = values[index];
        let type = 'info';
        if (val === 1) type = 'primary';
        else if (val === 0) type = 'danger';
        return { name, type, val };
    });
});

// 3. 业务逻辑函数
const handleQuery = async () => {
    const params = { upid: queryParams.upid }
    try {
        const [baseRes, configRes] = await Promise.all([
            getPredictionUpid(params),
            getSystemConfig().catch(() => null)
        ])
        if (baseRes) {
            searchResult.value = baseRes;
            ElMessage.success('查询成功');
        }
        if (configRes && configRes.data) {
            systemInfo.value.os_version = configRes.data.os_version;
            systemInfo.value.cpu_config = configRes.data.cpu_config;
            systemInfo.value.memory_config = configRes.data.memory_config;
            systemInfo.value.gpu_config = configRes.data.gpu_config;
            systemInfo.value.network_status = configRes.data.network_status;
        } else if (configRes) {
            systemInfo.value = configRes;
        }
    } catch (error) {
        console.error(error);
        ElMessage.error('请求失败');
    }
}

const handlePrediction = async () => {
    if (!searchResult.value.upid) {
        ElMessage.warning('请先查询有效的UPID后再进行预测');
        return;
    }
    loading.value = true
    order.forEach(key => {
        processForm.tags[key] = 2;
    });
    const data = {
        upid: searchResult.value.upid,
        status_cooling: searchResult.value.status_cooling,
        platetype: searchResult.value.platetype,
        label: searchResult.value.p_label
    }
    try {
        const res = await getPredictionResult(data)
        if (res) {
            ElMessage.success('预测成功');
            const cooling = res.cooling_status;
            const predictions = res.predictions || res.prediction || {};
            const mapper = getCategoryMapper(cooling);
            const { nodes, links } = buildSankeyFromPredictions(predictions, cooling, mapper)

            sankeyData.value.status_cooling = cooling
            sankeyData.value.nodes = nodes
            sankeyData.value.links = links
            sankeyData.value.raw = predictions

            const indicators = [];
            const values = [];
            const bgColors = [];
            const rawData = [];
            const accList = [];

            order.forEach(key => {
                const item = predictions[key];
                if (item && item.model_metrics) {
                    accList.push({ name: key, value: item.model_metrics.accuracy });
                } else {
                    accList.push({ name: key, value: 0 });
                }
                const labelVal = (item && item.pred_label !== undefined) ? item.pred_label : 2;
                processForm.tags[key] = labelVal;
                originalLabels.value[key] = labelVal;
                const label = item ? item.pred_label : 1;
                const abProb = item ? item.abnormal_prob : 0;
                const healthScore = 1 - abProb;
                indicators.push({ name: key.toUpperCase(), max: 1 });
                values.push(healthScore);
                bgColors.push(label === 1 ? 'rgba(64, 158, 255, 0.25)' : 'rgba(245, 108, 108, 0.25)');
                rawData.push(item);
            });

            radarData.value = { indicators, values, bgColors, rawData };
            accuracyData.value = accList;

            processForm.isIntervention = false;
            processForm.isCorrect = true;
            processForm.isError = false;
        }
    } catch (error) {
        console.error(error);
        ElMessage.error('预测请求失败');
    } finally {
        loading.value = false
    }
}

const handleTagChange = (key, newVal) => {
    processForm.tags[key] = newVal;
    let hasChanged = false;
    order.forEach(k => {
        if (processForm.tags[k] !== originalLabels.value[k]) hasChanged = true;
    });
    processForm.isIntervention = hasChanged;
};

const handleVerifyChange = (type, val) => {
    if (type === 'correct' && val) processForm.isError = false;
    else if (type === 'error' && val) processForm.isCorrect = false;
};

const handleFormReset = () => {
    Object.assign(processForm.tags, originalLabels.value);
    processForm.isCorrect = true;
    processForm.isError = false;
    processForm.isIntervention = false;
    processForm.remarks = '';
    ElMessage.info('表单已重置');
};

const getTagType = (val) => {
    if (val === 1) return 'success';
    if (val === 0) return 'danger';
    return 'info';
};

const handleReset = () => {
    queryParams.upid = '';
    searchResult.value = { upid: '', status_cooling: null, platetype: '', p_label: [] };
    ElMessage.info('已重置');
}

const handleProcessClick = (type) => {
    if (!queryParams.upid) {
        ElMessage.warning('缺少UPID');
        return;
    }
    const pathMap = { 'heating': '/heating', 'rolling': '/rolling', 'cooling': '/cooling' };
    if (pathMap[type]) {
        router.push({ path: pathMap[type], query: { upid: queryParams.upid, from: route.path } });
    }
};
</script>

<template>
    <div class="top-search-bar">
        <el-form :model="queryParams" inline class="search-form">
            <div class="flex-container">
                <div class="flex-item">
                    <span class="custom-label">UPID</span>
                    <el-input v-model="queryParams.upid" placeholder="输入钢板号" clearable class="custom-input" />
                </div>
                <div class="flex-item button-group">
                    <el-button type="primary" @click="handleQuery">查询</el-button>
                    <el-button @click="handleReset">重置</el-button>
                </div>
            </div>
        </el-form>
        <div class="process">
            <span class="custom-label">工艺:</span>
            <div class="process-icon-container">
                <img v-if="searchResult.upid" :src="loadIcon('heating')" class="process-icon clickable-icon" title="加热"
                    @click="handleProcessClick('heating')" />
                <img v-if="searchResult.upid" :src="loadIcon('rolling')" class="process-icon clickable-icon" title="轧制"
                    @click="handleProcessClick('rolling')" />
                <img v-if="searchResult.upid && searchResult.status_cooling === 0" :src="loadIcon('cooling')"
                    class="process-icon clickable-icon" title="冷却" @click="handleProcessClick('cooling')" />
            </div>
        </div>
        <div class="steel-spec">
            <span class="custom-label">钢种:</span>
            <div class="tag-group">
                <el-tag type="warning" effect="plain">{{ searchResult.platetype || '---' }}</el-tag>
            </div>
        </div>
        <div class="p-label">
            <span class="custom-label">性能:</span>
            <div class="tag-group">
                <el-tag v-for="tag in performanceTags" :key="tag.name" :type="tag.type">{{ tag.name }}</el-tag>
            </div>
        </div>
        <div class="predict-btn">
            <el-button type="success" @click="handlePrediction" :loading="loading">预测</el-button>
        </div>
    </div>

    <div class="visual">
        <el-row :gutter="20">
            <el-col :span="4">
                <el-card class="visual-card">
                    <template #header>
                        <div class="card-header">
                            <el-icon class="header-icon">
                                <Monitor />
                            </el-icon>
                            <span>Panel</span>
                        </div>
                    </template>
                    <div class="system-info-list">
                        <div class="info-item">
                            <div class="icon-box bg-blue"><el-icon>
                                    <Monitor />
                                </el-icon></div>
                            <div class="info-content">
                                <div class="label">OS System</div>
                                <el-tooltip :content="systemInfo.os_version" placement="top" effect="light">
                                    <div class="value text-truncate">{{ systemInfo.os_version }}</div>
                                </el-tooltip>
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="icon-box bg-purple"><el-icon>
                                    <Cpu />
                                </el-icon></div>
                            <div class="info-content">
                                <div class="label">CPU Core</div>
                                <el-tooltip :content="systemInfo.cpu_config" placement="top">
                                    <div class="value text-truncate">{{ systemInfo.cpu_config }}</div>
                                </el-tooltip>
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="icon-box bg-green"><span style="font-weight:bold; font-size:10px">GPU</span>
                            </div>
                            <div class="info-content">
                                <div class="label">Graphics</div>
                                <el-tooltip :content="systemInfo.gpu_config" placement="top">
                                    <div class="value text-truncate"
                                        :class="{ 'highlight-gpu': systemInfo.gpu_config.includes('NVIDIA') }">
                                        {{ systemInfo.gpu_config }}</div>
                                </el-tooltip>
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="icon-box bg-orange"><el-icon>
                                    <Odometer />
                                </el-icon></div>
                            <div class="info-content">
                                <div class="label">Memory</div>
                                <div class="value text-truncate">{{ systemInfo.memory_config }}</div>
                            </div>
                        </div>
                        <div class="info-item border-none">
                            <div class="icon-box"
                                :class="systemInfo.network_status.includes('畅通') ? 'bg-success' : 'bg-danger'">
                                <el-icon>
                                    <Connection />
                                </el-icon>
                            </div>
                            <div class="info-content">
                                <div class="label">Network</div>
                                <div class="value">{{ systemInfo.network_status }}</div>
                            </div>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :span="16">
                <el-card class="visual-card">
                    <template #header>
                        <div class="card-header"><span>xGboost+shap</span></div>
                    </template>
                    <div class="sankey-diagram chart-container-large">
                        <SankeyDiagram :sankey-data="sankeyData" />
                    </div>
                </el-card>

                <el-card class="visual-card" style="margin-top: 20px;">
                    <template #header>
                        <div class="card-header"><span>PCA-diag</span></div>
                    </template>
                    <div class="sankey-diagram chart-container-small">
                        <SankeyDiagram :sankey-data="sankeyData" />
                    </div>
                </el-card>
            </el-col>

            <el-col :span="4">
                <el-card class="visual-card">
                    <template #header>
                        <div class="card-header"><span>Prediction Result</span></div>
                    </template>
                    <div class="chart-container-large result-container">
                        <div class="radar-diagram">
                            <RadarChart :radar-data="radarData" />
                        </div>
                        <div class="accu-diagram">
                            <div class="sub-title">Accuracy</div>
                            <div class="accu-chart-wrapper">
                                <AccuracyChart :accuracy-data="accuracyData" />
                            </div>
                        </div>
                    </div>
                </el-card>

                <el-card class="visual-card" style="margin-top: 20px;">
                    <template #header>
                        <div class="card-header"><span>Processing results</span></div>
                    </template>
                    <div class="result-form-container">
                        <div class="result-form">
                            <div class="form-row align-top">
                                <span class="row-label" style="margin-top: 5px;">预测标签:</span>
                                <div class="tags-container">
                                    <template v-for="key in order" :key="key">
                                        <el-popover placement="top" :width="180" trigger="click">
                                            <template #reference>
                                                <el-tag :type="getTagType(processForm.tags[key])"
                                                    class="interactive-tag" effect="dark">
                                                    {{ key.toUpperCase() }}: {{ processForm.tags[key] }}
                                                </el-tag>
                                            </template>

                                            <div class="tag-selector">
                                                <p style="margin: 0 0 10px 0; font-size: 12px; color: #666;">
                                                    修正 {{ key.toUpperCase() }} 状态:
                                                </p>
                                                <div style="display: flex; justify-content: space-between; gap: 10px;">
                                                    <el-button size="small" type="success"
                                                        @click="handleTagChange(key, 1)">
                                                        正常 (1)
                                                    </el-button>

                                                    <el-button size="small" type="danger"
                                                        @click="handleTagChange(key, 0)">
                                                        异常 (0)
                                                    </el-button>
                                                </div>
                                            </div>
                                        </el-popover>
                                    </template>
                                </div>
                            </div>
                            <div class="form-row">
                                <span class="row-label">核实数据:</span>
                                <div class="checkbox-group">
                                    <el-checkbox v-model="processForm.isCorrect" label="正确"
                                        @change="(val) => handleVerifyChange('correct', val)" />
                                    <el-checkbox v-model="processForm.isError" label="错误"
                                        @change="(val) => handleVerifyChange('error', val)" />
                                </div>
                            </div>

                            <div class="form-row">
                                <span class="row-label">人工矫正:</span>
                                <div class="checkbox-group">
                                    <el-checkbox v-model="processForm.isIntervention" label="是否已人工矫正" />
                                </div>
                            </div>

                            <div class="form-row align-top">
                                <span class="row-label" style="margin-top: 5px;">备注信息:</span>
                                <el-input v-model="processForm.remarks" type="textarea" :rows="2"
                                    placeholder="请输入备注说明..." resize="none" />
                            </div>

                            <div class="form-actions">
                                <el-button type="primary" size="small" @click="handleFormSubmit">提交结果</el-button>
                                <el-button size="small" @click="handleFormReset">重置</el-button>
                            </div>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>
    </div>

    <el-dialog v-model="submitDialogVisible" title="提交结果确认" width="400px" center class="submit-dialog">
        <div class="dialog-content">
            <div class="dialog-row">
                <span class="d-label">提交结果：</span>
                <span class="d-value code-style">{{ JSON.stringify(submitResultArray) }}</span>
            </div>

            <div class="dialog-row">
                <span class="d-label">备注内容：</span>
                <span class="d-value text-gray">
                    {{ processForm.remarks || '（无备注）' }}
                </span>
            </div>

            <div class="dialog-row input-row">
                <span class="d-label">用户密码：</span>
                <el-input v-model="submitPassword" type="password" placeholder="请输入密码验证权限" show-password
                    style="width: 220px" @keyup.enter="handleFinalSubmit" />
            </div>
        </div>

        <template #footer>
            <span class="dialog-footer">
                <el-button @click="submitDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleFinalSubmit" :loading="submitLoading">
                    确认提交
                </el-button>
            </span>
        </template>
    </el-dialog>
</template>

<style scoped lang="less">
.visual {
    margin-top: 10px;
}

.top-search-bar {
    background: #fff;
    padding: 10px 0;
    padding-right: 40px;
    border-bottom: #DCDCDC 1px solid;
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    overflow-x: auto;
}

.flex-container {
    display: flex;
    align-items: center;
    justify-content: start;
    flex-wrap: nowrap;
    gap: 30px;
    width: 100%;
}

.flex-item {
    display: flex;
    align-items: center;
}

.custom-label {
    color: #303133;
    font-size: 16px;
    font-family: "microsoft yahei";
    margin-right: 12px;
    white-space: nowrap;
}

.custom-input {
    width: 240px;
}

.process {
    display: flex;
    align-items: center;
    margin-left: auto;
    margin-right: 50px;

    .process-icon-container {
        display: flex;
        align-items: center;
        gap: 12px;
    }
}

.process-icon {
    width: 24px;
    height: 24px;
    object-fit: contain;
    cursor: help;
    transition: transform 0.2s;
}

.clickable-icon {
    cursor: pointer;
    transition: transform 0.2s;
}

.process-icon:hover {
    transform: scale(1.2);
}

.steel-spec {
    display: flex;
    align-items: center;
    margin-right: 50px;
}

.p-label {
    display: flex;
    align-items: center;
}

.tag-group {
    display: flex;
    gap: 8px;

    :deep(.el-tag) {
        height: 32px;
        line-height: 30px;
        padding: 0 15px;
        font-size: 14px;
        border-radius: 4px;
    }
}

.predict-btn {
    display: flex;
    align-items: center;
    margin-left: 100px;
}

/* Card & Left Panel (自然高度) */
.visual-card {
    width: 100%;
}

:deep(.el-card__header) {
    height: 40px;
    padding: 10 12px;
    display: flex;
    align-items: center;
}

:deep(.el-card__body) {
    padding: 5px 10px;
}

.card-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;

    span {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        line-height: 1;
    }
}

.header-icon {
    margin-right: 8px;
    font-size: 18px;
    color: #409EFF;
}

.system-info-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding: 5px 0;
    /* 无强制高度，由内容撑开 */
}

.info-item {
    display: flex;
    align-items: center;
    padding-bottom: 12px;
    border-bottom: 1px dashed #eee;

    &.border-none {
        border-bottom: none;
        padding-bottom: 0;
    }
}

.icon-box {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    color: #fff;
    font-size: 18px;
    flex-shrink: 0;

    &.bg-blue {
        background: linear-gradient(135deg, #409EFF, #79bbff);
    }

    &.bg-purple {
        background: linear-gradient(135deg, #9b59b6, #be93d0);
    }

    &.bg-green {
        background: linear-gradient(135deg, #67C23A, #95d475);
    }

    &.bg-orange {
        background: linear-gradient(135deg, #E6A23C, #f3d19e);
    }

    &.bg-success {
        background-color: #67C23A;
    }

    &.bg-danger {
        background-color: #F56C6C;
    }
}

.info-content {
    overflow: hidden;
    flex-grow: 1;

    .label {
        font-size: 12px;
        color: #909399;
        margin-bottom: 5px;
    }

    .value {
        font-size: 13px;
        color: #303133;
        font-weight: 500;
        margin-top: 4px;

        &.highlight-gpu {
            color: #67C23A;
            font-weight: bold;
        }
    }

    .text-truncate {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
        display: block;
    }
}

/* ======================== 
    图表容器 (独立高度控制) 
   ======================== */
.chart-container-large {
    width: 100%;
    height: 450px;
    /* 大图表高度 */
}

.chart-container-small {
    width: 100%;
    height: 250px;
    /* 小图表高度 */
}

/* 右侧 Result 布局 */
.result-container {
    display: flex;
    flex-direction: column;
    /* 高度由 .chart-container-large 控制 */
}

.radar-diagram {
    width: 100%;
    height: 60%;
}

.accu-diagram {
    width: 100%;
    height: 40%;
    border-top: 1px dashed #eee;
    padding-top: 10px;
    margin-top: 10px;
    display: flex;
    flex-direction: column;
}

.accu-chart-wrapper {
    flex: 1;
    width: 100%;
    min-height: 0;
}

.sub-title {
    font-size: 12px;
    color: #909399;
    text-align: center;
    margin-bottom: 5px;
    font-weight: bold;
}

/* ======================== 
    右下角表单样式 
   ======================== */
.result-form-container {
    min-height: 250px;
    /* 最小高度 */
}

.result-form {
    padding: 10px 5px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.form-row {
    display: flex;
    align-items: center;
    font-size: 13px;

    &.align-top {
        align-items: flex-start;
    }
}

.row-label {
    width: 70px;
    color: #606266;
    font-weight: bold;
    flex-shrink: 0;
}

.tags-container {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
}

.interactive-tag {
    cursor: pointer;
    user-select: none;
    transition: all 0.2s;
    width: 48px;
    text-align: center;
    justify-content: center;

    &:hover {
        opacity: 0.8;
        transform: translateY(-1px);
    }
}

.checkbox-group {
    display: flex;
    gap: 15px;

    :deep(.el-checkbox) {
        margin-right: 0;
        height: 24px;
    }

    :deep(.el-checkbox__label) {
        font-size: 13px;
        padding-left: 6px;
    }
}

.form-actions {
    margin-top: auto;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 5px;
    border-top: 1px dashed #eee;
}

:deep(.el-textarea__inner) {
    font-size: 12px;
    padding: 5px 8px;
}

.dialog-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 10px 20px;
}

.dialog-row {
    display: flex;
    align-items: flex-start;
    font-size: 14px;
    line-height: 1.5;

    &.input-row {
        align-items: center;
        margin-top: 10px;
        padding-top: 20px;
        border-top: 1px dashed #eee;
    }
}

.d-label {
    width: 80px;
    font-weight: bold;
    color: #303133;
    flex-shrink: 0;
}

.d-value {
    color: #606266;
    word-break: break-all;
}

.code-style {
    font-family: Consolas, Monaco, monospace;
    background-color: #f4f4f5;
    padding: 2px 6px;
    border-radius: 4px;
    color: #409EFF;
    font-weight: bold;
}

.text-gray {
    color: #909399;
    font-style: italic;
}
</style>