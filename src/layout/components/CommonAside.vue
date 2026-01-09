<template>
    <el-aside :width="width" class="my-aside">
        <el-menu :collapse="isCollapse" :collapse-transition="false" :unique-opened="true" :default-active="activeMenu"
            class="el-menu-vertical">
            <template v-for="item in list" :key="item.path">

                <el-menu-item v-if="!item.children || item.children.length === 0" :index="item.path"
                    @click="handleMenu(item)">
                    <img :src="loadIcon(item.icon)" class="icons" alt="" />
                    <template #title>
                        <span>{{ item.label }}</span>
                    </template>
                </el-menu-item>

                <el-sub-menu v-else :index="item.path">
                    <template #title>
                        <img :src="loadIcon(item.icon)" class="icons" alt="" />
                        <span>{{ item.label }}</span>
                    </template>

                    <el-menu-item v-for="(subItem, subIndex) in item.children" :index="subItem.path" :key="subItem.path"
                        @click="handleMenu(subItem)">
                        <img :src="loadIcon(subItem.icon)" class="icons" alt="" />
                        <template #title>
                            <span>{{ subItem.label }}</span>
                        </template>
                    </el-menu-item>
                </el-sub-menu>

            </template>
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
    transition: width 0.3s ease;

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
    width: 18px; // 或者18px，但必须固定
    height: 18px;
    margin-right: 10px;
    flex-shrink: 0; // 关键属性！防止图标缩小
}

.force-narrow-mode {

    // 1. 隐藏所有文字 span
    :deep(span) {
        display: none;
        opacity: 0;
    }

    // 2. 隐藏父菜单右侧的小箭头 (那个 > 符号)
    :deep(.el-sub-menu__icon-arrow) {
        display: none;
    }

    // 3. 调整父级菜单的 padding，让图标居中
    :deep(.el-sub-menu__title),
    :deep(.el-menu-item) {
        padding: 0 !important;
        display: flex;
        justify-content: center;
        align-items: center;

        .icons {
            margin-right: 0; // 去掉图标右边距
        }
    }

    // 4. 调整展开后的子菜单样式
    // 这一步是为了让子菜单的图标跟父级区别开，或者保持对其
    :deep(.el-sub-menu) {
        .el-menu-item {
            min-width: unset; // 取消 element 默认的最小宽度
            background-color: #f5f7fa; // 给子菜单加个背景色，方便区分层级

            // 如果你想让子菜单图标变小一点，表示它是子集
            .icons {
                transform: scale(0.8);
            }
        }
    }
}
</style>