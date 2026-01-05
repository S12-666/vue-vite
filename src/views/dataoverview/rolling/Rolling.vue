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

    <div class="roll-charts">
        <div class="short-charts">
            <div class="ft-chart">
                <ForceTorqueCurve :curve-data="ftData" />
            </div>
            <div class="thick-chart">
                <WidthThickCurve :curve-data="wtData" />
            </div>
        </div>
        <div class="length-chart">
            <ThickCurve :curve-data="ThickData" />
        </div>
    </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { getRollingDetial } from '@/api/api.js';
import { ElMessage } from 'element-plus';
import ForceTorqueCurve from './ForceTorqueCurve.vue';
import ThickCurve from './ThickCurve.vue';
import WidthThickCurve from './WidthThickCurve.vue';

const loading = ref(false);

const queryParams = reactive({
    slabid: '',
    upid: '19327316000',
});

const initDetialData = () => ({
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
    rsCode: '',
    adCode: '',
    heatMode: '',
    dischargeTemp: '',
    restartTemp: '',
    finishTemp: '',
    restartThick: '',
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
    rmTwDia: '',
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

const ftData = ref({
    Passes: [],
    Epsilon: [],
    ForcePost: [],
    ForceMeas: [],
    TorquePost: [],
    TorqueMeas: []
})

const wtData = ref({
    Passes: [],
    Width: [],
    Thickness: []
})

const ThickData = ref({
    position: [],
    centerthickness: [],
    leftthickness: [],
    rightthickness: [],
    tgtplatethickness2: null, 
    maxplatethickness2: null, 
    minplatethickness2: null
})

const detialData = reactive(initDetialData());

const handleQuery = async () => {
    if (!queryParams.upid && !queryParams.slabid) {
        ElMessage.warning('请输入 UPID 或 SlabID');
        return;
    }

    loading.value = true;
    try {
        const res = await getRollingDetial(queryParams);

        if (res) {
            ElMessage({
                showClose: true,
                message: '查询成功',
                type: 'success'
            })

            // --- 1. Top Table ---
            detialData.slabId = res.tabledata.slabid;
            detialData.upid = res.tabledata.upid;
            detialData.thick = res.tabledata.slabthickness; // 假设显示的Thick是板坯厚度

            // --- 2. PID Data ---
            detialData.slabThickness = res.tabledata.slabthickness;
            detialData.slabWidth = res.tabledata.slabwidth;
            detialData.slabLength = res.tabledata.slablength;
            detialData.steelSpec = res.tabledata.steelspec;
            detialData.tappingCode = res.tabledata.tapping_code;
            detialData.category = res.tabledata.productcategory;

            detialData.plateThickness = res.tabledata.tgtplatethickness2;
            detialData.plateWidth = res.tabledata.tgtwidth;
            detialData.plateLength = res.tabledata.tgtplatelength2;
            detialData.controlRoll = res.tabledata.crcode;
            detialData.rsCode = ''; // 需确认对应字段
            detialData.adCode = res.tabledata.adcontrolcode;

            detialData.heatMode = res.tabledata.heating_pattern_code;
            detialData.dischargeTemp = res.tabledata.ave_temp_dis;
            detialData.restartTemp = res.tabledata.tgttmrestarttemp1;
            detialData.finishTemp = res.tabledata.tgttmplatetemp;

            // --- 3. Control Rolling ---
            detialData.furnaceNo = `${res.tabledata.fce_no} / ${res.tabledata.fce_row}`; // 拼一下炉号和排号
            detialData.timeInFurnace = res.tabledata.in_fce_time;
            detialData.timeIn2Heat = res.tabledata.staying_time_2;
            detialData.timeInSoak = res.tabledata.staying_time_soak;
            detialData.dischargeTS = res.tabledata.discharge_time;

            detialData.soakingSurfT = res.tabledata.sur_temp_entry_soak;
            // DischargeT 复用上面的 dischargeTemp?
            detialData.slabWeight = res.tabledata.slabweight;

            detialData.thickStdCe = res.tabledata.thick_std_ce;
            detialData.thickAveDs = res.tabledata.thick_ave_ds;
            detialData.thickAveOs = res.tabledata.thick_ave_os;
            detialData.thickMaxCe = res.tabledata.thick_max_ce;
            detialData.thickMinCe = res.tabledata.thick_min_ce;
            detialData.thickAveCe = res.tabledata.thick_ave_ce;

            // --- 4. Roll Status (根据 JSON 字段匹配) ---
            detialData.rmTwId = res.tabledata.topwridrm;
            detialData.rmTwPlates = res.tabledata.topwrplatecountrm;
            detialData.rmBwId = res.tabledata.botwridrm;
            detialData.rmBwPlates = res.tabledata.botwrplatecountrm;

            detialData.fmTwId = res.tabledata.topwridfm;
            detialData.fmTwPlates = res.tabledata.topwrplatecountfm;
            detialData.fmBwId = res.tabledata.botwridfm;
            detialData.fmBwPlates = res.tabledata.botwrplatecountfm;
        }

        if (res.force_torque_curve) {
            ftData.value.Passes = res.force_torque_curve.Passes || [];
            ftData.value.Epsilon = res.force_torque_curve.Epsilon || [];
            ftData.value.ForcePost = res.force_torque_curve.ForcePost || [];
            ftData.value.ForceMeas = res.force_torque_curve.ForceMeas || [];
            ftData.value.TorquePost = res.force_torque_curve.TorquePost || [];
            ftData.value.TorqueMeas = res.force_torque_curve.TorqueMeas || [];
        } else {
            ftData.value = {
                Passes: [],
                Epsilon: [],
                ForcePost: [],
                ForceMeas: [],
                TorquePost: [],
                TorqueMeas: []
            };
        }

        if (res.width_thick_curve) {
            wtData.value.Passes = res.width_thick_curve.Passes || [];
            wtData.value.Width = res.width_thick_curve.Width || [];
            wtData.value.Thickness = res.width_thick_curve.Thickness || [];
        } else {
            wtData.value = {
                Passes: [],
                Width: [],
                Thickness: []
            };

        }

        if (res.thickness_curve) {
            ThickData.value.position = res.thickness_curve.position || [];
            ThickData.value.centerthickness = res.thickness_curve.centerthickness || [];
            ThickData.value.leftthickness =  res.thickness_curve.leftthickness || [];
            ThickData.value.rightthickness = res.thickness_curve.rightthickness || [];
            ThickData.value.tgtplatethickness2 = res.thickness_curve.tgtplatethickness2 || null;
            ThickData.value.maxplatethickness2 = res.thickness_curve.maxplatethickness2 || null;
            ThickData.value.minplatethickness2 = res.thickness_curve.minplatethickness2 || null;
        } else {
            ThickData.value = {
                position: [],
                centerthickness: [],
                leftthickness: [],
                rightthickness: [],
                tgtplatethickness2: null,
                maxplatethickness2: null,
                minplatethickness2: null
            };
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
    font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
    font-size: 14px;
    color: #303133;
    background: #fff;
    margin: 10px 0 20px 0;
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

.roll-charts {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
}

.short-charts {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    width: 100%;
    height: 400px;
}

.ft-chart,
.thick-chart {
    flex: 1;
    width: 0;
    height: 100%;
}

.length-chart {
    width: 100%;
    height: 400px;
}
</style>