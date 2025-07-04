import { createApp } from 'vue';
import App from './App.vue';
import "@/assets/less/index.less";
import router from './router';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import { createPinia } from 'pinia';
const app = createApp(App);
const pinia = createPinia()
app.use(ElementPlus);
app.use(pinia);
app.use(router).mount('#app');
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}
