<script setup>
import CommonAside from '@/layout/components/CommonAside.vue';
import CommonHeader from '@/layout/components/CommonHeader.vue';
import CommonTag from '@/layout/components/CommonTag.vue';
import CommonFooter from '@/layout/components/CommonFooter.vue';
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
            <common-aside class="aside-fixed" />
            <el-container>
                <el-header class="el-header-fixed">
                    <common-header />
                </el-header>

                <div class="main-scroll">
                    <el-main class="el-main">
                        <router-view v-slot="{ Component }">
                            <keep-alive>
                                <component :is="Component" />
                            </keep-alive>
                        </router-view>
                    </el-main>
                </div>

                <el-footer class="footer-fixed">
                    <common-footer />
                </el-footer>
            </el-container>
        </el-container>
    </div>
</template>

<style scoped lang="less">
.common-layout,
.lay-container {
    height: 100vh;
    /* 全屏高度 */
    width: 100%;
    overflow: hidden;
    /* 防止页面整体滚动 */
}

/* 侧边栏固定 */
.aside-fixed {
    height: 100vh;
    position: sticky;
    top: 0;
    border-right: 1px solid #E5E6EB;
}

/* 顶部固定 */
.el-header-fixed {
    height: 60px;
    width: 100%;
    background-color: white;
    position: sticky;
    top: 0;
    z-index: 10;
    border-bottom: 1px solid #E5E6EB;
}

/* 中间滚动区域 */
.main-scroll {
    height: calc(100vh - 60px - 30px);
    /* 除去header和footer高度 */
    overflow-y: auto;
    /* 垂直滚动 */
    background: white;
    scrollbar-gutter: stable;
    // scroll-behavior: smooth;
}

.footer-fixed {
    width: 100%;
    height: 30px;
    background: white;
    border-top: 1px solid #E5E6EB;
}

.el-main {
    padding: 20px;
    background: white;
    min-height: calc(100vh - 150px);
}
</style>