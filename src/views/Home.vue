<script setup>
import { ref, getCurrentInstance, onMounted, reactive } from 'vue';
const echarts = getCurrentInstance().proxy.$echarts
const { proxy } = getCurrentInstance()
const tableData = ref([])
const countData = ref([])
const observer = ref(null)
const tableLabel = ref({
    name: "课程",
    todayBuy: "今日购买",
    monthBuy: "本月购买",
    totalBuy: "总购买",
})
const xOptions = reactive({
    // 图例文字颜色
    textStyle: {
        color: "#333",
    },
    legend: {},
    grid: {
        left: "20%",
    },
    // 提示框
    tooltip: {
        trigger: "axis",
    },
    xAxis: {
        type: "category", // 类目轴
        data: [],
        axisLine: {
            lineStyle: {
                color: "#17b3a3",
            },
        },
        axisLabel: {
            interval: 0,
            color: "#333",
        },
    },
    yAxis: [
        {
            type: "value",
            axisLine: {
                lineStyle: {
                    color: "#17b3a3",
                },
            },
        },
    ],
    color: ["#2ec7c9", "#b6a2de", "#5ab1ef", "#ffb980", "#d87a80", "#8d98b3"],
    series: [],
})

const pieOptions = reactive({
    tooltip: {
        trigger: "item",
    },
    legend: {},
    color: [
        "#0f78f4",
        "#dd536b",
        "#9462e5",
        "#a6a6a6",
        "#e1bb22",
        "#39c362",
        "#3ed1cf",
    ],
    series: []
})
const getImageUrl = (user) => {
    return new URL(`../assets/images/${user}.png`, import.meta.url).href
}
const getTableData = async () => {
    const data = await proxy.$api.getTableData()
    // console.log(data);
    tableData.value = data.tableData
}
const getCountData = async () => {
    const data = await proxy.$api.getCountData()
    // console.log(data);
    countData.value = data
}
const getChartData = async () => {
    const {orderData, userData, videoData} = await proxy.$api.getChartData();
    xOptions.xAxis.data = orderData.date;
    xOptions.series = Object.keys(orderData.data[0]).map(val => {
        return {
            name: val,
            data: orderData.data.map(item => item[val]),
            type: 'line'
        }
    });
    const OneEcharts = echarts.init(proxy.$refs["echart"]);
    OneEcharts.setOption(xOptions);

    // 渲染第二个表格
    xOptions.xAxis.data = userData.date;
    xOptions.series = [
        {
            name: '新增对象',
            data: userData.map(item => item.new),
            type: 'bar',
        },
        {
            name: '活跃用户',
            data: userData.map(item => item.active),
            type: 'bar',
        }
    ];
    const twoChart = echarts.init(proxy.$refs["userchart"]);
    twoChart.setOption(xOptions);

    // 饼状图
    pieOptions.series = [
        {
            data: videoData,
            type: 'pie'
        },
    ];
    const threeChart = echarts.init(proxy.$refs["videochart"])
    threeChart.setOption(pieOptions)

    // 监听
    observer.value = new ResizeObserver((en) => {
        OneEcharts.resize();
        twoChart.resize();
        threeChart.resize();
    });
    if(proxy.$refs['echart']){
        observer.value.observe(proxy.$refs['echart'])
    }
}
onMounted(() => {
    getTableData();
    getCountData();
    getChartData();
})
</script>

<template>
    <el-row class="home" :gutter="20">
        <el-col :span="8" style="margin-top: 20px;">
            <el-card shadow="hover">
                <div class="user">
                    <img :src="getImageUrl('user')">
                    <div class="user-info">
                        <p class="user-info-admin">Admin</p>
                        <p class="user-info-p">super admin</p>
                    </div>
                </div>
                <div class="login-info">
                    <p>登陆时间:<span>2024-06-30</span></p>
                    <p>登陆地点:<span>Los Angles</span></p>
                </div>
            </el-card>
            <el-card shadow="hover" class="user-table">
                <el-table stripe :data="tableData">
                    <el-table-column v-for="(key, val) in tableLabel" :prop="val" :key="val" :label="key">
                    </el-table-column>
                </el-table>
            </el-card>
        </el-col>
        <el-col :span="16" style="margin-top: 20px;">
            <div class="num">
                <el-card shadow="hover" :body-style="{ display: 'flex', padding: 0 }" v-for="item in countData"
                    :key="item.name">
                    <component :is="item.icon" class="icons" :style="{ background: item.color }"></component>
                    <div class="detial">
                        <p class="num">￥{{ item.value }}</p>
                        <p class="txt">{{ item.name }}</p>
                    </div>
                </el-card>
            </div>
            <el-card shadow="hover" class="top-echart">
                <div ref="echart" style="height: 280px;"></div>
            </el-card>
            <div class="graph">
                <el-card shadow="hover">
                    <div ref="userchart" style="height: 240px;"></div>
                </el-card>
                <el-card shadow="hover">
                    <div ref="videochart" style="height: 240px;"></div>
                </el-card>
            </div>
        </el-col>
    </el-row>
</template>

<style scoped lang="less">
.home {
    overflow: hidden;
    height: 100%;

    .user {
        display: flex;
        align-items: center;
        border-bottom: 1px solid #ccc;
        margin-bottom: 20px;

        img {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            margin-right: 40px;
            margin-bottom: 20px;
        }

        .user-info {
            p {
                line-height: 40px;
            }

            .user-info-admin {
                font-size: 40px;
            }

            .user-info-p {
                color: #999;
                font-size: 25px;
            }
        }
    }

    .login-info {
        p {
            line-height: 30px;
            font-size: 14px;
            color: #999;

            span {
                color: #666;
                margin-left: 60px;
            }
        }
    }

    .user-table {
        margin-top: 20px;
    }

    .num {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;

        // align-items: center;
        .el-card {
            width: 32%;
            margin-bottom: 20px;
        }

        .icons {
            width: 80px;
            height: 80px;
            font-size: 30px;
            text-align: center;
            line-height: 80px;
            color: black
        }

        .detial {
            margin-left: 16px;
            display: flex;
            flex-direction: column;
            justify-content: center;

            .num {
                font-size: 30px;
                margin-bottom: 10px;
            }

            .txt {
                font-size: 15px;
                text-align: center;
                color: #999;
            }
        }
    }
    .graph {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
        .el-card {
            width: 48%;
            height: 260px;
        }
    }
}
</style>