<template>
    <div class="top-search-bar">
        <el-form :model="queryParams" inline class="search-form">
            <div class="flex-container">
                <div class="flex-item">
                    <span class="custom-label">UPID</span>
                    <el-input v-model="queryParams.upid" placeholder="输入钢板号" clearable class="custom-input" />
                </div>
                <div class="flex-item">
                    <span class="custom-label">SlabID</span>
                    <el-input v-model="queryParams.slabid" placeholder="输入板坯号" clearable class="custom-input" />
                </div>
                <div class="flex-item button-group">
                    <el-button type="primary" @click="handleQuery" :loading="loading">查询</el-button>
                    <el-button @click="handleReset">重置</el-button>
                </div>
            </div>
        </el-form>
    </div>
    <div class="report-container">
        <table class="info-table top-table">
            <tbody>
                <tr>
                    <td class="label">SlabID</td>
                    <td class="value">{{ detialData.slabId }}</td>
                    <td class="label">UPID</td>
                    <td class="value">{{ detialData.upid }}</td>
                    <td class="label">Thick</td>
                    <td class="value">{{ detialData.thick }}</td>
                </tr>
            </tbody>
        </table>

        <div class="section-title">Furnace Information</div>

        <table class="info-table mid-table">
            <tbody>
                <tr>
                    <td class="label">Heat Mode</td>
                    <td class="value">{{ detialData.heatMode }}</td>
                    <td class="label">Furnace No</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                    <td class="label">Time in Furnace</td>
                    <td class="value">{{ detialData.timeInFurnace }}</td>
                    <td class="value time-range">{{ detialData.startTime }}</td>
                    <td class="value time-range">{{ detialData.endTime }}</td>
                </tr>
            </tbody>
        </table>

        <table class="info-table main-table">
            <thead>
                <tr>
                    <th colspan="2" v-for="(section, index) in detialData.sections" :key="index">
                        {{ section.name }}
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(rowKey, rIndex) in rowKeys" :key="rIndex">
                    <template v-for="(section, sIndex) in detialData.sections" :key="sIndex">
                        <td class="sub-label">{{ rowKey.label }}</td>
                        <td class="sub-value">{{ section.data[rowKey.key] }}</td>
                    </template>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { getHeatingDetial } from '@/api/api.js';
import { ElMessage } from 'element-plus';

const loading = ref(false);

const queryParams = reactive({
    slabid: '',
    upid: '19327316000',
})

const rowKeys = [
    { label: 'Entry Temp', key: 'entryTemp' },
    { label: 'Surface Temp', key: 'surfaceTemp' },
    { label: 'Center Temp', key: 'centerTemp' },
    { label: 'Seat Temp', key: 'seatTemp' },
    { label: 'Average Temp', key: 'avgTemp' },
    { label: 'Time in Section', key: 'timeInSection' },
];

const sectionMapping = [
    { key: 'preheating', name: 'Preheating Section' },
    { key: 'heating1', name: 'Heating Section 1' },
    { key: 'heating2', name: 'Heating Section 2' },
    { key: 'soaking', name: 'Soaking Section' },
    { key: 'discharging', name: 'Discharging' }
];

const initDetialData = () => ({
    slabId: '',
    upid: '',
    thick: '',
    heatMode: '',
    furnaceNo: '',
    timeInFurnace: '',
    startTime: '',
    endTime: '',
    sections: sectionMapping.map(item => ({
        name: item.name,
        data: {} // 初始为空对象
    }))
});

const detialData = reactive(initDetialData());

const handleQuery = async () => {
    if (!queryParams.upid && !queryParams.slabid) {
        ElMessage({
            showClose: true,
            message: '请输入 UPID 或 SlabID',
            type: 'warning'
        })
        return;
    }

    loading.value = true;
    try {
        const res = await getHeatingDetial(queryParams);

        if (res) {
            ElMessage.success('查询成功'); // 简化写法

            // 1. 填充顶部基础信息
            detialData.slabId = res.slabid;
            detialData.upid = res.upid;
            detialData.thick = res.thick;

            // 2. 填充炉子信息 (注意后端返回的大小写，如 HeatMode)
            detialData.heatMode = res.HeatMode;
            detialData.furnaceNo = res.furnaceNo;
            detialData.timeInFurnace = res.duration;

            // 处理时间范围
            if (Array.isArray(res.durationRange) && res.durationRange.length >= 2) {
                detialData.startTime = res.durationRange[0];
                detialData.endTime = res.durationRange[1];
            } else {
                detialData.startTime = '';
                detialData.endTime = '';
            }

            // 3. 【核心修改】填充复杂的表格数据 (Section部分)
            // 遍历我们定义好的 sectionMapping (保持前端显示的列顺序)
            detialData.sections = sectionMapping.map(mappingItem => {
                // 根据 key (如 'preheating') 从后端 res.section 中取出对应的数据对象
                // 使用 || {} 防止后端缺少某个段的数据导致报错
                const backendData = (res.section && res.section[mappingItem.key]) || {};

                return {
                    name: mappingItem.name, // 保持显示的列名不变
                    data: {
                        // 左边是前端 rowKeys 需要的键，右边是后端返回的键
                        entryTemp: backendData.entry,       // 对应 Entry Temp
                        surfaceTemp: backendData.surface,   // 对应 Surface Temp
                        centerTemp: backendData.center,     // 对应 Center Temp
                        seatTemp: backendData.seat,         // 对应 Seat Temp
                        avgTemp: backendData.average,       // 对应 Average Temp
                        timeInSection: backendData.duration // 对应 Time in Section
                    }
                };
            });
        }
    } catch (error) {
        console.error('查询异常:', error);
        ElMessage.error('请求数据失败');
    } finally {
        loading.value = false;
    }
}

const handleReset = () => {
    queryParams.slabid = '';
    queryParams.upid = '';
    Object.assign(detialData, initDetialData()); // 重置表格数据
    ElMessage.info('已重置');
}
</script>

<style scoped>
.top-search-bar {
    background: #fff;
    padding: 10px 0;
    border-bottom: #DCDCDC 1px solid;
}

.flex-container {
    display: flex;
    align-items: center;
    justify-content: start;
    flex-wrap: nowrap;
    gap: 30px;
    width: 100%;
    overflow-x: auto;
}

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

.button-group {
    margin-left: 80px;
}

.report-container {
    width: 100%;
    /* 核心字体栈：优先使用系统现代字体，看起来清晰干净 */
    font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
    font-size: 14px;
    color: #303133;
    background: #fff;
    margin: 20px 0;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    overflow: hidden;
    /* 圆角溢出隐藏 */
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* =========== 分割标题 =========== */
.section-title {
    text-align: left;
    font-weight: 700;
    color: #409eff;
    /* Element Plus 主题蓝 */
    font-size: 16px;
    padding: 12px 20px;
    background-color: #f0f9eb;
    /* 极淡的绿色或蓝色背景 */
    border-top: 1px solid #dcdfe6;
    border-bottom: 1px solid #dcdfe6;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
}

/* 加一个小竖条装饰 */
.section-title::before {
    content: "";
    display: inline-block;
    width: 4px;
    height: 16px;
    background: #409eff;
    margin-right: 10px;
    border-radius: 2px;
}

/* =========== 表格通用样式 =========== */
.info-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
}

.info-table td,
.info-table th {
    border: 1px solid #ebeef5;
    /* 柔和的边框色 */
    padding: 12px 10px;
    transition: background-color 0.3s;
}

/* 鼠标悬停行效果 */
.info-table tbody tr:hover td {
    background-color: #f5f7fa;
}

/* =========== 单元格特定样式 =========== */

/* 标签列 (Label) */
.label,
.sub-label {
    background-color: #fafafa;
    /* 极淡灰背景，区分内容 */
    color: #606266;
    font-weight: 600;
    font-size: 13px;
}

/* 数值列 (Value) */
.value,
.sub-value {
    color: #303133;
    font-style: normal;
    /* 去掉斜体 */
    font-weight: 500;
    /* 如果是纯数字，用等宽字体更好对齐 */
    font-feature-settings: "tnum";
}

/* 顶部表格 */
.top-table td {
    width: 16.66%;
    text-align: center;
}

/* 中间表格 */
.mid-table .label {
    width: 10%;
}

.mid-table .value {
    width: 15%;
}

.main-table thead th {
    background-color: #eef1f6;
    color: #303133;
    font-weight: bold;
    padding: 15px 0;
    font-size: 15px;
    border-bottom: 2px solid #dcdfe6;
}

.sub-label {
    text-align: right;
    padding-right: 15px;
    color: #909399;
    width: 40%;
    border-right: none;
}

.sub-value {
    text-align: left;
    padding-left: 15px;
    font-family: Consolas, Menlo, Monaco, "Courier New", monospace;
    font-size: 14px;
    width: 60%;
    border-left: 1px dashed #ebeef5;
}

.sub-value:empty::before {
    content: "-";
    color: #c0c4cc;
}
</style>