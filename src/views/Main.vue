<script setup>
import CommonAside from '@/components/CommonAside.vue';
import CommonHeader from '@/components/CommonHeader.vue';
import CommonTag from '@/components/CommonTag.vue';
</script>

<template>
    <div class="common-layout">
        <el-container class="lay-container">
            <common-aside />
            <el-container>
                <el-header class="el-heder">
                    <common-header />
                </el-header>
                <common-tag />
                <el-main class="el-main">
                    <router-view></router-view>
                </el-main>
            </el-container>
        </el-container>
    </div>
</template>

<style scoped lang="less">
    .common-layout,.lay-container{
        height: 100%;
    }
    .el-header{
        background-color: #333;
        border: #e3ebf2;
    }
</style>