<script setup>
import { reactive, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { ElMessage } from 'element-plus';
import { useAllDataStore } from "@/stores";
import { useRouter } from 'vue-router';

const loginForm = reactive({
    username: 'superadmin',
    password: 'woshimima'
});

const store = useAllDataStore();
const router = useRouter();

const superadminMenu = [
    {
        path: '/visual',
        name: 'visual',
        label: '智能监控',
        icon: 'analysis',
        url: 'visual/Visual'
    },
    {
        path: '/prediction',
        name: 'prediction',
        label: '性能分析',
        icon: 'prediction',
        url: 'prediction/Prediction'
    },
    {
        path: '/report',
        name: 'report',
        label: '工序报表',
        icon: 'report',
        children: [
            {
                path: '/heatingreport',
                name: 'heatingreport',
                label: '加热报表',
                icon: 'heating',
                url: 'reportview/heatingreport/HeatingReport'
            },
            {
                path: '/rollingreport',
                name: 'rollingreport',
                label: '轧制报表',
                icon: 'rolling',
                url: 'reportview/rollingreport/RollingReport'
            },
            {
                path: '/coolingreport',
                name: 'coolingreport',
                label: '冷却报表',
                icon: 'cooling',
                url: 'reportview/coolingreport/CoolingReport'
            },
            {
                path: '/fqcreport',
                name: 'fqcreport',
                label: 'FQC报表',
                icon: 'FQC',
                url: 'reportview/fqcreport/FQCReport'
            },
        ]
    },
    {
        path: 'dataoverview',
        label: '数据概览',
        icon: 'dataoverview',
        children: [
            {
                path: '/specification',
                name: 'specification',
                label: '规格参数',
                icon: 'spec',
                url: 'dataoverview/specification/Specification'
            },
            {
                path: '/heating',
                name: 'heating',
                label: '加热工序',
                icon: 'heating',
                url: 'dataoverview/heating/Heating'
            },
            {
                path: '/rolling',
                name: 'rolling',
                label: '轧制工序',
                icon: 'rolling',
                url: 'dataoverview/rolling/Rolling'
            },
            {
                path: '/cooling',
                name: 'cooling',
                label: '冷却工序',
                icon: 'cooling',
                url: 'dataoverview/cooling/Cooling'
            },
            {
                path: '/fqc',
                name: 'fqc',
                label: '质量检查',
                icon: 'FQC',
                url: 'dataoverview/fqc/FQC'
            },
        ]
    },
    {
        path: 'develop',
        name: 'develop',
        label: '开发日志',
        icon: 'github',
        url: 'developview/DevelopView'
    },
    {
        path: '/limits',
        name: 'limits',
        label: '权限管理',
        icon: 'limits',
        url: 'limits/Limits'
    },
    {
        path: '/user',
        name: 'user',
        label: '用户管理',
        icon: 'user',
        url: 'user/User'
    }
];

const adminMenu = [
    {
        path: '/visual',
        name: 'visual',
        label: '可视分析',
        icon: 'analysis',
        url: 'visual/Visual'
    },
    {
        path: '/report',
        name: 'report',
        label: '工序报表',
        icon: 'report',
        children: [
            {
                path: '/heatingreport',
                name: 'heatingreport',
                label: '加热报表',
                icon: 'heating',
                url: 'reportview/heatingreport/HeatingReport'
            },
            {
                path: '/rollingreport',
                name: 'rollingreport',
                label: '轧制报表',
                icon: 'rolling',
                url: 'reportview/rollingreport/RollingReport'
            },
            {
                path: '/coolingreport',
                name: 'coolingreport',
                label: '冷却报表',
                icon: 'cooling',
                url: 'reportview/coolingreport/CoolingReport'
            },
            {
                path: '/fqcreport',
                name: 'fqcreport',
                label: 'FQC报表',
                icon: 'FQC',
                url: 'reportview/fqcreport/FQCReport'
            },
        ]
    },
    {
        path: 'dataoverview',
        label: '数据概览',
        icon: 'dataoverview',
        children: [
            {
                path: '/specification',
                name: 'specification',
                label: '规格参数',
                icon: 'spec',
                url: 'dataoverview/specification/Specification'
            },
            {
                path: '/heating',
                name: 'heating',
                label: '加热工序',
                icon: 'heating',
                url: 'dataoverview/heating/Heating'
            },
            {
                path: '/rolling',
                name: 'rolling',
                label: '轧制工序',
                icon: 'rolling',
                url: 'dataoverview/rolling/Rolling'
            },
            {
                path: '/cooling',
                name: 'cooling',
                label: '冷却工序',
                icon: 'cooling',
                url: 'dataoverview/cooling/Cooling'
            },
            {
                path: '/fqc',
                name: 'fqc',
                label: '质量检查',
                icon: 'FQC',
                url: 'dataoverview/fqc/FQC'
            },
        ]
    }
];

const handleLogin = async () => {
    try {
        let res = null;

        if (loginForm.username === 'superadmin' && loginForm.password === 'woshimima') {
            res = {
                token: 'mock-superadmin-token',
                menuList: superadminMenu
            };
        } else if (loginForm.username === 'admin' && loginForm.password === 'woshimima') {
            res = {
                token: 'mock-admin-token',
                menuList: adminMenu
            };
        } else {
            ElMessage.error('账号或密码错误');
            return;
        }

        store.updateMenuList(res.menuList);
        store.state.token = res.token;

        localStorage.setItem('token', res.token);
        localStorage.setItem('menuList', JSON.stringify(res.menuList));

        store.addMenu(router);

        await nextTick();
        router.push('/visual');
    } catch (error) {
        console.error('具体的报错信息:', error.message);
        ElMessage.error('登录失败');
    }
};

const handleKeyup = (e) => {
    if (e.key === 'Enter') {
        handleLogin();
    }
};

onMounted(() => {
    window.addEventListener('keyup', handleKeyup);
});

onBeforeUnmount(() => {
    window.removeEventListener('keyup', handleKeyup);
});
</script>

<template>
    <div class="body-login">
        <el-form :model="loginForm" class="login-container">
            <h1>欢迎登录</h1>
            <el-form-item>
                <el-input type="input" placeholder="请输入账号" v-model="loginForm.username"></el-input>
            </el-form-item>
            <el-form-item>
                <el-input type="password" placeholder="请输入密码" v-model="loginForm.password"></el-input>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="handleLogin">Login</el-button>
            </el-form-item>
        </el-form>
    </div>
</template>

<style scoped lang="less">
.body-login {
    width: 100%;
    height: 100%;
    background-image: url("../assets/images/background.png");
    background-size: 100%;
    overflow: hidden;
}

.login-container {
    width: 400px;
    background-color: #fff;
    border: 1px solid #eaeaea;
    border-radius: 15px;
    padding: 35px 35px 15px 35px;
    box-shadow: 0 0 25px #cacaca;
    margin: 250px auto;

    h1 {
        text-align: center;
        margin-bottom: 20px;
        color: black;
    }

    :deep(.el-form-item__content) {
        justify-content: center;
    }
}
</style>