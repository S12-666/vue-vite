<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElConfigProvider, ElMessage } from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { getFQCReport } from '@/api/api.js'
import { getStatusClass } from '@/utils/color_utils/colorSelect.js'

const allTableData = ref([])  //存储接口返回的全部数据
const filteredTableData = ref([])  // 存储筛选后的数据
const initialRanges = ref({}) // 记录接口返回的初始范围，用于重置和颜色变化

const dialogVisible = ref(false)
const currentFaultRow = ref({})

const options = ref([])
const value = ref('')
const queryParams = reactive({
    slabid: '',
    upid: '',
})
const value1 = ref(['2021-06-01', '2021-06-02'])
const currentPage = ref(1)
const pageSize = ref(14)

const pfaultTypes = ['抗拉', '冲击', '落锤', '硬度', '晶粒度'];
const sfaultTypes = ['翘曲', '厚度异常', '中浪', '左边浪', '右边浪'];

const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredTableData.value.slice(start, end)
})

const filterParams = reactive({
    thick: [0, 300],
    width: [1.3, 5],
    length: [0, 52],
    tgthick: [0, 300],
    tgwidth: [1.3, 5],
    tglength: [0, 52]
})

const getTagType = (val) => {
    if (val === 0) return 'danger';
    if (val === 1) return 'primary';
    return 'info'; // 2 或其他情况
}

const handleSizeChange = (val) => {
    pageSize.value = val
    // 改变每页显示条数时，通常重置回第一页，防止页码溢出
    currentPage.value = 1
}

const handleCurrentChange = (val) => {
    currentPage.value = val
}

const handleDateChange = (val) => {
    if (val && val.length === 2) {
        // console.log(val[0], val[1]);
        ElMessage({
            showClose: true,
            message: '选择日期范围后可直接查询',
            type: 'info'
        })
    } else {
        ElMessage({
            showClose: true,
            message: '请选择正确的日期范围',
            type: 'info'
        });
        value1.value = [];
    }
};

const handleQuery = async () => {
    const requestBody = {
        daterange: value1.value || [],
        upid: queryParams.upid,
        slabid: queryParams.slabid
    }
    // console.log('请求体：', requestBody);
    try {
        const res = await getFQCReport(requestBody)
        if (res) {
            ElMessage({
                showClose: true,
                message: '查询成功',
                type: 'success'
            })
        }
        allTableData.value = res.tableData || [];
        filteredTableData.value = allTableData.value;
        // console.log(res);

        if (res.specs && Array.isArray(res.specs)) {
            options.value = res.specs.map(item => ({
                value: item,
                label: item
            }))
        }

        if (res.ranges) {
            const r = res.ranges
            if (r.thick_range) filterParams.thick = [...r.thick_range];
            if (r.width_range) filterParams.width = [...r.width_range];
            if (r.length_range) filterParams.length = [...r.length_range];
            if (r.tgthick_range) filterParams.tgthick = [...r.tgthick_range];
            if (r.tglength_range) filterParams.tglength = [...r.tglength_range];
            if (r.tgwidth_range) filterParams.tgwidth = [...r.tgwidth_range];

            initialRanges.value = {
                thick: r.thick_range ? [...r.thick_range] : [0, 50],
                width: r.width_range ? [...r.width_range] : [0, 10],
                length: r.length_range ? [...r.length_range] : [0, 10],
                tgthick: r.tgthick_range ? [...r.tgthick_range] : [0, 50],
                tglength: r.tglength_range ? [...r.tglength_range] : [0, 10],
                tgwidth: r.tgwidth_range ? [...r.tgwidth_range] : [0, 10]
            }
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

const handleReset = () => {
    queryParams.slabid = ''
    queryParams.upid = ''
    value1.value = []
    ElMessage({
        showClose: true,
        message: '已重置查询条件 请选择',
        type: 'info'
    })
}

const handleFilter = () => {
    const result = allTableData.value.filter(row => {
        if (value.value && row.steelspec !== value.value) {
            return false
        }

        if (row.thick < filterParams.thick[0] || row.thick > filterParams.thick[1]) return false;
        if (row.width < filterParams.width[0] || row.width > filterParams.width[1]) return false;
        if (row.length < filterParams.length[0] || row.length > filterParams.length[1]) return false;
        if (row.tgthick < filterParams.tgthick[0] || row.tgthick > filterParams.tgthick[1]) return false;
        if (row.tglength < filterParams.tglength[0] || row.tglength > filterParams.tglength[1]) return false;
        if (row.tgwidth < filterParams.tgwidth[0] || row.tgwidth > filterParams.tgwidth[1]) return false;

        return true;
    })
    filteredTableData.value = result;
    currentPage.value = 1;
    ElMessage({
        showClose: true,
        message: `筛选完成 共${result.length}条数据`,
        type: 'success'
    })
}

const handleFilterReset = () => {
    if (Object.keys(initialRanges.value).length > 0) {
        filterParams.thick = [...initialRanges.value.thick]
        filterParams.width = [...initialRanges.value.width]
        filterParams.length = [...initialRanges.value.length]
        filterParams.tgthick = [...initialRanges.value.tgthick]
        filterParams.tglength = [...initialRanges.value.tglength]
        filterParams.tgwidth = [...initialRanges.value.tgwidth]
    }

    value.value = '';
    filteredTableData.value = allTableData.value;
    currentPage.value = 1;
    ElMessage({
        showClose: true,
        message: '条件已重置',
        type: 'info'
    })
}

const isSliderChanged = (key) => {
    if (!initialRanges.value[key]) return false;
    const current = filterParams[key];
    const original = initialRanges.value[key];
    return current[0] !== original[0] || current[1] !== original[1];
}

const handleFaultClick = (row) => {
    currentFaultRow.value = row // 保存当前行数据
    dialogVisible.value = true  // 打开弹窗
}

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
                    <el-input v-model="queryParams.slabid" placeholder="输入板坯号" clearable class="custom-input" />
                </div>
                <div class="flex-item">
                    <span class="custom-label">UPID</span>
                    <el-input v-model="queryParams.upid" placeholder="输入钢板号" clearable class="custom-input" />
                </div>
                <div class="flex-item button-group">
                    <el-button type="primary" @click="handleQuery">查询</el-button>
                    <el-button @click="handleReset">重置</el-button>
                </div>
                <div class="title">
                    FQC报表
                </div>
            </div>
        </el-form>
    </div>


    <div class="complex-filter-container custom-theme">
        <div class="sliders-grid">
            <div class="slider-item">
                <span class="slider-label">Thick (mm)</span>
                <el-slider v-model="filterParams.thick" range :max="300" :step="1"
                    :class="{ 'changed-slider': isSliderChanged('thick') }" />
            </div>
            <div class="slider-item">
                <span class="slider-label">Width (m)</span>
                <el-slider v-model="filterParams.width" range :max="5" :step="0.001"
                    :class="{ 'changed-slider': isSliderChanged('width') }" />
            </div>
            <div class="slider-item">
                <span class="slider-label">Length (m)</span>
                <el-slider v-model="filterParams.length" range :max="60" :step="0.1"
                    :class="{ 'changed-slider': isSliderChanged('length') }" />
            </div>
            <div class="slider-item">
                <span class="slider-label">TgThick(mm)</span>
                <el-slider v-model="filterParams.tgthick" range :max="300" :step="1"
                    :class="{ 'changed-slider': isSliderChanged('tgthick') }" />
            </div>
            <div class="slider-item">
                <span class="slider-label">TgWidth (m)</span>
                <el-slider v-model="filterParams.tgwidth" range :max="5" :step="0.001"
                    :class="{ 'changed-slider': isSliderChanged('tgwidth') }" />
            </div>
            <div class="slider-item">
                <span class="slider-label">TgLength (m)</span>
                <el-slider v-model="filterParams.tglength" range :max="60" :step="0.1"
                    :class="{ 'changed-slider': isSliderChanged('tglength') }" />
            </div>
        </div>
        <div class="actions-panel">
            <div class="input-row">
                <span class="select-label">Spec: </span>
                <el-select v-model="value" placeholder="钢种" style="flex: 1" clearable>
                    <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </div>

            <div class="btns-wrapper">
                <el-button type="primary" class="action-btn" @click="handleFilter">筛选</el-button>
                <el-button class="action-btn" @click="handleFilterReset">重置</el-button>
            </div>
        </div>
    </div>

    <div class="table-container">
        <el-table class="heating-table" :data="paginatedData" border size="small" style="width: 100%;"
            header-cell-class-name="table-header-center">
            <el-table-column prop="upid" label="upid" width="110" align="center" />
            <el-table-column prop="slabid" label="slabid" width="110" align="center" />
            <el-table-column prop="toc" label="toc" min-width="90" align="center" />
            <el-table-column prop="tgthick" label="tgThick" width="70" align="center" />
            <el-table-column prop="thick" label="thick" width="70" align="center" />
            <el-table-column prop="tglength" label="tgLength" width="70" align="center" />
            <el-table-column prop="length" label="length" width="70" align="center" />
            <el-table-column prop="tgwidth" label="tgWidth" width="70" align="center" />
            <el-table-column prop="width" label="width" width="70" align="center" />
            <el-table-column prop="startTime" label="StartTime" min-width="90" align="center" />
            <el-table-column prop="endTime" label="EndTime" min-width="90" align="center" />
            <el-table-column prop="steelspec" label="steelSpec" width="130" align="center" />
            <el-table-column label="sfault" width="60" align="center">
                <template #default="{ row }">
                    <div class="status-circle" :class="getStatusClass(row.slabel)" @click="handleFaultClick(row)"></div>
                </template>
            </el-table-column>
            <el-table-column label="pfault" width="60" align="center">
                <template #default="{ row }">
                    <div class="status-circle" :class="getStatusClass(row.plabel)" @click="handleFaultClick(row)"></div>
                </template>
            </el-table-column>
        </el-table>
    </div>
    <el-config-provider :locale="zhCn">
        <div class="pagination-wrapper">
            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                layout="total, sizes, prev, pager, next, jumper" :page-sizes="[14, 20, 40, 60]"
                :current-page.sync="currentPage" :total="filteredTableData.length" @size-change="handleSizeChange"
                @current-change="handleCurrentChange" />
        </div>
    </el-config-provider>

    <el-dialog v-model="dialogVisible" title="参数详情" width="30%" align-center custom-class="clean-dialog">
        <!-- <div class="section-title">关键参数</div> -->
        <div v-if="currentFaultRow">
            <el-descriptions :column="2" border>
                <el-descriptions-item label="upid" align="center" label-align="center">
                    {{ currentFaultRow.upid }}
                </el-descriptions-item>
                <el-descriptions-item label="slabid" align="center" label-align="center">
                    {{ currentFaultRow.slabid }}
                </el-descriptions-item>
            </el-descriptions>

            <el-descriptions :column="3" border class="merge-top">
                <el-descriptions-item label="thickness" align="center" label-align="center">
                    {{ currentFaultRow.thick }} <span class="unit">mm</span>
                </el-descriptions-item>
                <el-descriptions-item label="width" align="center" label-align="center">
                    {{ currentFaultRow.width }} <span class="unit">m</span>
                </el-descriptions-item>
                <el-descriptions-item label="length" align="center" label-align="center">
                    {{ currentFaultRow.length }} <span class="unit">m</span>
                </el-descriptions-item>
            </el-descriptions>

            <div class="spacer"></div>
        </div>
        <div class="section-title">各项性能检测指标</div>

        <div class="tags-container" v-if="currentFaultRow.p_f_label">
            <div class="tag-row">
                <div v-for="(name, index) in pfaultTypes" :key="index" class="tag-item">
                    <el-tag :type="getTagType(currentFaultRow.p_f_label[index])" effect="light" class="custom-tag">
                        {{ name }}
                    </el-tag>
                </div>
            </div>
            <div class="tag-row">
                <div v-for="(name, index) in sfaultTypes" :key="index" class="tag-item">
                    <el-tag :type="getTagType(currentFaultRow.fqc_label[index])" effect="light" class="custom-tag">
                        {{ name }}
                    </el-tag>
                </div>
            </div>
        </div>

        <template #footer>
            <span class="dialog-footer">
                <el-button type="success" @click="dialogVisible = false">查询详情</el-button>
                <el-button @click="dialogVisible = false">关闭</el-button>
            </span>
        </template>
    </el-dialog>
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
    white-space: nowrap;
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

/* 针对日期选择器的特殊微调，因为它自带宽度 */
:deep(.el-date-editor--daterange.el-input__inner) {
    width: 240px;
}

.button-group {
    margin-left: 80px;
}

.title {
    margin-left: auto;
    padding: 6px 14px;
    font-family: "DIN Alternate", "HarmonyOS Sans SC", "Microsoft YaHei", sans-serif;
    border-radius: 999px;
    background: #eef6ff;
    color: #2563eb;
    font-size: 16px;
    font-weight: 700;
}


.custom-theme {
    /* 滑块的高度（粗细） */
    --el-slider-height: 10px;
    /* 滑块选中部分的颜色 (深蓝色) */
    --el-slider-main-bg-color: #409EFF;
    /* 滑块未选中部分的背景色 (浅灰色) */
    --el-slider-runway-bg-color: #e4e7ed;
    /* 滑块圆球的大小 (如果滑块变粗，球可能也需要变大) */
    --el-slider-button-size: 16px;
    /* 滑块圆球边框颜色 */
    --el-slider-button-wrapper-offset: -10px;
    /* 垂直居中微调，通常不需要动，除非变得特别粗 */
}

.complex-filter-container {
    display: flex;
    /* 左右布局 */
    align-items: flex-start;
    /* 顶部对齐 (或者 center 居中对齐) */
    background: #fff;
    padding: 10px 0;
    border-radius: 4px;
    gap: 30px;
    /* 滑块区和按钮区之间的间距 */
}

/* 左侧网格系统 */
.sliders-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    row-gap: 10px;
    column-gap: 50px;
}

/* 单个滑块块的样式 */
.slider-item {
    display: flex;
    justify-content: center;
    min-width: 0;
}

.slider-label {
    font-size: 14px;
    font-weight: bold;
    color: #606266;
    flex-shrink: 0;
    width: 90px;
    text-align: left;
    align-self: center;
    justify-content: center;
    margin-right: 15px;
    /* 标签和滑块之间的距离 */
}

.slider-wrapper {
    flex: 1;
    /* 让滑块占据剩余宽度 */
    /* 处理 Element Slider 边缘可能被裁切的问题 */
    padding: 0 10px;
    min-width: 0;
}

:deep(.changed-slider) {
    --el-slider-main-bg-color: #e6a23c;
    --el-slider-button-size: 20px;
}

:deep(.changed-slider .el-slider__button) {
    border-color: #e6a23c;
}

:deep(.static-line-slider) {
    /* 让鼠标放上去只显示普通箭头，不显示禁止图标（可选，看你喜好） */
    cursor: default;
}

:deep(.static-line-slider .el-slider__button-wrapper) {
    display: none !important;
}

:deep(.static-line-slider .el-slider__bar) {
    display: none !important;
}

:deep(.static-line-slider .el-slider__runway) {
    cursor: default;
    /* 鼠标样式 */
    background-color: #A8ABB2;
    /* 保持默认灰色，或者你可以加深一点 */
}

:deep(.static-line-slider.is-disabled .el-slider__runway) {
    opacity: 1;
}

/* 右侧按钮区域 */
.actions-panel {
    width: 200px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 0;
    border-left: 1px solid #eee;
    padding-left: 30px;
    padding-right: 0px;
    flex-shrink: 0;
}

.input-row {
    display: flex;
    align-items: center;
    width: 100%;
}

.select-label {
    font-size: 14px;
    font-weight: bold;
    color: #606266;
    flex-shrink: 0;
    align-items: center;
    margin-right: 10px;
}

.btns-wrapper {
    display: flex;

    flex-direction: row;
    /* 横向 */
    gap: 10px;
    /* 两个按钮之间的间距 */
}

.action-btn {
    width: 80px;
    /* 统一按钮宽度 */
    margin-left: 0 !important;
    /* 清除 Element 默认的 margin-left */
}

.pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 10px;
    padding-bottom: 10px;
}

.table-container {
    margin: 10px 0;
}

:deep(.heating-table) {
    font-size: 12px;
}

:deep(.heating-table .el-table__header th) {
    background: #f6f8fa;
    color: black;
    font-weight: 600;
    height: 40px;
}

:deep(.heating-table .el-table__body td) {
    height: 40px;
    padding: 0;
}

:deep(.heating-table .el-table__body tr:hover > td) {
    background: #eef6ff;
}

:deep(.heating-table .el-table__inner-wrapper),
:deep(.heating-table .el-table__cell) {
    border-color: #e6e6e6;
}

.status-circle {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-top: 8px;
    cursor: pointer;
    transition: transform 0.2s;
}

.bg-red {
    background-color: #F56C6C;
    /* 红色 */
    box-shadow: 0 0 4px rgba(245, 108, 108, 0.4);
    /* 稍微加点红色光晕 */
}

.bg-blue {
    background-color: #409EFF;
    /* 蓝色 */
    box-shadow: 0 0 4px rgba(64, 158, 255, 0.4);
}

.bg-gray {
    background-color: #909399;
    /* 灰色 */
    opacity: 0.6;
    /* 灰色可以稍微淡一点 */
}

:deep(.merge-top) {
    .el-descriptions__label {
        color: #606266;
        font-size: 14px;
        background-color: #fafafa;
        font-family: "Microsoft YaHei", sans-serif;
    }

    .el-descriptions__content {
        color: #303133;
        font-size: 14px;
    }
}

/* 分区标题 */
.section-title {
    margin: 15px 0 15px 0;
    font-size: 15px;
    font-weight: bold;
    color: #303133;
    border-left: 4px solid #409EFF;
    /* 左侧蓝色竖条装饰 */
    padding-left: 10px;
}

.tags-container {
    display: flex;
    flex-direction: column;
    /* 两端对齐，均匀分布 */
    gap: 20px;
    background: #f5f7fa;
    /* 浅灰背景衬托 */
    padding: 20px;
    border-radius: 8px;
}

.tag-row {
    display: flex;
    justify-content: space-around; /* 关键：让 5 个 Tag 均匀分布在行内 */
    width: 100%;
}

/* 单个标签块 */
.tag-item {
    display: flex;
    flex-direction: column;
    /* 上下排列：上面文字，下面Tag */
    align-items: center;
    gap: 8px;
}

.custom-tag {
    width: 60px;
    /* 统一定宽 */
    justify-content: center;
}

.unit {
    font-size: 12px;
    color: #909399;
    margin-left: 2px;
}

:deep(.el-descriptions__label) {
    font-weight: bold;
    color: #606266;
    background-color: #fafafa;
    /* 给表头加个淡灰色背景，更像Excel */
}

:deep(.el-descriptions__content) {
    font-weight: 500;
    color: #303133;
}

.custom-tag {
    /* --- 1. 修改 Tag 的外形尺寸 --- */
    width: 80px;
    /* 宽度：之前是60px，改大一点以容纳大字体 */
    height: 36px;
    /* 高度：可以设得更高 */

    /* --- 2. 修改内部文字大小 --- */
    font-size: 16px;
    /* 字体大小：默认大概是12px，这里改大 */
    font-weight: bold;
    /* 字体加粗：让文字更清晰 */

    /* --- 3. 确保文字居中 --- */
    display: flex;
    justify-content: center;
    align-items: center;

    /* (可选) 如果你觉得圆角太小，可以改大圆角 */
    border-radius: 6px;
}
</style>