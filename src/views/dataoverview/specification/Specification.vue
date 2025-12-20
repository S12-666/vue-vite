<template>
    <el-config-provider :locale="zhCn">
        <div class="demo-date-picker">
            <div class="block">
                <span class="demonstration">选择日期</span>
                <el-date-picker v-model="value1" type="daterange" range-separator="至" start-placeholder="开始时间"
                    end-placeholder="结束时间"
                    @change="handleDateChange"
                    value-format="YYYY-MM-DD" />
            </div>
        </div>
    </el-config-provider>
    <div class="specCharts">
        <div class="count_chart">
            <SpecificationsCharts :date-range="value1"/>
        </div>
        <div class="rhythm">
            <RhythmCharts :xData="lineX" :yData="lineY"/>
        </div>
    </div>
    <div class="table-container">
        <el-table :data="paginatedData" border strip style="width: 100%">
            <el-table-column prop="index" width="58" align="center">
                <template #header>
                    <div class="column-header-box">
                        <span class="main-title">序号</span>
                        <span class="sub-title">No.</span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="upid" width="110">
                <template #header>
                    <div class="column-header-box">
                        <span class="main-title">钢板号</span>
                        <span class="sub-title">upid</span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="slabid" width="120">
                <template #header>
                    <div class="column-header-box">
                        <span class="main-title">板坯号</span>
                        <span class="sub-title">slabid</span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="platetype" width="90">
                <template #header>
                    <div class="column-header-box">
                        <span class="main-title">钢种牌号</span>
                        <span class="sub-title">platetype</span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="steelspec" width="136">
                <template #header>
                    <div class="column-header-box">
                        <span class="main-title">钢种规格</span>
                        <span class="sub-title">steelspec</span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="toc" min-width="134">
                <template #header>
                    <div class="column-header-box">
                        <span class="main-title">生产日期</span>
                        <span class="sub-title">toc</span>
                    </div>
                </template>
                <template #default="scope">
                    {{ scope.row.toc.slice(2, 16) }}
                </template>
            </el-table-column>
            <el-table-column prop="slabthick" width="85">
                <template #header>
                    <div class="column-header-box">
                        <span class="main-title">板坯厚度</span>
                        <span class="sub-title">slabthick</span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="tgtthick" width="85">
                <template #header>
                    <div class="column-header-box">
                        <span class="main-title">目标厚度</span>
                        <span class="sub-title">tgtthick</span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="tgtlen" width="85">
                <template #header>
                    <div class="column-header-box">
                        <span class="main-title">目标长度</span>
                        <span class="sub-title">tgtlength</span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="tgtwidth" width="90">
                <template #header>
                    <div class="column-header-box">
                        <span class="main-title">目标宽度</span>
                        <span class="sub-title">tgtwidth</span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="tgtdistemp" width="85">
                <template #header>
                    <div class="column-header-box">
                        <span class="main-title">出炉温度</span>
                        <span class="sub-title">tgtdistemp</span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="tgttmptemp" width="85">
                <template #header>
                    <div class="column-header-box">
                        <span class="main-title">终轧温度</span>
                        <span class="sub-title">tgttmptemp</span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="c_start_t" width="85">
                <template #header>
                    <div class="column-header-box">
                        <span class="main-title">开冷温度</span>
                        <span class="sub-title">c_start_t</span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="c_stop_t" width="85">
                <template #header>
                    <div class="column-header-box">
                        <span class="main-title">终冷温度</span>
                        <span class="sub-title">c_stop_t</span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="c_rate" width="85">
                <template #header>
                    <div class="column-header-box">
                        <span class="main-title">冷却速率</span>
                        <span class="sub-title">c_rate</span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="fault" width="170">
                <template #header>
                    <div class="column-header-box">
                        <span class="main-title">故障类型</span>
                        <span class="sub-title">fault</span>
                    </div>
                </template>
                <template #default="scope">
                    <div class="fault-container">
                        <div v-for="(label, index) in faultLabels" :key="label" class="status-circle"
                            :class="getStatusClass(scope.row.fault[index])">
                            {{ label }}
                        </div>
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="c_rate" width="115">
                <template #header>
                    <div class="column-header-box">
                        <span class="main-title">工艺类型</span>
                        <span class="sub-title">type</span>
                    </div>
                </template>
                <template #default="scope">
                    <div class="process-icon-container">
                        <img :src="loadIcon('heating')" class="process-icon" title="加热" />
                        <img :src="loadIcon('rolling')" class="process-icon" title="轧制" />
                        <img v-if="scope.row.c_rate !== 0" :src="loadIcon('cooling')" class="process-icon" title="冷却" />
                    </div>
                </template>
            </el-table-column>
        </el-table>
        <el-config-provider :locale="zhCn">
            <div class="pagination-wrapper">
                <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                    layout="total, sizes, prev, pager, next, jumper" :page-sizes="[10, 20, 40, 60]"
                    :current-page.sync="currentPage" :total="tableData.length" @size-change="handleSizeChange"
                    @current-change="handleCurrentChange" />
            </div>
        </el-config-provider>

    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { loadIcon } from '@/utils/icons_utils/iconLoader';
import { getStatusClass } from '@/utils/color_utils/colorSelect';
import { getSpecData } from '@/api/api.js';
import { useAllDataStore } from '@/stores/index.js';
import { ElMessage } from 'element-plus';

import SpecificationsCharts from '@/views/dataoverview/specification/SpecificationsCharts.vue';
import RhythmCharts from '@/views/dataoverview/specification/RhythmCharts.vue';

const store = useAllDataStore();

const value1 = ref(['2021-06-01', '2021-06-04']);
const faultLabels = ['pa', 'pf', 'pn', 'ps', 'gs'];
const tableData = ref([]);

const lineX = ref([]);
const lineY = ref([]);
const yDataNames = ['discharge', 'rm', 'fm', 'acc'];

const currentPage = ref(1);
const pageSize = ref(10);

const paginatedData = computed(() => {
    if (!tableData.value || tableData.value.length === 0) return [];
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return tableData.value.slice(start, end);
});
const handleSizeChange = (val) => {
    pageSize.value = val;
    currentPage.value = 1; // 重置到第一页
}
const handleCurrentChange = (val) => {
    currentPage.value = val;
}

const handleDateChange = (val) => {
    if(val && val.length === 2) {
        // console.log(val[0], val[1]);
        fetchTableData();
    } else {
        ElMessage({
            showClose: true,
            message: '请选择正确的日期范围',
            type: 'info'
        });
        value1.value = ['2021-06-01', '2021-06-03'];
    }
};

const fetchTableData = async () => {
    try {
        if(!value1.value || value1.value.length !== 2) {
            ElMessage({
                showClose: true,
                message: '请选择正确的日期范围',
                type: 'info'
            });
            return;
        }
        const params = {
            startTime: value1.value[0],
            endTime: value1.value[1],
        };
        
        const res = await getSpecData(params);
        // console.log(res);
        if (res && Array.isArray(res)) {
            tableData.value = res;
            currentPage.value = 1;

            lineX.value = res.map(item => item.slabid);
            lineY.value = yDataNames.map(name => ({
                name,
                type: 'line',
                data: res.map(item => item[name] || 0)
            }));
        } else {
            tableData.value = [];
            ElMessage({
                showClose: true,
                message: '表格数据为空！',
                type: 'error'
            })
        }
    } catch (error) {
        ElMessage({
            showClose: true,
            message: '获取表格数据失败！',
            type: 'error'
        });
    }
}

onMounted(() => {
    fetchTableData();
});

</script>

<style scoped lang="less">
.demo-date-picker {
    display: flex;
    width: 100%;
    padding: 0;
    flex-wrap: wrap;
    justify-content: flex-start;
}

.demo-date-picker .block {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 10px 0;
}

.demo-date-picker .demonstration {
    /* display: block; */
    color: var(--el-text-color-secondary);
    font-size: 16px;
    margin-right: 12px;
    /* margin-bottom: 1rem; */
    white-space: nowrap;
    color: #303133;
    font-family: "microsoft yahei";
    font-weight: bold;
}

.table-container {
    width: 100%;
    overflow: hidden;
    box-sizing: border-box;
    transition: width 0.3s ease;
    /* position: relative; */
}

/* 使用 Flex 布局让文字垂直排列 */
.column-header-box {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    line-height: 1.2;
    /* 调小行高，防止太占位置 */
}

.main-title {
    font-weight: bold;
    font-size: 14px;
}

.sub-title {
    font-size: 14px;
    color: #909399;
    /* 英文可以稍微淡一点，突出层次感 */
    transform: scale(0.9);
    /* 如果觉得英文太大，可以适当缩小 */
}

/* 容器：使用 Flex 布局让圆圈横向排列 */
.fault-container {
    display: flex;
    justify-content: center;
    /* 居中对齐 */
    gap: 6px;
    /* 圆圈之间的间距 */
}

/* 圆圈的基础样式 */
.status-circle {
    width: 24px;
    /* 圆圈宽度 */
    height: 24px;
    /* 圆圈高度 */
    border-radius: 50%;
    /* 变成圆形 */

    /* 文字居中与样式 */
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    /* 字体要小一点才能放进圈里 */
    color: white;
    /* 文字白色 */
    /* text-transform: uppercase; */
    /* 强制大写 (可选) */
    font-weight: bold;
}

/* 动态背景颜色类 */
.bg-red {
    background-color: var(--el-color-danger);
    /* Element Plus 默认红色 */
}

.bg-blue {
    background-color: var(--el-color-primary);
    /* Element Plus 默认蓝色 */
}

.bg-gray {
    background-color: var(--el-text-color-placeholder);
    /* 浅灰色 */
    /* 或者用更深一点的灰色 */
    /* background-color: #909399; */
}

/* 图标容器：让图标横向排列并居中 */
.process-icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    /* 图标之间的间距 */
}

/* 图标样式 */
.process-icon {
    width: 24px;
    /* 设置合适的宽度 */
    height: 24px;
    /* 设置合适的高度 */
    object-fit: contain;
    /* 保持图片比例 */

    /* 可选：加个鼠标悬停效果 */
    cursor: help;
    transition: transform 0.2s;
}

.process-icon:hover {
    transform: scale(1.2);
    /* 悬停时稍微放大 */
}

.pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 10px;
    padding-bottom: 10px;
}

/* 使用 will-change 提前告知浏览器 */
:deep(.el-table) {
    will-change: transform;
    transform: translateZ(0);
}

/* 优化表格单元格渲染 */
:deep(.el-table__body tr) {
    transform: translateZ(0);
}

:deep(.el-table__body .el-table__cell) {
    /* 1. 修改字体大小 */
    font-size: 12px;

    /* 2. 修改字体格式 (例如：微软雅黑、等宽字体等) */
    font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
    /* 如果是数字密集型表格，推荐用等宽字体，数字会对齐得更整齐： */
    /* font-family: Consolas, Monaco, monospace; */

    /* 3. (可选) 修改文字颜色 */
    color: #606266;
}

:deep(.el-table) {
    transform: translateZ(0);
    will-change: width;
}

@media screen and (max-width: 1200px) {
    .demo-date-picker .block {
        flex: 0 0 100%;
        padding: 1rem 0;
        min-width: auto;
        border-right: none;
        border-bottom: solid 1px var(--el-border-color);
    }

    .demo-date-picker .block:last-child {
        border-bottom: none;
    }
}

@import '@/views/dataoverview/specification/chartsLayout.css';




</style>