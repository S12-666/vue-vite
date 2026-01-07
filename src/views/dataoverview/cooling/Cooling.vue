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
                    <td class="label">PlateID</td>
                    <td class="value">{{ detialData.PlateID }}</td>
                    <td class="label">SlabID</td>
                    <td class="value">{{ detialData.slabID }}</td>
                    <td class="label">Date</td>
                    <td class="value">{{ detialData.Date }}</td>
                </tr>
            </tbody>
        </table>

        <div class="section-title">Cool Information</div>

        <table class="info-table mid-table">
            <tbody>
                <tr>
                    <td class="label">Thickness</td>
                    <td class="value">{{ detialData.Thickness }}</td>
                    <td class="label">Width</td>
                    <td class="value">{{ detialData.Width }}</td>
                    <td class="label">Length</td>
                    <td class="value">{{ detialData.Length }}</td>
                    <td class="label">FinishTemp</td>
                    <td class="value">{{ detialData.FinishTemp }}</td>
                    <td class="label">FiniTempOrig</td>
                    <td class="value">{{ detialData.FiniTempOrig }}</td>
                    <td class="label">CoolStopOrig</td>
                    <td class="value">{{ detialData.CoolStopOrig }}</td>
                </tr>
                <tr>
                    <td class="label">CoolStop</td>
                    <td class="value" colspan="3">{{ detialData.CoolStop1 }}(temp1), {{ detialData.CoolStop2 }}(temp2)</td>
                    <td class="label">TargetRate</td>
                    <td class="value" colspan="3">{{ detialData.TargetRate1 }}(rate1), {{ detialData.TargetRate2 }}(rate2)</td>
                    <td class="label">AccMode</td>
                    <td class="value">{{ detialData.AccMode }}</td>
                    <td class="label">OpMode</td>
                    <td class="value">{{ detialData.OpMode }}</td>
                </tr>
                <tr>
                    <td class="label">MaterialID</td>
                    <td class="value">{{ detialData.MaterialID }}</td>
                    <td class="label">[B]</td>
                    <td class="value">{{ detialData.B }}</td>
                    <td class="label">[C]</td>
                    <td class="value">{{ detialData.C }}</td>
                    <td class="label">[Cr]</td>
                    <td class="value">{{ detialData.Cr }}</td>
                    <td class="label">[Cu]</td>
                    <td class="value">{{ detialData.Cu }}</td>
                    <td class="label">[Mn]</td>
                    <td class="value">{{ detialData.Mn }}</td>
                </tr>
                <tr>
                    <td class="label">[Mo]</td>
                    <td class="value">{{ detialData.Mo }}</td>
                    <td class="label">[Nb]</td>
                    <td class="value">{{ detialData.Nb }}</td>
                    <td class="label">[Ni]</td>
                    <td class="value">{{ detialData.Ni }}</td>
                    <td class="label">[Si]</td>
                    <td class="value">{{ detialData.Si }}</td>
                    <td class="label">[Ti]</td>
                    <td class="value">{{ detialData.Ti }}</td>
                    <td class="label">[V]</td>
                    <td class="value">{{ detialData.V }}</td>
                </tr>
            </tbody>
        </table>

        <div class="section-title">Preset and Meas</div>

        <table class="info-table mid-table">
            <colgroup>
                <col style="width: 10%;">
                <col style="width: 10%;">
            </colgroup>
            <tbody>
                <tr>
                    <td class="label" colspan="2">No.</td>
                    <td class="label">1</td>
                    <td class="label">2</td>
                    <td class="label">3</td>
                    <td class="label">4</td>
                    <td class="label">5</td>
                    <td class="label">6</td>
                    <td class="label">7</td>
                    <td class="label">8</td>
                    <td class="label">9</td>
                    <td class="label">10</td>
                    <td class="label">11</td>
                    <td class="label">12</td>
                    <td class="label">13</td>
                    <td class="label">14</td>
                    <td class="label">15</td>
                    <td class="label">16</td>
                    <td class="label">17</td>
                    <td class="label">18</td>
                    <td class="label">19</td>
                </tr>
                <tr>
                    <td class="label">Spec T</td>
                    <td class="value">l/m2mm</td>
                    <td class="value">{{ detialData.vc_b_01 }}</td>
                    <td class="value">{{ detialData.vc_b_02 }}</td>
                    <td class="value">{{ detialData.vc_b_03 }}</td>
                    <td class="value">{{ detialData.vc_b_04 }}</td>
                    <td class="value">{{ detialData.vc_b_05 }}</td>
                    <td class="value">{{ detialData.vc_b_06 }}</td>
                    <td class="value">{{ detialData.vc_b_07 }}</td>
                    <td class="value">{{ detialData.vc_b_08 }}</td>
                    <td class="value">{{ detialData.vc_b_09 }}</td>
                    <td class="value">{{ detialData.vc_b_10 }}</td>
                    <td class="value">{{ detialData.vc_b_11 }}</td>
                    <td class="value">{{ detialData.vc_b_12 }}</td>
                    <td class="value">{{ detialData.vc_b_13 }}</td>
                    <td class="value">{{ detialData.vc_b_14 }}</td>
                    <td class="value">{{ detialData.vc_b_15 }}</td>
                    <td class="value">{{ detialData.vc_b_16 }}</td>
                    <td class="value">{{ detialData.vc_b_17 }}</td>
                    <td class="value">{{ detialData.vc_b_18 }}</td>
                    <td class="value">{{ detialData.vc_b_19 }}</td>
                </tr>
                <tr>
                    <td class="label">Spec B</td>
                    <td class="value">l/m2mm</td>
                    <td class="value">{{ detialData.vc_b_01 }}</td>
                    <td class="value">{{ detialData.vc_b_02 }}</td>
                    <td class="value">{{ detialData.vc_b_03 }}</td>
                    <td class="value">{{ detialData.vc_b_04 }}</td>
                    <td class="value">{{ detialData.vc_b_05 }}</td>
                    <td class="value">{{ detialData.vc_b_06 }}</td>
                    <td class="value">{{ detialData.vc_b_07 }}</td>
                    <td class="value">{{ detialData.vc_b_08 }}</td>
                    <td class="value">{{ detialData.vc_b_09 }}</td>
                    <td class="value">{{ detialData.vc_b_10 }}</td>
                    <td class="value">{{ detialData.vc_b_11 }}</td>
                    <td class="value">{{ detialData.vc_b_12 }}</td>
                    <td class="value">{{ detialData.vc_b_13 }}</td>
                    <td class="value">{{ detialData.vc_b_14 }}</td>
                    <td class="value">{{ detialData.vc_b_15 }}</td>
                    <td class="value">{{ detialData.vc_b_16 }}</td>
                    <td class="value">{{ detialData.vc_b_17 }}</td>
                    <td class="value">{{ detialData.vc_b_18 }}</td>
                    <td class="value">{{ detialData.vc_b_19 }}</td>
                </tr>
                <tr>
                    <td class="label">Edge</td>
                    <td class="value">mm</td>
                    <td class="value">{{ detialData.em_pos_abs_1 }}</td>
                    <td class="value">{{ detialData.em_pos_abs_2 }}</td>
                    <td class="value">{{ detialData.em_pos_abs_3 }}</td>
                    <td class="value">{{ detialData.em_pos_abs_4 }}</td>
                    <td class="value"></td>
                    <td class="value"></td>
                    <td class="value"></td>
                    <td class="value"></td>
                    <td class="value"></td>
                    <td class="value"></td>
                    <td class="value"></td>
                    <td class="value"></td>
                    <td class="value"></td>
                    <td class="value"></td>
                    <td class="value"></td>
                    <td class="value"></td>
                    <td class="value"></td>
                    <td class="value"></td>
                    <td class="value"></td>
                </tr>
            </tbody>
        </table>

        <div class="section-title">Cool Effect</div>

        <table class="info-table mid-table">
            <colgroup>
                <col style="width: 10%;">
                <col style="width: 10%;">
                <col style="width: 12%;">
            </colgroup>
            <tbody>
                <tr>
                    <td class="label">P2Mean</td>
                    <td class="value">{{ detialData.P2Mean }}</td>
                    <td class="label">P2Max</td>
                    <td class="value">{{ detialData.P2Max }}</td>
                    <td class="label">P2Min</td>
                    <td class="value">{{ detialData.P2Min }}</td>
                    <td class="label">P2Std</td>
                    <td class="value">{{ detialData.P2Std }}</td>
                    <td class="label">P5Mean</td>
                    <td class="value">{{ detialData.P5Mean }}</td>
                    <td class="label">P5Max</td>
                    <td class="value">{{ detialData.P5Max }}</td>
                    <td class="label">P5Min</td>
                    <td class="value">{{ detialData.P5Min }}</td>
                    <td class="label">P5Std</td>
                    <td class="value">{{ detialData.P5Std }}</td>
                </tr>
                <tr>
                    <td class="label">FHeadTop</td>
                    <td class="value">{{ detialData.FHeadTop }}</td>
                    <td class="label">LHeadTop</td>
                    <td class="value">{{ detialData.LHeadTop }}</td>
                    <td class="label">FTailTop</td>
                    <td class="value">{{ detialData.FTailTop }}</td>
                    <td class="label">LTailTop</td>
                    <td class="value">{{ detialData.LTailTop }}</td>
                    <td class="label">FHeadBtm</td>
                    <td class="value">{{ detialData.FHeadBtm }}</td>
                    <td class="label">LHeadBtm</td>
                    <td class="value">{{ detialData.LHeadBtm }}</td>
                    <td class="label">FTailBtm</td>
                    <td class="value">{{ detialData.FTailBtm }}</td>
                    <td class="label">LTailBtm</td>
                    <td class="value">{{ detialData.LTailBtm }}</td>
                </tr>
                <tr>
                    <td class="label">DQ Water</td>
                    <td class="value">{{ detialData.DQWater }}</td>
                    <td class="label">ACC Water</td>
                    <td class="value">{{ detialData.ACCWater }}</td>
                    <td class="label">Air Temp</td>
                    <td class="value">{{ detialData.AirTemp }}</td>
                    <td class="label">CRcal</td>
                    <td class="value">{{ detialData.CRcal }}</td>
                    <td class="label">CRact</td>
                    <td class="value">{{ detialData.CRact }}</td>
                    <td class="value"></td>
                    <td class="value"></td>
                    <td class="value"></td>
                    <td class="value"></td>
                    <td class="value"></td>
                    <td class="value"></td>
                </tr>
            </tbody>

        </table>

        <div class="section-title">Adaptive Parameters</div>

        <table class="info-table mid-table">
            <colgroup>
                <col style="width: 8%;">
                <col style="width: 8%;">
                <col style="width: 20%;">
            </colgroup>
            <tbody>
                <tr>
                    <td class="label">PRE</td>
                    <td class="label">Date</td>
                    <td class="value">{{ detialData.Date }}</td>
                    <td class="label">tf_last</td>
                    <td class="value">{{ detialData.tf_last }}</td>
                    <td class="label">tr_fm</td>
                    <td class="value">{{ detialData.tr_fm }}</td>
                    <td class="label">ts_last</td>
                    <td class="value">{{ detialData.ts_last }}</td>
                    <td class="label">vx_last</td>
                    <td class="value">{{ detialData.vx_last }}</td>
                    <td class="label">lx_last</td>
                    <td class="value">{{ detialData.lx_last }}</td>
                    <td class="label">tw_last</td>
                    <td class="value">{{ detialData.tw_last }}</td>
                </tr>
                <tr>
                    <td class="label">Tap Code</td>
                    <td class="value" colspan="2">{{ detialData.TapCode }}</td>
                    <td class="label">Plates</td>
                    <td class="value" colspan="2">{{ detialData.Plates }}</td>
                    <td class="label">1st Plate</td>
                    <td class="value" colspan="2">{{ detialData.FirstPlate }}</td>
                    <td class="label">2nd Plate</td>
                    <td class="value" colspan="2">{{ detialData.SecondPlate }}</td>
                    <td class="label">3rd Plate</td>
                    <td class="value" colspan="2">{{ detialData.ThirdPlate }}</td>
                </tr>
            </tbody>
        </table>

    </div>

    <div class="cool-charts">
        <div class="temp-chart">
            <ScannerCurve :scanner-data="chartData.scanner" />
        </div>
        <div class="temp-chart">
            <TempCurve :curve-data="chartData" />
        </div>
    </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { getCoolingDetial } from '@/api/api.js';
import { ElMessage } from 'element-plus';
import TempCurve from './TempCurve.vue';
import ScannerCurve from './ScannerCurve.vue';

const loading = ref(false);


const chartData = ref({
    temp: [],
    scanner: []
});
console.log(chartData);


const queryParams = reactive({
    slabid: '',
    upid: '19327316000',
})


const initDetialData = () => ({
    PlateID: '',
    slabID: '',
    Date: '',
    Thickness: '',
    Width: '',
    Length: '',
    FinishTemp: '',
    FiniTempOrig: '',
    CoolStopOrig: '',
    CoolStop1: '',
    CoolStop2: '',
    TargetRate1: '',
    TargetRate2: '',
    AccMode: '',
    OpMode: '',
    MaterialID: '',
    B: '',
    C: '',
    Cr: '',
    Cu: '',
    Mn: '',
    Mo: '',
    Nb: '',
    Ni: '',
    Si: '',
    Ti: '',
    V: '',
    vc_t_01: '',
    vc_t_02: '',
    vc_t_03: '',
    vc_t_04: '',
    vc_t_05: '',
    vc_t_06: '',
    vc_t_07: '',
    vc_t_08: '',
    vc_t_09: '',
    vc_t_10: '',
    vc_t_11: '',
    vc_t_12: '',
    vc_t_13: '',
    vc_t_14: '',
    vc_t_15: '',
    vc_t_16: '',
    vc_t_17: '',
    vc_t_18: '',
    vc_t_19: '',
    vc_b_01: '',
    vc_b_02: '',
    vc_b_03: '',
    vc_b_04: '',
    vc_b_05: '',
    vc_b_06: '',
    vc_b_07: '',
    vc_b_08: '',
    vc_b_09: '',
    vc_b_10: '',
    vc_b_11: '',
    vc_b_12: '',
    vc_b_13: '',
    vc_b_14: '',
    vc_b_15: '',
    vc_b_16: '',
    vc_b_17: '',
    vc_b_18: '',
    vc_b_19: '',
    em_pos_abs_1: '',
    em_pos_abs_2: '',
    em_pos_abs_3: '',
    em_pos_abs_4: '',
    P2Mean: '',
    P2Max: '',
    P2Min: '',
    P2Std: '',
    P5Mean: '',
    P5Max: '',
    P5Min: '',
    P5Std: '',
    FHeadTop: '',
    LHeadTop: '',
    FTailTop: '',
    LTailTop: '',
    FHeadBtm: '',
    LHeadBtm: '',
    FTailBtm: '',
    LTailBtm: '',
    DQWater: '',
    ACCWater: '',
    AirTemp: '',
    CRcal: '',
    CRact: '',
    tf_last: '',
    tr_fm: '',
    ts_last: '',
    vx_last: '',
    lx_last: '',
    tw_last: '',
    TapCode: '',
    Plates: '',
    FirstPlate: '',
    SecondPlate: '',
    ThirdPlate: ''
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
        const res = await getCoolingDetial(queryParams);

        if (res) {
            ElMessage.success('查询成功'); // 简化写法

            detialData.slabID = res.table_data.slabid;
            detialData.PlateID = res.table_data.upid;
            detialData.Date = res.table_data.toc;
            detialData.Thickness = res.table_data.thick;
            detialData.Width = res.table_data.width;
            detialData.Length = res.table_data.length;
            detialData.FinishTemp = res.table_data.rolling_finish_temp;
            detialData.FiniTempOrig = res.table_data.cooling_start_temp;
            detialData.CoolStopOrig = res.table_data.cooling_stop_temp;
            detialData.CoolStop1 = res.table_data.cooling_stop_temp1;
            detialData.CoolStop2 = res.table_data.cooling_stop_temp2;
            detialData.TargetRate1 = res.table_data.cooling_rate1;
            detialData.TargetRate2 = res.table_data.cooling_rate2;
            detialData.AccMode = res.table_data.cooling_mode;
            detialData.OpMode = res.table_data.operate_mode;
            detialData.MaterialID = res.table_data.material;
            detialData.B = res.table_data.chemistry_b;
            detialData.C = res.table_data.chemistry_c;
            detialData.Cr = res.table_data.chemistry_cr;
            detialData.Cu = res.table_data.chemistry_cu;
            detialData.Mn = res.table_data.chemistry_mn;
            detialData.Mo = res.table_data.chemistry_mo;
            detialData.Nb = res.table_data.chemistry_nb;
            detialData.Ni = res.table_data.chemistry_ni;
            detialData.Si = res.table_data.chemistry_si;
            detialData.Ti = res.table_data.chemistry_ti;
            detialData.V = res.table_data.chemistry_v;

            detialData.vc_t_01 = res.table_data.vc_flow_top_01;
            detialData.vc_t_02 = res.table_data.vc_flow_top_02;
            detialData.vc_t_03 = res.table_data.vc_flow_top_03;
            detialData.vc_t_04 = res.table_data.vc_flow_top_04;
            detialData.vc_t_05 = res.table_data.vc_flow_top_05;
            detialData.vc_t_06 = res.table_data.vc_flow_top_06;
            detialData.vc_t_07 = res.table_data.vc_flow_top_07;
            detialData.vc_t_08 = res.table_data.vc_flow_top_08;
            detialData.vc_t_09 = res.table_data.vc_flow_top_09;
            detialData.vc_t_10 = res.table_data.vc_flow_top_10;
            detialData.vc_t_11 = res.table_data.vc_flow_top_11;
            detialData.vc_t_12 = res.table_data.vc_flow_top_12;
            detialData.vc_t_13 = res.table_data.vc_flow_top_13;
            detialData.vc_t_14 = res.table_data.vc_flow_top_14;
            detialData.vc_t_15 = res.table_data.vc_flow_top_15;
            detialData.vc_t_16 = res.table_data.vc_flow_top_16;
            detialData.vc_t_17 = res.table_data.vc_flow_top_17;
            detialData.vc_t_18 = res.table_data.vc_flow_top_18;
            detialData.vc_t_19 = res.table_data.vc_flow_top_19;
            detialData.vc_b_01 = res.table_data.vc_flow_bot_01;
            detialData.vc_b_02 = res.table_data.vc_flow_bot_02;
            detialData.vc_b_03 = res.table_data.vc_flow_bot_03;
            detialData.vc_b_04 = res.table_data.vc_flow_bot_04;
            detialData.vc_b_05 = res.table_data.vc_flow_bot_05;
            detialData.vc_b_06 = res.table_data.vc_flow_bot_06;
            detialData.vc_b_07 = res.table_data.vc_flow_bot_07;
            detialData.vc_b_08 = res.table_data.vc_flow_bot_08;
            detialData.vc_b_09 = res.table_data.vc_flow_bot_09;
            detialData.vc_b_10 = res.table_data.vc_flow_bot_10;
            detialData.vc_b_11 = res.table_data.vc_flow_bot_11;
            detialData.vc_b_12 = res.table_data.vc_flow_bot_12;
            detialData.vc_b_13 = res.table_data.vc_flow_bot_13;
            detialData.vc_b_14 = res.table_data.vc_flow_bot_14;
            detialData.vc_b_15 = res.table_data.vc_flow_bot_15;
            detialData.vc_b_16 = res.table_data.vc_flow_bot_16;
            detialData.vc_b_17 = res.table_data.vc_flow_bot_17;
            detialData.vc_b_18 = res.table_data.vc_flow_bot_18;
            detialData.vc_b_19 = res.table_data.vc_flow_bot_19;

            detialData.em_pos_abs_1 = res.table_data.em_pos_abs_1;
            detialData.em_pos_abs_2 = res.table_data.em_pos_abs_2;
            detialData.em_pos_abs_3 = res.table_data.em_pos_abs_3;
            detialData.em_pos_abs_4 = res.table_data.em_pos_abs_4;

            detialData.P2Mean = res.table_data.avg_p2;
            detialData.P2Max = res.table_data.max_p2;
            detialData.P2Min = res.table_data.min_p2;
            detialData.P2Std = res.table_data.std_p2;
            detialData.P5Mean = res.table_data.avg_p5;
            detialData.P5Max = res.table_data.max_p5;
            detialData.P5Min = res.table_data.min_p5;
            detialData.P5Std = res.table_data.std_p5;
            detialData.FHeadTop = res.table_data.mk_factor_head_top;
            detialData.LHeadTop = res.table_data.mk_length_head_top;
            detialData.FTailTop = res.table_data.mk_factor_tail_top;
            detialData.LTailTop = res.table_data.mk_length_tail_top;
            detialData.FHeadBtm = res.table_data.mk_factor_head_btm;
            detialData.LHeadBtm = res.table_data.mk_length_head_btm;
            detialData.FTailBtm = res.table_data.mk_factor_tail_btm;
            detialData.LTailBtm = res.table_data.mk_length_tail_btm;
            detialData.DQWater = res.table_data.dq_water_temp;
            detialData.ACCWater = res.table_data.acc_water_temp;
            detialData.AirTemp = res.table_data.air_temp;
            detialData.CRcal = res.table_data.avg_cr_cal;
            detialData.CRact = res.table_data.avg_cr_act;

            detialData.tf_last = res.table_data.last_rolling_finish_temp;
            detialData.tr_fm = res.table_data.speed_ratio;
            detialData.ts_last = res.table_data.last_cooling_stop_temp;
            detialData.vx_last = res.table_data.last_plate_speed;
            detialData.lx_last = res.table_data.last_cooling_zone_length;
            detialData.tw_last = res.table_data.last_water_temp;
            detialData.TapCode = res.table_data.tapping_code;
            detialData.Plates = res.table_data.plate_count;
            detialData.FirstPlate = res.table_data.plate_before_1;
            detialData.SecondPlate = res.table_data.plate_before_2;
            detialData.ThirdPlate = res.table_data.plate_before_3;

            if (res.scanner_data) {
                chartData.value.scanner = res.scanner_data.scanner;
                chartData.value.temp = res.scanner_data.temp;
            } else {
                chartData.value.scanner = [];
                chartData.value.temp = [];
            }
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
    padding: 5px 10px;
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

.cool-charts {
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