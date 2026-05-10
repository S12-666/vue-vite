<script setup>
import { reactive, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { ElMessage } from 'element-plus';
import { useAllDataStore } from "@/stores";
import { useRouter } from 'vue-router';

const loginForm = reactive({
    username: '',
    password: ''
});

const store = useAllDataStore();
const router = useRouter();

// 帮你恢复了 superadmin 的菜单数据
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
            { path: '/heatingreport', name: 'heatingreport', label: '加热报表', icon: 'heating', url: 'reportview/heatingreport/HeatingReport' },
            { path: '/rollingreport', name: 'rollingreport', label: '轧制报表', icon: 'rolling', url: 'reportview/rollingreport/RollingReport' },
            { path: '/coolingreport', name: 'coolingreport', label: '冷却报表', icon: 'cooling', url: 'reportview/coolingreport/CoolingReport' },
            { path: '/fqcreport', name: 'fqcreport', label: 'FQC报表', icon: 'FQC', url: 'reportview/fqcreport/FQCReport' },
        ]
    },
    {
        path: 'dataoverview',
        label: '数据概览',
        icon: 'dataoverview',
        children: [
            { path: '/specification', name: 'specification', label: '规格参数', icon: 'spec', url: 'dataoverview/specification/Specification' },
            { path: '/heating', name: 'heating', label: '加热工序', icon: 'heating', url: 'dataoverview/heating/Heating' },
            { path: '/rolling', name: 'rolling', label: '轧制工序', icon: 'rolling', url: 'dataoverview/rolling/Rolling' },
            { path: '/cooling', name: 'cooling', label: '冷却工序', icon: 'cooling', url: 'dataoverview/cooling/Cooling' },
            { path: '/fqc', name: 'fqc', label: '质量检查', icon: 'FQC', url: 'dataoverview/fqc/FQC' },
        ]
    },
    { path: 'develop', name: 'develop', label: '开发日志', icon: 'github', url: 'developview/DevelopView' },
    { path: '/limits', name: 'limits', label: '权限管理', icon: 'limits', url: 'limits/Limits' },
    { path: '/user', name: 'user', label: '用户管理', icon: 'user', url: 'user/User' }
];

// 这是修复了路径的 admin 菜单数据
const adminMenu = [
    {
        path: '/visual',
        name: 'visual',
        label: '可视分析',
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
            { path: '/heatingreport', name: 'heatingreport', label: '加热报表', icon: 'heating', url: 'reportview/heatingreport/HeatingReport' },
            { path: '/rollingreport', name: 'rollingreport', label: '轧制报表', icon: 'rolling', url: 'reportview/rollingreport/RollingReport' },
            { path: '/coolingreport', name: 'coolingreport', label: '冷却报表', icon: 'cooling', url: 'reportview/coolingreport/CoolingReport' },
            { path: '/fqcreport', name: 'fqcreport', label: 'FQC报表', icon: 'FQC', url: 'reportview/fqcreport/FQCReport' },
        ]
    },
    {
        path: 'dataoverview',
        label: '数据概览',
        icon: 'dataoverview',
        children: [
            { path: '/specification', name: 'specification', label: '规格参数', icon: 'spec', url: 'dataoverview/specification/Specification' },
            { path: '/heating', name: 'heating', label: '加热工序', icon: 'heating', url: 'dataoverview/heating/Heating' },
            { path: '/rolling', name: 'rolling', label: '轧制工序', icon: 'rolling', url: 'dataoverview/rolling/Rolling' },
            { path: '/cooling', name: 'cooling', label: '冷却工序', icon: 'cooling', url: 'dataoverview/cooling/Cooling' },
            { path: '/fqc', name: 'fqc', label: '质量检查', icon: 'FQC', url: 'dataoverview/fqc/FQC' },
        ]
    }
];

const handleLogin = async () => {
    try {
        let res = null;

        // 帮你恢复了账号判断逻辑：同时支持 superadmin 和 admin
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
        <div class="login-header">
            <h1 class="system-title">厚板性能交互监控与分析系统</h1>
            <p class="system-subtitle">Heavy Plate Performance Interactive Monitoring & Analysis System</p>
        </div>
        <el-form :model="loginForm" class="login-container">
            <div class="login-form-header">
                <h2>用户登录</h2>
                <div class="login-decoration"></div>
            </div>
            <el-form-item>
                <el-input type="input" placeholder="请输入账号" v-model="loginForm.username">
                    <template #prefix>
                        <div class="custom-icon">
                            <svg viewBox="0 0 1024 1024" width="18" height="18">
                                <path
                                    d="M512 512a224 224 0 1 0 0-448 224 224 0 0 0 0 448z m0-64a160 160 0 1 1 0-320 160 160 0 0 1 0 320z"
                                    fill="#026BFF"></path>
                                <path d="M448 320h128a64 64 0 1 1-128 0z" fill="#80B5FF"></path>
                                <path
                                    d="M304 576h416c114.88 0 208 85.952 208 192s-93.12 192-208 192h-416C189.12 960 96 874.048 96 768s93.12-192 208-192z m-3.2 64C223.04 640 160 697.28 160 768s63.04 128 140.8 128h422.4c77.76 0 140.8-57.28 140.8-128s-63.04-128-140.8-128H300.8z"
                                    fill="#026BFF"></path>
                            </svg>
                        </div>
                    </template>
                </el-input>
            </el-form-item>
            <el-form-item>
                <el-input type="password" placeholder="请输入密码" v-model="loginForm.password">
                    <template #prefix>
                        <div class="custom-icon">
                            <svg viewBox="0 0 1024 1024" width="18" height="18">
                                <path
                                    d="M785.066667 892.586667H238.933333c-37.546667 0-68.266667-32.426667-68.266666-71.68V450.56c0-39.253333 30.72-71.68 68.266666-71.68h546.133334c37.546667 0 68.266667 32.426667 68.266666 71.68v370.346667c0 39.253333-30.72 71.68-68.266666 71.68zM238.933333 447.146667v373.76c0 1.706667 1.706667 3.413333 1.706667 3.413333H785.066667V450.56c0-1.706667-1.706667-3.413333-1.706667-3.413333H238.933333z"
                                    fill="#3793DF"></path>
                                <path
                                    d="M682.666667 448.853333H341.333333v-145.066666c0-93.866667 76.8-170.666667 170.666667-170.666667 44.373333 0 87.04 17.066667 121.173333 47.786667C665.6 213.333333 682.666667 256 682.666667 303.786667v145.066666z m-273.066667-68.266666h204.8v-76.8c0-29.013333-10.24-54.613333-29.013333-73.386667-20.48-18.773333-46.08-29.013333-73.386667-29.013333-56.32 0-102.4 46.08-102.4 102.4v76.8z"
                                    fill="#3793DF"></path>
                                <path
                                    d="M512 713.386667c-18.773333 0-34.133333-15.36-34.133333-34.133334v-136.533333c0-18.773333 15.36-34.133333 34.133333-34.133333s34.133333 15.36 34.133333 34.133333v136.533333c0 18.773333-15.36 34.133333-34.133333 34.133334z"
                                    fill="#EB4AF4"></path>
                                <path
                                    d="M512 696.32m-68.266667 0a68.266667 68.266667 0 1 0 136.533334 0 68.266667 68.266667 0 1 0-136.533334 0Z"
                                    fill="#EB4AF4"></path>
                            </svg>
                        </div>
                    </template>
                </el-input>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="handleLogin" class="login-btn">
                    登录
                </el-button>
            </el-form-item>
        </el-form>
    </div>
</template>

<style scoped lang="less">
.body-login {
    width: 100%;
    height: 100vh;
    background-image: url("../assets/images/background.png");
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%);
        z-index: 1;
    }
}

.login-header {
    text-align: center;
    margin-bottom: 40px;
    z-index: 2;
    position: relative;

    .system-title {
        font-size: 48px;
        font-weight: 800;
        color: #ffffff;
        margin-bottom: 15px;
        text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.6);
        letter-spacing: 3px;
    }

    .system-subtitle {
        font-size: 18px;
        color: #e0e0e0;
        font-weight: 300;
        letter-spacing: 1px;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
    }
}

/* 修改点：设置透明度为 90%，移除悬浮动画 */
.login-container {
    width: 450px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    padding: 50px 45px 30px 45px;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
    z-index: 2;
    position: relative;
}

.login-form-header {
    text-align: center;
    margin-bottom: 35px;

    h2 {
        font-size: 28px;
        font-weight: 600;
        color: #2c3e50;
        margin-bottom: 15px;
        letter-spacing: 1px;
    }

    .login-decoration {
        width: 60px;
        height: 4px;
        background: linear-gradient(90deg, #409EFF, #53a8ff);
        margin: 0 auto;
        border-radius: 2px;
    }
}

:deep(.el-form-item) {
    margin-bottom: 25px;

    .el-input {
        .el-input__wrapper {
            border-radius: 12px;
            padding: 8px 15px 8px 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            border: 1px solid #e4e7ed;
            background-color: transparent !important;

            /* 修改点：去除 hover 时的背景色变化，仅改变边框 */
            &.is-focus,
            &:hover {
                border-color: #409EFF;
            }
        }

        .el-input__inner {
            height: 45px;
            font-size: 16px;
            background-color: transparent !important;
            color: #333;

            &::placeholder {
                color: #909399;
                font-weight: 300;
            }

            /* 修改点：解决浏览器自带填充账号密码时的浅蓝色/浅黄色底色 */
            &:-webkit-autofill,
            &:-webkit-autofill:hover,
            &:-webkit-autofill:focus,
            &:-webkit-autofill:active {
                transition: background-color 5000s ease-in-out 0s;
                -webkit-text-fill-color: #333 !important;
            }
        }
    }
}

.custom-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 8px;

    svg {
        width: 18px;
        height: 18px;
        transition: all 0.3s ease;
    }
}

.login-btn {
    width: 100%;
    height: 50px;
    font-size: 18px;
    font-weight: 600;
    border-radius: 12px;
    background: linear-gradient(135deg, #409EFF 0%, #53a8ff 100%);
    border: none;
    transition: all 0.3s ease;
    letter-spacing: 1px;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(64, 158, 255, 0.3);
        background: linear-gradient(135deg, #53a8ff 0%, #69b7ff 100%);
    }

    &:active {
        transform: translateY(0);
    }
}

// 响应式设计
@media (max-width: 768px) {
    .login-container {
        width: 90%;
        margin: 0 20px;
        padding: 40px 30px 25px 30px;
    }

    .login-header {
        .system-title {
            font-size: 36px;
        }

        .system-subtitle {
            font-size: 14px;
        }
    }
}

@media (max-width: 480px) {
    .login-header {
        .system-title {
            font-size: 28px;
        }

        .system-subtitle {
            font-size: 12px;
        }
    }

    .login-container {
        padding: 30px 20px 20px 20px;
    }

    .login-form-header {
        h2 {
            font-size: 24px;
        }
    }
}
</style>