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

        <div class="section-title">PID Data</div>

        <table class="info-table mid-table">
            <tbody>
                <tr>
                    <td class="label">SlabThick</td>
                    <td class="value">{{ detialData.slabThickness }}</td>
                    <td class="label">SlabWidth</td>
                    <td class="value">{{ detialData.slabWidth }}</td>
                    <td class="label">SlabLength</td>
                    <td class="value">{{ detialData.slabLength }}</td>
                    <td class="label">SteelSpec</td>
                    <td class="value">{{ detialData.steelSpec }}</td>
                    <td class="label">TappingCode</td>
                    <td class="value">{{ detialData.tappingCode }}</td>
                    <td class="label">Category</td>
                    <td class="value">{{ detialData.category }}</td>
                </tr>
                <tr>
                    <td class="label">PlateThick</td>
                    <td class="value">{{ detialData.plateThickness }}</td>
                    <td class="label">PlateWidth</td>
                    <td class="value">{{ detialData.plateWidth }}</td>
                    <td class="label">PlateLength</td>
                    <td class="value">{{ detialData.plateLength }}</td>
                    <td class="label">ControllRoll</td>
                    <td class="value">{{ detialData.controlRoll }}</td>
                    <td class="label">RS Code</td>
                    <td class="value">{{ detialData.rsCode }}</td>
                    <td class="label">AD Code</td>
                    <td class="value">{{ detialData.adCode }}</td>
                </tr>
                <tr>
                    <td class="label">HeatMode</td>
                    <td class="value">{{ detialData.heatMode }}</td>
                    <td class="label">DischargeTemp</td>
                    <td class="value">{{ detialData.dischargeTemp }}</td>
                    <td class="label">RestartTemp</td>
                    <td class="value">{{ detialData.restartTemp }}</td>
                    <td class="label">FinishTemp</td>
                    <td class="value">{{ detialData.finishTemp }}</td>
                    <td class="label">RestartThick</td>
                    <td class="value">{{ detialData.restartThick }}</td>
                    <td class="label"></td>
                    <td class="value"></td>
                </tr>
            </tbody>
        </table>

        <div class="section-title">Control Rolling</div>

        <table class="info-table mid-table">
            <colgroup>
                <col style="width: 10%;">
                <col style="width: 15%;">
                <col style="width: 10%;">
                <col style="width: 15%;">
                <col style="width: 10%;">
                <col style="width: 15%;">
                <col style="width: 10%;">
                <col style="width: 15%;">
                <col style="width: 10%;">
                <col style="width: 15%;">
                <col style="width: 10%;">
                <col style="width: 15%;">
            </colgroup>
            <tbody>
                <tr>
                    <td class="label">FurnaceN/R</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                    <td class="label">TimeInFurnace</td>
                    <td class="value">{{ detialData.timeInFurnace }}</td>
                    <td class="label">TimeIn2Heat</td>
                    <td class="value">{{ detialData.timeIn2Heat }}</td>
                    <td class="label">TimeInSoak</td>
                    <td class="value">{{ detialData.timeInSoak }}</td>
                    <td class="label">DischargeTS</td>
                    <td class="value" colspan="3">{{ detialData.dischargeTS }}</td>
                </tr>
                <tr>
                    <td class="label">SoakingSurfT</td>
                    <td class="value">{{ detialData.soakingSurfT }}</td>
                    <td class="label">DischargeT</td>
                    <td class="value">{{ detialData.dischargeTemp }}</td>
                    <td class="label">RestartTemp</td>
                    <td class="value">{{ detialData.restartTemp }}</td>
                    <td class="label">FinishTemp</td>
                    <td class="value">{{ detialData.finishTemp }}</td>
                    <td class="label">RestartThick</td>
                    <td class="value">{{ detialData.restartThick }}</td>
                    <td class="label">SlabWeight</td>
                    <td class="value">{{ detialData.slabWeight }}</td>
                </tr>
                <tr>
                    <td class="label">Thick[μ,CE]</td>
                    <td class="value">{{ detialData.thickAveCe }}</td>
                    <td class="label">Thick[μ,DS]</td>
                    <td class="value">{{ detialData.thickAveDs }}</td>
                    <td class="label">Thick[μ,OS]</td>
                    <td class="value">{{ detialData.thickAveOs }}</td>
                    <td class="label">Thick[Max,CE]</td>
                    <td class="value">{{ detialData.thickMaxCe }}</td>
                    <td class="label">Thick[Min,CE]</td>
                    <td class="value">{{ detialData.thickMinCe }}</td>
                    <td class="label">Thick[σ,CE]</td>
                    <td class="value">{{ detialData.thickStdCe }}</td>
                </tr>
            </tbody>
        </table>

        <div class="section-title">Roll Status</div>

        <table class="info-table mid-table">
            <colgroup>
                <col style="width: 10%;">
                <col style="width: 15%;">
                <col style="width: 10%;">
                <col style="width: 15%;">
                <col style="width: 10%;">
                <col style="width: 15%;">
                <col style="width: 10%;">
                <col style="width: 15%;">
                <col style="width: 10%;">
                <col style="width: 15%;">
                <col style="width: 10%;">
                <col style="width: 15%;">
            </colgroup>
            <tbody>
                <tr>
                    <td class="label">RM TW ID</td>
                    <td class="value">{{ detialData.rmTwId }}</td>
                    <td class="label">RM TW Dia</td>
                    <td class="value">{{ detialData.rmTwDia }}</td>
                    <td class="label">RM TW Plates</td>
                    <td class="value">{{ detialData.rmTwPlates }}</td>
                    <td class="label">RM BW ID</td>
                    <td class="value">{{ detialData.rmBwId }}</td>
                    <td class="label">RM BW Dia</td>
                    <td class="value">{{ detialData.rmBwDia }}</td>
                    <td class="label">RM BW Plates</td>
                    <td class="value">{{ detialData.rmBwPlates }}</td>
                </tr>
                <tr>
                    <td class="label">FM TW ID</td>
                    <td class="value">{{ detialData.fmTwId }}</td>
                    <td class="label">FM TW Dia</td>
                    <td class="value">{{ detialData.fmTwDia }}</td>
                    <td class="label">FM TW Plates</td>
                    <td class="value">{{ detialData.fmTwPlates }}</td>
                    <td class="label">FM BW ID</td>
                    <td class="value">{{ detialData.fmBwId }}</td>
                    <td class="label">FM BW Dia</td>
                    <td class="value">{{ detialData.fmBwDia }}</td>
                    <td class="label">FM BW Plates</td>
                    <td class="value">{{ detialData.fmBwPlates }}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- <div class="heat-charts">
        <div class="temp-chart">
            <TempCurve :curve-data="chartData" />
        </div>
        <div class="time-chart">
            <TimeCurve :curve-data="chartData" />
        </div>
    </div> -->
</template>

<script setup>
import { reactive, ref } from 'vue';
import { getRollingDetial } from '@/api/api.js';
import { ElMessage } from 'element-plus';


const loading = ref(false);


const chartData = ref({
    position: [],
    time: [],
    seg_u: [],
    seg_d: [],
    plate: []
});

const queryParams = reactive({
    slabid: '',
    upid: '19327316000',
});

// 初始化数据结构，字段名对应 HTML 中的绑定
const initDetialData = () => ({
    // 顶部基础信息
    slabId: '',
    upid: '',
    thick: '',

    // PID Data
    slabThickness: '',
    slabWidth: '',
    slabLength: '',
    steelSpec: '',
    tappingCode: '',
    category: '',
    plateThickness: '',
    plateWidth: '',
    plateLength: '',
    controlRoll: '',
    rsCode: '', // JSON中未找到直接对应，暂留空或映射 crcode
    adCode: '',
    heatMode: '',
    dischargeTemp: '',
    restartTemp: '',
    finishTemp: '',
    restartThick: '', // JSON中需确认字段，暂留空

    // Control Rolling
    furnaceNo: '',
    timeInFurnace: '',
    timeIn2Heat: '',
    timeInSoak: '',
    dischargeTS: '',
    soakingSurfT: '',
    slabWeight: '',

    // Thickness Stats
    thickStdCe: '',
    thickAveDs: '',
    thickAveOs: '',
    thickMaxCe: '',
    thickMinCe: '',
    thickAveCe: '',

    // Roll Status
    rmTwId: '',
    rmTwDia: '', // JSON无直径数据，暂留空
    rmTwPlates: '',
    rmBwId: '',
    rmBwDia: '',
    rmBwPlates: '',
    fmTwId: '',
    fmTwDia: '',
    fmTwPlates: '',
    fmBwId: '',
    fmBwDia: '',
    fmBwPlates: ''
});

const detialData = reactive(initDetialData());

const handleQuery = async () => {
    if (!queryParams.upid && !queryParams.slabid) {
        ElMessage.warning('请输入 UPID 或 SlabID');
        return;
    }

    loading.value = true;
    try {
        // 模拟请求，实际请使用 await getRollingDetial(queryParams);
        // 这里假设 res 就是你提供的 data 对象
        const res = await getRollingDetial(queryParams);

        if (res) {
            ElMessage.success('查询成功');

            // --- 1. Top Table ---
            detialData.slabId = res.slabid;
            detialData.upid = res.upid;
            detialData.thick = res.slabthickness; // 假设显示的Thick是板坯厚度

            // --- 2. PID Data ---
            detialData.slabThickness = res.slabthickness;
            detialData.slabWidth = res.slabwidth;
            detialData.slabLength = res.slablength;
            detialData.steelSpec = res.steelspec;
            detialData.tappingCode = res.tapping_code;
            detialData.category = res.productcategory;

            detialData.plateThickness = res.tgtplatethickness2;
            detialData.plateWidth = res.tgtwidth;
            detialData.plateLength = res.tgtplatelength2;
            detialData.controlRoll = res.crcode;
            detialData.rsCode = ''; // 需确认对应字段
            detialData.adCode = res.adcontrolcode;

            detialData.heatMode = res.heating_pattern_code;
            detialData.dischargeTemp = res.ave_temp_dis;
            detialData.restartTemp = res.tgttmrestarttemp1;
            detialData.finishTemp = res.tgttmplatetemp;
            // detialData.restartThick = ???; 

            // --- 3. Control Rolling ---
            detialData.furnaceNo = `${res.fce_no} / ${res.fce_row}`; // 拼一下炉号和排号
            detialData.timeInFurnace = res.in_fce_time;
            detialData.timeIn2Heat = res.staying_time_2;
            detialData.timeInSoak = res.staying_time_soak;
            detialData.dischargeTS = res.discharge_time;

            detialData.soakingSurfT = res.sur_temp_entry_soak;
            // DischargeT 复用上面的 dischargeTemp?
            detialData.slabWeight = res.slabweight;

            detialData.thickStdCe = res.thick_std_ce;
            detialData.thickAveDs = res.thick_ave_ds;
            detialData.thickAveOs = res.thick_ave_os;
            detialData.thickMaxCe = res.thick_max_ce;
            detialData.thickMinCe = res.thick_min_ce;
            detialData.thickAveCe = res.thick_ave_ce;

            // --- 4. Roll Status (根据 JSON 字段匹配) ---
            detialData.rmTwId = res.topwridrm;
            detialData.rmTwPlates = res.topwrplatecountrm;
            detialData.rmBwId = res.botwridrm;
            detialData.rmBwPlates = res.botwrplatecountrm;

            detialData.fmTwId = res.topwridfm;
            detialData.fmTwPlates = res.topwrplatecountfm;
            detialData.fmBwId = res.botwridfm;
            detialData.fmBwPlates = res.botwrplatecountfm;
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
    ElMessage({
        showClose: true,
        message: '已重置',
        type: 'info'
    })
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
    color: #606266;
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
    margin: 10px 0 20px 0;
    /* border: 1px solid #919191; */
    /* border-radius: 4px; */
    overflow: hidden;
}

/* =========== 分割标题 =========== */
.section-title {
    text-align: center;
    font-weight: 700;
    color: #000;
    font-size: 14px;
    padding: 5px 0px;
    background-color: #ebeef5;
    /* letter-spacing: 1px; */
    border: 1px solid #919191;
    margin-top: -1px;
    position: relative;
    z-index: 1;
}

.info-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    /* border-style: hidden; */
    margin-top: -1px;
}

.info-table td,
.info-table th {
    border: 1px solid #919191;
    padding: 5px 2px;
    transition: background-color 0.3s;
}

/* 鼠标悬停行效果 */
.info-table tbody tr:hover td {
    background-color: #f5f7fa;
}

/* =========== 单元格特定样式 =========== */
.label,
.sub-label {
    background-color: #fafafa;
    color: #000;
    font-weight: 600;
    font-size: 13px;
}

.value,
.sub-value {
    color: #000;
    font-style: normal;
    font-weight: 500;
    font-feature-settings: "tnum";
}

.value:empty::before {
    content: "\00a0";
    display: inline-block;
}

.top-table {
    margin-top: 0;
}

.top-table td {
    width: 16.66%;
    text-align: center;
}

.mid-table {
    width: 100%;
    table-layout: fixed;
    /* 强制固定布局，不随内容变宽 */
    border-collapse: collapse;
}

.mid-table .label {
    width: 10%;
    text-align: center;
}

.mid-table .value {
    width: 15%;
    text-align: center;
}

.main-table thead th {
    background-color: #eef1f6;
    color: #000;
    font-weight: bold;
    padding: 5px 0;
    font-size: 15px;
    /* border-bottom: 2px solid #dcdfe6; */
}

.sub-label {
    text-align: center;
    padding-right: 15px;
    color: #000;
    width: 40%;
    /* border-right: none; */
}

.sub-value {
    text-align: center;
    padding-left: 15px;
    font-family: Consolas, Menlo, Monaco, "Courier New", monospace;
    font-size: 14px;
    width: 60%;
    /* border-left: 1px dashed #ebeef5; */
}

.sub-value:empty::before {
    content: "-";
    color: #c0c4cc;
}

.heat-charts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    width: 100%;
    height: 400px;
}

.temp-chart,
.time-chart {
    width: 100%;
    height: 100%;
    overflow: hidden;
}
</style>