import { createApp } from 'vue';
import App from './App.vue';
import "@/assets/less/index.less";
import router from './router';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import { createPinia } from 'pinia';
import "@/api/mock.js";
import api from './api/api';
import * as echarts from "echarts";
import { useAllDataStore } from '@/stores'

function isRoute(to) {
    return router.getRoutes().filter(item => item.path === to.path).length > 0
}
router.beforeEach((to, from) => {
    if (to.path !== '/login' && !store.state.token) {
        //跳转到login
        return { name: 'login' }
    }
    //如果路由记录不存在
    if (!isRoute(to)) {
        //跳转到404界面
        return { name: "404" }
    }
});
const app = createApp(App);
const pinia = createPinia();
app.config.globalProperties.$api = api;
app.config.globalProperties.$echarts = echarts;
app.use(ElementPlus);
app.use(pinia);
const store = useAllDataStore();
store.addMenu(router, 'refresh');
app.use(router);
app.mount('#app');
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}
