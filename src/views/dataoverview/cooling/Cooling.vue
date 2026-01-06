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
                    <td class="value">{{ detialData.slabId }}</td>
                    <td class="label">SlabID</td>
                    <td class="value">{{ detialData.upid }}</td>
                    <td class="label">Date</td>
                    <td class="value">{{ detialData.thick }}</td>
                </tr>
            </tbody>
        </table>

        <div class="section-title">Cool Information</div>

        <table class="info-table mid-table">
            <tbody>
                <tr>
                    <td class="label">Thickness</td>
                    <td class="value">{{ detialData.heatMode }}</td>
                    <td class="label">Width</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                    <td class="label">Length</td>
                    <td class="value">{{ detialData.timeInFurnace }}</td>
                    <td class="label">FinishTemp</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                    <td class="label">FiniTempOrig</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                    <td class="label">CoolStopOrig</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                </tr>
                <tr>
                    <td class="label">CoolStop</td>
                    <td class="value" colspan="3">{{ detialData.heatMode }}</td>
                    <td class="label">TargetRate</td>
                    <td class="value" colspan="3">{{ detialData.furnaceNo }}</td>
                    <td class="label">AccMode</td>
                    <td class="value">{{ detialData.timeInFurnace }}</td>
                    <td class="label">OpMode</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                </tr>
                <tr>
                    <td class="label">MaterialID</td>
                    <td class="value">{{ detialData.heatMode }}</td>
                    <td class="label">[B]</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                    <td class="label">[C]</td>
                    <td class="value">{{ detialData.timeInFurnace }}</td>
                    <td class="label">[Cr]</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                    <td class="label">[Cu]</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                    <td class="label">[Mn]</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                </tr>
                <tr>
                    <td class="label">[Mo]</td>
                    <td class="value">{{ detialData.heatMode }}</td>
                    <td class="label">[Nb]</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                    <td class="label">[Ni]</td>
                    <td class="value">{{ detialData.timeInFurnace }}</td>
                    <td class="label">[Si]</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                    <td class="label">[Ti]</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                    <td class="label">[V]</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
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
                    <td class="value">757</td>
                    <td class="value">757</td>
                    <td class="value">757</td>
                    <td class="value">757</td>
                    <td class="value">360</td>
                    <td class="value">360</td>
                    <td class="value">360</td>
                    <td class="value">0</td>
                    <td class="value">0</td>
                    <td class="value">0</td>
                    <td class="value">0</td>
                    <td class="value">0</td>
                    <td class="value">0</td>
                    <td class="value">0</td>
                    <td class="value">0</td>
                    <td class="value">0</td>
                    <td class="value">0</td>
                    <td class="value">0</td>
                    <td class="value">0</td>
                </tr>
                <tr>
                    <td class="label">Spec B</td>
                    <td class="value">l/m2mm</td>
                    <td class="value">1439</td>
                    <td class="value">1439</td>
                    <td class="value">1439</td>
                    <td class="value">1439</td>
                    <td class="value">757</td>
                    <td class="value">757</td>
                    <td class="value">0</td>
                    <td class="value">0</td>
                    <td class="value">0</td>
                    <td class="value">0</td>
                    <td class="value">0</td>
                    <td class="value">0</td>
                    <td class="value">0</td>
                    <td class="value">0</td>
                    <td class="value">0</td>
                    <td class="value">0</td>
                    <td class="value">0</td>
                    <td class="value">0</td>
                    <td class="value">0</td>
                </tr>
                <tr>
                    <td class="label">Edge</td>
                    <td class="value">mm</td>
                    <td class="value">1400</td>
                    <td class="value">1400</td>
                    <td class="value">1120.21</td>
                    <td class="value">1400</td>
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
            <tbody>
                <tr>
                    <td class="label">P2Mean</td>
                    <td class="value">{{ detialData.heatMode }}</td>
                    <td class="label">P2Max</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                    <td class="label">P2Min</td>
                    <td class="value">{{ detialData.timeInFurnace }}</td>
                    <td class="label">P2Std</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                    <td class="label">P5Mean</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                    <td class="label">P5Max</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                    <td class="label">P5Min</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                    <td class="label">P5Std</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                </tr>
                <tr>
                    <td class="label">FHeadTop</td>
                    <td class="value">{{ detialData.heatMode }}</td>
                    <td class="label">LHeadTop</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                    <td class="label">FTailTop</td>
                    <td class="value">{{ detialData.timeInFurnace }}</td>
                    <td class="label">LTailTop</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                    <td class="label">FHeadBtm</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                    <td class="label">LHeadBtm</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                    <td class="label">FTailBtm</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                    <td class="label">LTailBtm</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                </tr>
                <tr>
                    <td class="label">DQ Water</td>
                    <td class="value">{{ detialData.heatMode }}</td>
                    <td class="label">ACC Water</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                    <td class="label">Air Temp</td>
                    <td class="value">{{ detialData.timeInFurnace }}</td>
                    <td class="label">CRcal</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
                    <td class="label">CRact</td>
                    <td class="value">{{ detialData.furnaceNo }}</td>
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
                    <td class="value">2021-01-04 12:17:30</td>
                    <td class="label">tf_last</td>
                    <td class="value">746.531</td>
                    <td class="label">tr_fm</td>
                    <td class="value">1.094</td>
                    <td class="label">ts_last</td>
                    <td class="value">465.42</td>
                    <td class="label">vx_last</td>
                    <td class="value">1.351</td>
                    <td class="label">lx_last</td>
                    <td class="value">11.2</td>
                    <td class="label">tw_last</td>
                    <td class="value">11.377</td>
                </tr>
                <tr>
                    <td class="label">Tap Code</td>
                    <td class="value" colspan="2">JU6P24P6</td>
                    <td class="label">Plates</td>
                    <td class="value" colspan="2">243</td>
                    <td class="label">1st Plate</td>
                    <td class="value" colspan="2">41384235622</td>
                    <td class="label">2nd Plate</td>
                    <td class="value" colspan="2">41384330222</td>
                    <td class="label">3rd Plate</td>
                    <td class="value" colspan="2">41384335112</td>
                </tr>
            </tbody>
        </table>

    </div>

    <div class="heat-charts">
        <!-- <div class="temp-chart">
            <TempCurve :curve-data="chartData" />
        </div>
        <div class="time-chart">
            <TimeCurve :curve-data="chartData" />
        </div> -->
    </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { getHeatingDetial } from '@/api/api.js';
import { ElMessage } from 'element-plus';
// import TimeCurve from './TimeCurve.vue';
// import TempCurve from './TempCurve.vue';

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

            detialData.sections = sectionMapping.map(mappingItem => {
                const backendData = (res.section && res.section[mappingItem.key]) || {};

                return {
                    name: mappingItem.name,
                    data: {
                        entryTemp: backendData.entry,
                        surfaceTemp: backendData.surface,
                        centerTemp: backendData.center,
                        seatTemp: backendData.seat,
                        avgTemp: backendData.average,
                        timeInSection: backendData.duration
                    }
                };
            });

            if (res.furnace) {
                chartData.value = {
                    position: res.furnace.position || [],
                    time: res.furnace.time || [],
                    seg_d: res.furnace.seg_d || [],
                    seg_u: res.furnace.seg_u || [],
                    plate: res.furnace.plate || []
                };
            } else {
                chartData.value = { position: [], time: [], seg_d: [], seg_u: [], plate: [] }
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