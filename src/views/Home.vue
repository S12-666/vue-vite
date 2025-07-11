<script setup>
import { ref, getCurrentInstance, onMounted} from 'vue';

const {proxy} = getCurrentInstance()
const tableData = ref([])

const tableLabel = ref({
    name: "课程",
    todayBuy: "今日购买",
    monthBuy: "本月购买",
    totalBuy: "总购买",
})
const getImageUrl = (user) => {
    return new URL(`../assets/images/${user}.png`, import.meta.url).href
} 
const getTableData = async () => {
    const data = await proxy.$api.getTableData()
    console.log(data);
    tableData.value = data.tableData
}
onMounted(() => {
    getTableData()
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
                    <el-table-column
                    v-for="(key, val) in tableLabel"
                    :prop="val"
                    :key="val"
                    :label="key">

                    </el-table-column>
                </el-table>
            </el-card>
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
    .user-table{
        margin-top: 20px;
    }
}
</style>