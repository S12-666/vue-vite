import { createRouter, createWebHashHistory } from "vue-router";


// 制定路由规则
const routes = [
    {
        path: '/login',
        name: 'login',
        component: () => import('@/views/Login.vue')
    },
    {
        path: '/',
        name: 'main',
        component: () => import('@/views/Main.vue'),
        redirect: '/home',
        children: [
        ]
    },
    {
        path: '/404',
        name: '404',
        component: () => import('@/views/404.vue')
    }
]

const router = createRouter({
    // 设置路由模式
    history: createWebHashHistory(),
    routes,
});

export default router;