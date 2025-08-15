<script setup>
import CommonAside from '@/components/CommonAside.vue';
import CommonHeader from '@/components/CommonHeader.vue';
import CommonTag from '@/components/CommonTag.vue';
</script>

<!-- <template>
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
</style> -->

<template>
    <div class="common-layout">
        <el-container class="lay-container">
            <!-- 侧边栏固定 -->
            <common-aside class="aside-fixed" />
            <el-container>
                <!-- 顶部固定 -->
                <el-header class="el-header-fixed">
                    <common-header />
                </el-header>

                <!-- 滚动区域 -->
                <div class="main-scroll">
                    <common-tag />
                    <el-main class="el-main">
                        <router-view></router-view>
                    </el-main>
                </div>
            </el-container>
        </el-container>
    </div>
</template>

<style scoped lang="less">
.common-layout,
.lay-container {
    height: 100vh; /* 全屏高度 */
    overflow: hidden; /* 防止页面整体滚动 */
}

/* 侧边栏固定 */
.aside-fixed {
    height: 100vh;
    position: sticky;
    top: 0;
}

/* 顶部固定 */
.el-header-fixed {
    height: 60px;
    background-color: #333;
    position: sticky;
    top: 0;
    z-index: 10;
}

/* 中间滚动区域 */
.main-scroll {
    height: calc(100vh - 60px); /* 除去header高度 */
    overflow-y: auto; /* 垂直滚动 */
    background: #f5f5f5;
}

.el-main {
    padding: 20px;
}
</style>