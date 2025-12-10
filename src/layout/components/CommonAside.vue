<template>
    <el-aside :width="width" class="my-aside">
        <el-menu 
            :collapse="isCollapse" 
            :collapse-transition="false" 
            :default-active="activeMenu"
            class="el-menu-vertical"
        >
            <el-menu-item v-for="item in noChildren" :index="item.path" :key="item.path" @click="handleMenu(item)">
                <!-- <component class="icons" :is="loadIcon(item.icon)"></component> -->
                <img :src="loadIcon(item.icon)" class="icons" alt="" />
                <span>{{ item.label }}</span>
            </el-menu-item>
            
            <el-sub-menu v-for="item in hasChildren" :index="item.path" :key="item.path">
                <template #title>
                    <img :src="loadIcon(item.icon)" class="icons" alt="" />
                    <!-- <component class="icons" :is="loadIcon(item.icon)"></component> -->
                    <span>{{ item.label }}</span>
                </template>
                <el-menu-item-group>
                    <el-menu-item v-for="(subItem, subIndex) in item.children" :index="subItem.path" :key="subItem.path"
                        @click="handleMenu(subItem)">
                        <!-- <component class="icons" :is="loadIcon(subItem.icon)"></component> -->
                        <img :src="loadIcon(subItem.icon)" class="icons" alt="" />
                        <span>{{ subItem.label }}</span>
                    </el-menu-item>
                </el-menu-item-group>
            </el-sub-menu>
        </el-menu>

        <div class="collapse-btn" @click="handleCollapse">
            <el-icon>
                <component :is="isCollapse ? Expand : Fold" />
            </el-icon>
        </div>
    </el-aside>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAllDataStore } from '@/stores';
import { Expand, Fold } from '@element-plus/icons-vue';
import { useRoute, useRouter } from 'vue-router';
import { loadIcon } from '@/utils/icons_utils/iconLoader';

const store = useAllDataStore();
const list = computed(() => store.state.menuList);
// console.log(list);

const noChildren = computed(() => list.value.filter(item => !item.children));
const hasChildren = computed(() => list.value.filter(item => item.children));
// console.log(list.value);
const isCollapse = computed(() => store.state.isCollapse);
const width = computed(() => store.state.isCollapse ? "64px" : "180px");
const handleCollapse = () => {
    store.state.isCollapse = !store.state.isCollapse
}
const router = useRouter()
const route = useRoute()
const activeMenu = computed(() => route.path)
const handleMenu = (item) => {
    router.push(item.path)
    store.selectMenu(item)
}
</script>

<style lang="less" scoped>
.my-aside {
    height: 100vh;
    background-color: #fff;
    overflow-x: hidden; // 防止宽度变化时内容溢出
    transition: width 0.05s ease;
    
    display: flex;
    flex-direction: column; 
}

.el-menu-vertical {
    width: 100%;
    border-right: none;
    white-space: nowrap; // 防止折叠时文字换行
    flex: 1; 
    
    overflow-y: auto; 
    &::-webkit-scrollbar {
        width: 0;
    }
}

// 底部按钮样式
.collapse-btn {
    height: 45px; // 固定高度
    width: 100%;
    display: flex;
    justify-content: right;
    align-items: center;
    cursor: pointer;
    padding-right: 20px;
    // 加个上边框，和菜单区分开
    // border-top: 1px solid #dcdfe6; 
    color: #606266;
    transition: all 0.3s ease;
    
    &:hover {
        // background-color: #ecf5ff;
        color: #409eff;
    }

    // 设置图标大小
    .el-icon {
        font-size: 24px;
    }
}

.icons {
    width: 18px;  // 或者18px，但必须固定
    height: 18px;
    margin-right: 10px;
    flex-shrink: 0; // 关键属性！防止图标缩小
}

// ...
</style>