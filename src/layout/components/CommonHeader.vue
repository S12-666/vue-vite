<template>
    <div class="header">
        <div class="l-content"></div>
        <!-- <div class="l-content">
            <el-button @click="handleCollapse">
                <Menu class="icons" />
            </el-button>
            <el-breadcrumb class="bread">
                <el-breadcrumb-item :to="{ path: '/' }">Visual</el-breadcrumb-item>
                <el-breadcrumb-item v-if="current" :to="current.path">{{ current.label }}</el-breadcrumb-item>
                <el-breadcrumb-item v-if="current" :to="current.path">
                    {{ current.label }}
                </el-breadcrumb-item>
            </el-breadcrumb>
        </div> -->
        <div class="title-content">
            厚板性能监控与异常诊断系统
        </div>
        <div class="r-content">
            <el-dropdown>
                <span>
                    <img :src="getUrl('user')" class="user" />
                </span>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item>User Center</el-dropdown-item>
                        <el-dropdown-item @click="handelLogout">Log Out</el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAllDataStore } from '@/stores';
import { useRoute, useRouter } from 'vue-router'
const getUrl = (user) => {
    // 文件位于 `src/assets/images`，当前文件在 `src/layout/components`，
    // 相对路径应为 ../../assets/images
    return new URL(`../../assets/images/${user}.png`, import.meta.url).href
}
const store = useAllDataStore();
const router = useRouter()
// const handleCollapse = () => {
//     store.state.isCollapse = !store.state.isCollapse
// }
const handelLogout = () => {
    store.clean();
    router.push('login');
};

const current = computed(() => store.state.currentMenu);

</script>

<style lang="less" scoped>
.header {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
    width: 100%;
    // background-color: red;
}

.title-content {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-size: 22px;
    font-weight: bold;
    color: #333;
}


.icons {
    width: 18px;
    height: 18px;
}

.l-content {
    display: flex;
    align-items: center;

    .el-button {
        margin-right: 20px;
    }
}

.r-content {
    .user {
        width: 48px;
        height: 48px;
        border-radius: 20%;
    }
}

:deep(.bread span) {
    color: black !important;
    cursor: pointer !important;
}
</style>