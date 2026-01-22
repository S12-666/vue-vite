<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { Timer } from '@element-plus/icons-vue';

const props = defineProps({
    predictionData: {
        type: Object,
        default: () => ({})
    },
    isLoading: {
        type: Boolean,
        default: false
    }
});

const processPercentage = ref(0);
const processStatus = ref('');

const tableData = computed(() => {
    const preds = props.predictionData?.predictions;
    if (!preds) return [];

    const order = ['pa', 'pf', 'pn', 'ps', 'gs'];
    return order.map(key => {
        const item = preds[key];
        const metrics = item?.model_metrics || {};

        let modelName = metrics.model_type;
        if (!modelName) {
            if (metrics.auc !== undefined) modelName = 'XGBoost';
            else modelName = 'PCA';
        }
        if (modelName.includes('PCA')) modelName = 'PCA-Reconst';

        return {
            name: key.toUpperCase(),
            model: modelName,
            trainSize: metrics.train_size ? metrics.train_size.toLocaleString() : '-',
            valSize: metrics.val_size ? metrics.val_size.toLocaleString() : '-'
        };
    });
});

let timer = null;

const startProgress = () => {
    processPercentage.value = 0;
    processStatus.value = '';
    if (timer) clearInterval(timer);

    timer = setInterval(() => {
        if (processPercentage.value < 95) {
            const step = Math.max(1, (98 - processPercentage.value) / 15);
            processPercentage.value += step;
        }
    }, 50);
};

const finishProgress = () => {
    if (timer) clearInterval(timer);
    processPercentage.value = 100;
    processStatus.value = 'success';
};

watch(() => props.isLoading, (newVal) => {
    if (newVal) {
        startProgress();
    } else {
        if (props.predictionData?.predictions) {
            finishProgress();
        }
    }
});

onUnmounted(() => {
    if (timer) clearInterval(timer);
});
</script>

<template>
    <div class="model-info-container">

        <div class="process-bar-section">
            <div class="process-label">
                <el-icon :size="20">
                    <Timer />
                </el-icon>
                <span>Analysis Progress</span>
            </div>
            <el-progress :text-inside="true" :stroke-width="22" :percentage="Math.floor(processPercentage)"
                :status="processStatus" striped striped-flow />
        </div>

        <div class="model-list">
            <div v-for="item in tableData" :key="item.name" class="model-item">
                <div class="item-row header">
                    <span class="type-text">{{ item.name }}</span>
                    <el-tag size="small" effect="plain"
                        v-bind="/xgboost|xgb/i.test(item.model) ? {} : { type: 'warning' }" class="model-tag">
                        {{ item.model }}
                    </el-tag>
                </div>

                <div class="item-row info">
                    <div class="data-pair">
                        <span class="label">Train:</span>
                        <span class="value">{{ item.trainSize }}</span>
                    </div>
                    <div class="divider" v-if="item.valSize !== '-'">|</div>
                    <div class="data-pair" v-if="item.valSize !== '-'">
                        <span class="label">Val:</span>
                        <span class="value">{{ item.valSize }}</span>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<style scoped lang="less">
.model-info-container {
    padding: 5px 10px;
    height: 100%;
    display: flex;
    flex-direction: column;
}

/* 进度条样式 */
.process-bar-section {
    margin-bottom: 15px;

    .process-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: #909399;
        margin-bottom: 8px;
        font-size: 14px;

        .el-icon {
            margin-right: 4px;
        }

        .process-text {
            color: #409EFF;
            font-weight: bold;
        }
    }
}

/* 列表容器 */
.model-list {
    flex: 1;
    overflow-y: auto;
    /* 如果内容过多允许滚动 */
    display: flex;
    flex-direction: column;
    gap: 8px;
    /* 列表项之间的间距 */
}

/* 单个列表项样式 */
.model-item {
    background-color: #fcfcfc;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    padding: 8px 10px;
    transition: all 0.3s;

    &:hover {
        background-color: #fdfdfd;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
    }
}

/* 行通用样式 */
.item-row {
    display: flex;
    align-items: center;
    justify-content: space-between;

    &.header {
        margin-bottom: 6px;
    }

    &.info {
        font-size: 12px;
        color: #909399;
    }
}

/* 具体元素样式 */
.type-text {
    font-weight: bold;
    color: #303133;
    font-size: 13px;
}

.model-tag {
    height: 20px;
    line-height: 18px;
    padding: 0 6px;
    font-size: 11px;
}

.data-pair {
    display: flex;
    gap: 4px;

    .label {
        font-size: 11px;
        color: #a8abb2;
    }

    .value {
        font-weight: 500;
        color: #606266;
    }
}

.divider {
    color: #e4e7ed;
    margin: 0 4px;
}
</style>