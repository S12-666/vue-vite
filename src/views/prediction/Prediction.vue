<script setup>
import { ref, reactive, computed, onActivated } from 'vue'
import { ElMessage } from 'element-plus';
import { useRouter, useRoute } from 'vue-router';
import { loadIcon } from '@/utils/icons_utils/iconLoader.js';
import { buildSankeyFromPredictions } from '@/utils/sankey_utils/sankey_builder.js'
import { getCategoryMapper } from '@/utils/index_utils/index_group.js'
import { getPredictionUpid, getPredictionResult } from '@/api/api.js';
import SankeyDiagram from '@/views/prediction/SankeyDiagram.vue';

const router = useRouter();
const route = useRoute();

const queryParams = reactive({
    upid: '19327316000',
})

const searchResult = ref({
    upid: '',
    status_cooling: null,
    platetype: '',
    p_label: []
});

const loading = ref(false)

const sankeyData = ref({
    status_cooling: null,
    nodes: [],
    links: [],
    raw: null
})

const performanceTags = computed(() => {
    const tagNames = ['pa', 'pf', 'pn', 'ps', 'gs'];
    const values = searchResult.value.p_label || [];
    return tagNames.map((name, index) => {
        const val = values[index];
        let type = 'info';
        if (val === 1) {
            type = 'primary';
        } else if (val === 0) {
            type = 'danger';
        }
        return { name, type, val };
    });
});

const handleQuery = async () => {
    const params = {
        upid: queryParams.upid,
    }
    try {
        const res = await getPredictionUpid(params)
        if (res) {
            searchResult.value = res;
            ElMessage({
                showClose: true,
                message: '查询成功',
                type: 'success'
            })
        }
    } catch (error) {
        console.error('请求失败', error);
        ElMessage({
            showClose: true,
            message: '请求数据失败 请检查后台服务器',
            type: 'error'
        })
    }
}

const handlePrediction = async () => {
    if (!searchResult.value.upid) {
        ElMessage.warning('请先查询有效的UPID后再进行预测');
        return;
    }
    loading.value = true
    const data = {
        upid: searchResult.value.upid,
        status_cooling: searchResult.value.status_cooling,
        platetype: searchResult.value.platetype,
        label: searchResult.value.p_label
    }
    try {
        const res = await getPredictionResult(data)
        console.log(res);

        if (res) {
            ElMessage({
                showClose: true,
                message: '预测成功',
                type: 'success'
            })
            const cooling = res.cooling_status;
            const predictions = res.predictions || res.prediction || {};
            const mapper = getCategoryMapper(cooling);
            const { nodes, links } = buildSankeyFromPredictions(predictions, cooling, mapper)
            sankeyData.value.status_cooling = cooling
            sankeyData.value.nodes = nodes
            sankeyData.value.links = links
            sankeyData.value.raw = predictions
        }
    } catch (error) {
        console.error('预测请求失败', error);
        ElMessage({
            showClose: true,
            message: '预测请求失败 请检查后台服务器',
            type: 'error'
        })
    }
}

const handleReset = () => {
    queryParams.upid = ''
    searchResult.value = {
        upid: '',
        status_cooling: null,
        platetype: '',
        p_label: []
    };
    ElMessage({
        showClose: true,
        message: '已重置查询条件 请选择',
        type: 'info'
    })
}

const handleProcessClick = (type) => {
    if (!queryParams.upid) {
        ElMessage.warning('缺少UPID，无法跳转');
        return;
    }
    const pathMap = {
        'heating': '/heating',
        'rolling': '/rolling',
        'cooling': '/cooling'
    };
    const targetPath = pathMap[type];
    if (targetPath) {
        router.push({
            path: targetPath,
            query: {
                upid: queryParams.upid,
                from: route.path
            }
        });
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
                <el-card style="width: 100%;">
                    <template #header>
                        <div class="card-header">
                            <span>panel</span>
                        </div>
                    </template>
                    <p v-for="o in 4" :key="o" class="text item">{{ 'List item ' + o }}</p>
                </el-card>
            </el-col>
            <el-col :span="16">
                <el-card style="width: 100%;">
                    <template #header>
                        <div class="card-header">
                            <span>xGboost+shap</span>
                        </div>
                    </template>
                    <div class="sankey-diagram">
                        <SankeyDiagram :sankey-data="sankeyData" />
                    </div>
                </el-card>
            </el-col>
            <el-col :span="4">
                <el-card style="width: 100%;">
                    <template #header>
                        <div class="card-header">
                            <span>Prediction Result</span>
                        </div>
                    </template>
                    <p>redar</p>
                </el-card>
            </el-col>
        </el-row>
    </div>

</template>

<style scoped lang="less">
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

.visual {
    margin-top: 20px;
    padding: 10px, 0;

    :deep(.el-card__header) {
        height: 40px;
        padding: 10 12px;
        display: flex;
        align-items: center;
        // background-color: #DCDCDC;
    }

    .card-header {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: flex-start;
    }

    .card-header span {
        font-size: 16px;
        font-weight: 3000;
        color: #333;
        line-height: 1;
        font-family: "Helvetica Neue, Helvetica, Arial, sans-serif"
    }
}
</style>