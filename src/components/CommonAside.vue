<template>
    <el-aside :width="width">
        <!-- <h3>Default colors</h3> -->
        <el-menu :collapse="isCollapse" :collapse-transition="false">
            <h3 v-show="!isCollapse">System Management</h3>
            <h3 v-show="isCollapse">Manage</h3>
            <el-menu-item v-for="item in noChildren" :index="item.path" :key="item.path">
                <component class="icons" :is="item.icon"></component>
                <span>{{ item.label }}</span>
            </el-menu-item>
            <el-sub-menu v-for="item in hasChildren" :index="item.path" :key="item.path">
                <template #title>
                    <component class="icons" :is="item.icon"></component>
                    <span>{{ item.label }}</span>
                </template>
                <el-menu-item-group>
                    <el-menu-item v-for="(subItem, subIndex) in item.children" :index="subItem.path"
                        :key="subItem.path">
                        <component class="icons" :is="subItem.icon"></component>
                        <span>{{ subItem.label }}</span>
                    </el-menu-item>
                </el-menu-item-group>
            </el-sub-menu>
        </el-menu>
    </el-aside>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAllDataStore } from '@/stores'
const list = ref([
    {
        path: '/home',
        name: 'home',
        label: '首页',
        icon: 'house',
        url: 'Home'
    },
    {
        path: '/mall',
        name: 'mall',
        label: '商品管理',
        icon: 'video-play',
        url: 'Mall'
    },
    {
        path: '/user',
        name: 'user',
        label: '用户管理',
        icon: 'user',
        url: 'User'
    },
    {
        path: 'other',
        label: '其他',
        icon: 'location',
        children: [
            {
                path: '/page1',
                name: 'page1',
                label: '页面1',
                icon: 'setting',
                url: 'Page1'
            },
            {
                path: '/page2',
                name: 'page2',
                label: '页面2',
                icon: 'setting',
                url: 'Page2'
            }
        ]
    }
]);
const store = useAllDataStore();
const noChildren = computed(() => list.value.filter(item => !item.children));
const hasChildren = computed(() => list.value.filter(item => item.children));
const isCollapse = computed(() => store.state.isCollapse);
const width = computed(() => store.state.isCollapse ? "64px" : "180px")
</script>

<style lang="less" scoped>
.el-aside {
    // transition: width 0.03s ease;

    .el-menu {
        width: 100%;
        height: 100%;
        background-color: #fff;
        border-right: none;

        h3 {
            line-height: 60px;
            text-align: center;
            color: black;
        }
    }
}

.el-menu--collapse {
    transition: width 0.3s ease;
}

.icons {
    width: 18px;
    height: 18px;
    margin-right: 5px;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>