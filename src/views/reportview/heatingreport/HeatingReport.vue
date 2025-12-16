<script setup>
import { reactive } from 'vue'
import { ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';


const queryParams = reactive({
    slabId: '',
    plateId: '',
    materialInput: '',

    thick: [0, 80],     // 滑块范围数组
    cr: [20, 40],
    adaptKey: '',

    width: [3, 8],
    topFlow: [40, 60],
    tapCode: '',

    length: [2, 18],
    precPercent: [30, 70],
    precCType: '',
    precCVal: '',

    dateStart: '2019-06-01',
    dateEnd: '2019-06-30',
    materialSelect: ''
})
</script>

<template>
    <div class="top-search-bar">
        <el-form :model="queryParams" inline class="search-form">
            <div class="flex-container">

                <div class="flex-item">
                    <el-config-provider :locale="zhCn">
                        <span class="custom-label">选择日期</span>
                        <el-date-picker v-model="value1" type="daterange" range-separator="至" start-placeholder="开始时间"
                            end-placeholder="结束时间" @change="handleDateChange" value-format="YYYY-MM-DD"
                            class="custom-input" />
                    </el-config-provider>
                </div>

                <div class="flex-item">
                    <span class="custom-label">SlabID</span>
                    <el-input v-model="queryParams.slabId" placeholder="输入板坯号" clearable class="custom-input" />
                </div>

                <div class="flex-item">
                    <span class="custom-label">UPID</span>
                    <el-input v-model="queryParams.upId" placeholder="输入钢板号" clearable class="custom-input" />
                </div>

                <div class="flex-item button-group">
                    <el-button type="primary" :icon="Search" @click="handleQuery">查询</el-button>
                    <el-button :icon="Refresh" @click="handleReset">重置</el-button>
                </div>

            </div>
        </el-form>
    </div>

    <div class="filter">
        
    </div>
</template>

<style scoped lang="less">
.top-search-bar {
    background: #fff;
    padding: 10px 0;
    
    border-bottom: #DCDCDC 1px solid;
}

/* Flex 容器核心配置 */
.flex-container {
    display: flex;
    align-items: center;
    /* 垂直居中 */
    justify-content: start;
    /* 关键：两端对齐，中间间距自动均匀 */
    flex-wrap: nowrap;
    /* 强制不换行 */
    gap: 30px;
    /* 设置最小间距，防止窗口缩小时挤在一起 */
    width: 100%;
    overflow-x: auto;
}

/* 每个搜索项的包装 */
.flex-item {
    display: flex;
    align-items: center;
    /* 保证 Label 和 Input 垂直对齐 */
    white-space: nowrap;
    /* 防止标签换行 */
}

/* 统一的标签样式 (继承自你原来的 .demonstration) */
.custom-label {
    color: #303133;
    /* 原来的 var(--el-text-color-secondary) 改为你指定的深色 */
    font-size: 16px;
    font-family: "microsoft yahei";
    font-weight: bold;
    margin-right: 12px;
    /* 标签和输入框的距离 */
    white-space: nowrap;
}

.custom-input {
    width: 240px;
    /* 你可以根据需要调整这个宽度，或者设为 auto */
}

/* 针对日期选择器的特殊微调，因为它自带宽度 */
:deep(.el-date-editor--daterange.el-input__inner) {
    width: 240px;
}

.button-group {
    margin-left: 79px;
}
</style>