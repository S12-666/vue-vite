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
                    <el-button type="info" plain @click="handleBack" :disabled="!isFromJump">返回</el-button>
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

        <div class="section-title">Measure</div>

        <table class="info-table mid-table">
            <tbody>
                <tr>
                    <td class="label">TargetThick</td>
                    <td class="value">{{ detialData.TargetThick }}</td>
                    <td class="label">TargetWidth</td>
                    <td class="value">{{ detialData.TargetWidth }}</td>
                    <td class="label">TargetLength</td>
                    <td class="value">{{ detialData.TargetLength }}</td>
                    <td class="label">AvgCamber</td>
                    <td class="value">{{ detialData.AvgCamber }}</td>
                    <td class="label">MinCamber</td>
                    <td class="value">{{ detialData.MinCamber }}</td>
                    <td class="label">MaxCamber</td>
                    <td class="value">{{ detialData.MaxCamber }}</td>
                </tr>
                <tr>
                    <td class="label">Thick</td>
                    <td class="value">{{ detialData.Thick }}</td>
                    <td class="label">Width</td>
                    <td class="value">{{ detialData.Width }}</td>
                    <td class="label">Length</td>
                    <td class="value">{{ detialData.Length }}</td>
                    <td class="value"></td>
                    <td class="value"></td>
                    <td class="value"></td>
                    <td class="value"></td>
                    <td class="value"></td>
                    <td class="value"></td>
                </tr>
            </tbody>
        </table>

        <div class="section-title">Shape Fault</div>

        <table class="info-table mid-table">
            <colgroup>
                <col>
                <col style="width: 20%;">
                <col style="width: 20%;">
                <col style="width: 20%;">
                <col style="width: 20%;">
                <col style="width: 20%;">
            </colgroup>
            <tbody>
                <tr>
                    <td class="label">Type</td>
                    <td class="label">Bend</td>
                    <td class="label">AbnormalThickness</td>
                    <td class="label">HorizonWave</td>
                    <td class="label">LeftWave</td>
                    <td class="label">RightWave</td>
                </tr>
                <tr>
                    <td class="label">Label</td>
                    <td class="value">{{ detialData.Bend }}</td>
                    <td class="value">{{ detialData.AbnormalThickness }}</td>
                    <td class="value">{{ detialData.HorizonWave }}</td>
                    <td class="value">{{ detialData.LeftWave }}</td>
                    <td class="value">{{ detialData.RightWave }}</td>
                </tr>
            </tbody>
        </table>

        <div class="section-title">Performance Fault</div>

        <table class="info-table mid-table">
            <colgroup>
                <col>
                <col style="width: 20%;">
                <col style="width: 20%;">
                <col style="width: 20%;">
                <col style="width: 20%;">
                <col style="width: 20%;">
            </colgroup>
            <tbody>
                <tr>
                    <td class="label">Type</td>
                    <td class="label">Pa</td>
                    <td class="label">Pf</td>
                    <td class="label">Pn</td>
                    <td class="label">Ps</td>
                    <td class="label">Gs</td>
                </tr>
                <!-- <tr>
                    <td class="label">Value</td>
                    <td class="value">{{ detialData.FHeadTop }}</td>
                    <td class="value">{{ detialData.LHeadTop }}</td>
                    <td class="value">{{ detialData.FTailTop }}</td>
                    <td class="value">{{ detialData.LTailTop }}</td>
                    <td class="value">{{ detialData.FHeadBtm }}</td>
                </tr> -->
                <tr>
                    <td class="label">Label</td>
                    <td class="value">{{ detialData.Pa }}</td>
                    <td class="value">{{ detialData.Pf }}</td>
                    <td class="value">{{ detialData.Pn }}</td>
                    <td class="value">{{ detialData.Ps }}</td>
                    <td class="value">{{ detialData.Gs }}</td>
                </tr>
            </tbody>
        </table>

    </div>
</template>

<script setup>
import { reactive, ref, onMounted, onActivated } from 'vue';
import { getFQCDetial } from '@/api/api.js';
import { ElMessage } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';

const loading = ref(false);
const route = useRoute();
const router = useRouter();

const isFromJump = ref(false);
const sourcePath = ref('');

const queryParams = reactive({
    slabid: '',
    upid: '19327316000',
})


const initDetialData = () => ({
    PlateID: '',
    slabID: '',
    Date: '',
    TargetThick: '',
    TargetWidth: '',
    TargetLength: '',
    AvgCamber: '',
    MinCamber: '',
    MaxCamber: '',
    Thick: '',
    Width: '',
    Length: '',
    Bend: '',
    AbnormalThickness: '',
    HorizonWave: '',
    LeftWave: '',
    RightWave: '',
    Pa: '',
    Pf: '',
    Pn: '',
    Ps: '',
    Gs: ''
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
        const res = await getFQCDetial(queryParams);
        if (res) {
            ElMessage.success('查询成功'); // 简化写法
            detialData.slabID = res.slabid;
            detialData.PlateID = res.upid;
            detialData.Date = res.toc;
            detialData.Thick = res.thick;
            detialData.Width = res.width;
            detialData.Length = res.length;
            detialData.TargetThick = res.tgtthick;
            detialData.TargetWidth = res.tgtwidth;
            detialData.TargetLength = res.tgtlength;
            detialData.Bend = res.slabel.bend;
            detialData.AbnormalThickness = res.slabel.abnormalThickness;
            detialData.HorizonWave = res.slabel.horizonWave;
            detialData.LeftWave = res.slabel.leftWave;
            detialData.RightWave = res.slabel.rightWave;
            detialData.Pa = res.plabel.pa;
            detialData.Pf = res.plabel.pf;
            detialData.Pn = res.plabel.pn;
            detialData.Ps = res.plabel.ps;
            detialData.Gs = res.plabel.gs;
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

const handleBack = () => {
    if (isFromJump.value) {
        const backTo = sourcePath.value || '/specification';
        router.push(backTo);
    }
}

const initPageData = () => {
    const urlUpid = route.query.upid;
    const fromPath = route.query.from;
    if (urlUpid) {
        isFromJump.value = true;
        if (fromPath) {
            sourcePath.value = fromPath;
        }
        queryParams.upid = urlUpid;
        queryParams.slabid = '';
        handleQuery();
    } else {
        isFromJump.value = false;
        sourcePath.value = '';
    }
}

onMounted(() => {
    // initPageData();
})

onActivated(() => {
    initPageData();
});
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
    margin-top: -1px;
}

.info-table td,
.info-table th {
    border: 1px solid #919191;
    padding: 5px 10px;
    transition: background-color 0.3s;
}

.info-table td.label,
.info-table th.label {
    overflow-wrap: anywhere;
}

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