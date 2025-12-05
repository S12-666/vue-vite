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
        component: () => import('@/views/Main.vue'), // 主布局组件
        redirect: '/visual',
        children: [
            // **【修改：将 /visual 作为子路由】**
            {
                path: 'visual', // 注意：这里是相对路径 'visual'，完整路径是 /visual
                name: 'visual',
                // 确保导入路径正确，这里使用您提供的路径
                component: () => import('@/views/visual/Visual.vue') 
            }
        ]
    },
    {
        path: '/404',
        name: '404',
        component: () => import('@/views/404.vue')
    },
    {
        path: '/:pathMatch(.*)*', // catch-all
        redirect: '/404'
    }
]

const router = createRouter({
    // 设置路由模式
    history: createWebHashHistory(),
    routes,
});

export default router;