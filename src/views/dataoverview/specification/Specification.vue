<template>
    <el-config-provider :locale="zhCn">
        <div class="demo-date-picker">
            <div class="block">
                <span class="demonstration">选择日期</span>
                <el-date-picker v-model="value1" type="daterange" range-separator="至" start-placeholder="开始时间"
                    end-placeholder="结束时间" @change="handleDateChange" value-format="YYYY-MM-DD" />
            </div>
        </div>
    </el-config-provider>
    <div class="specCharts">
        <div class="count_chart">
            <SpecificationsCharts :date-range="value1" />
        </div>
        <div class="rhythm">
            <RhythmCharts :xData="lineX" :yData="lineY" />
        </div>
    </div>
    <div class="table-container">
        <el-table :data="paginatedData" border strip style="width: 100%">
            <el-table-column prop="index" label="No." width="58" align="center" />
            <el-table-column prop="upid" label="upid" width="110" align="center" />
            <el-table-column prop="slabid" label="slabid" width="110" align="center" />
            <el-table-column prop="platetype" label="platetype" width="85" align="center" />
            <el-table-column prop="steelspec" label="steelspec" width="136" align="center" />
            <el-table-column prop="toc" label="toc" min-width="145" align="center" />
            <el-table-column prop="slabthick" label="slabthick" width="80" align="center" />
            <el-table-column prop="tgtthick" label="tgtthick" width="80" align="center" />
            <el-table-column prop="tgtlen" label="tgtlenght" width="85" align="center" />
            <el-table-column prop="tgtwidth" label="tgtwidth" width="85" align="center" />
            <el-table-column prop="tgtdistemp" label="tgtdistemp" width="95" align="center" />
            <el-table-column prop="tgttmptemp" label="tgttmptemp" width="100" align="center" />
            <el-table-column prop="c_start_t" label="c_start_t" width="80" align="center" />
            <el-table-column prop="c_stop_t" label="c_stop_t" width="80" align="center" />
            <el-table-column prop="c_rate" label="c_rate" width="75" align="center" />
            <el-table-column prop="fault" label="fault" width="170" align="center">
                <template #default="scope">
                    <div class="fault-container">
                        <div v-for="(label, index) in faultLabels" :key="label" class="status-circle"
                            :class="getStatusClass(scope.row.fault[index])">
                            {{ label }}
                        </div>
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="c_rate" label="Type" width="115" align="center">
                <template #default="scope">
                    <div class="process-icon-container">
                        <img :src="loadIcon('heating')" class="process-icon clickable-icon" title="加热" @click="handleProcessClick('heating', scope.row)" />
                        <img :src="loadIcon('rolling')" class="process-icon clickable-icon" title="轧制" @click="handleProcessClick('rolling', scope.row)" />
                        <img v-if="scope.row.c_rate !== 0" :src="loadIcon('cooling')" class="process-icon clickable-icon" title="冷却" @click="handleProcessClick('cooling', scope.row)" />
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
import { ElMessage } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
import SpecificationsCharts from '@/views/dataoverview/specification/SpecificationsCharts.vue';
import RhythmCharts from '@/views/dataoverview/specification/RhythmCharts.vue';

const router = useRouter();
const route = useRoute();
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
    if (val && val.length === 2) {
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
        if (!value1.value || value1.value.length !== 2) {
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

const handleProcessClick = (type, row) => {
    if (!row || !row.upid) {
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
                upid: row.upid,
                from: route.path
            }
        });
    }
};

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
    color: var(--el-text-color-secondary);
    font-size: 16px;
    margin-right: 12px;
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
}

.fault-container {
    display: flex;
    justify-content: center;
    gap: 6px;
}

.status-circle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: white;
    font-weight: bold;
}

.bg-red {
    background-color: var(--el-color-danger);
}

.bg-blue {
    background-color: var(--el-color-primary);
}

.bg-gray {
    background-color: var(--el-text-color-placeholder);
}

.process-icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
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

.pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 10px;
    padding-bottom: 10px;
}

:deep(.el-table) {
    will-change: transform;
    transform: translateZ(0);
}

:deep(.el-table__body tr) {
    transform: translateZ(0);
}

:deep(.el-table__body .el-table__cell) {
    font-size: 12px;
    font-family: "Helvetica Neue, Helvetica, Arial, sans-serif";
    color: #606266;
}

/* 修改表头样式，使其与原英文风格接近（可选） */
:deep(.el-table__header-wrapper .el-table__cell) {
    font-weight: bold;
    color: #333;
    background-color: #f6f8fa;
    // border: 1px solid #919191;
    font-family: "Helvetica Neue, Helvetica, Arial, sans-serif";
    font-size: 12px;
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