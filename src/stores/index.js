import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

function initState() {
    return {
        isCollapse: true,
        tags: [
            {
                path: '/home',
                name: 'home',
                label: '首页',
                icon: 'home'
            }
        ],
        currentMenu: null,
        menuList: [],
        token: '',
        routerList: [],
    }
}
export const useAllDataStore = defineStore('AllData', () => {

    const state = ref(initState());
    watch(state, (newObj) => {
        if (!newObj.token) {
            return
        }
        localStorage.setItem('store', JSON.stringify(newObj));
    },
        {
            deep: true
        }
    )

    const selectMenu = (val) => {
        if (val.name === 'home') {
            state.value.currentMenu = null
        } else {
            state.value.currentMenu = val
            let index = state.value.tags.findIndex(item => item.name === val.name);
            index === -1 ? state.value.tags.push(val) : '';
        }
    }
    const updateMenu = (tag) => {
        let index = state.value.tags.findIndex(item => item.name === tag.name);
        state.value.tags.splice(index, 1)
    }
    const updateMenuList = (val) => {
        state.value.menuList = val;
    }
    // const addMenu = (router) => {
    //     const menu = state.value.menuList;
    //     const modules = import.meta.glob('../views/**/*.vue');
    //     const routeArr = [];
    //     menu.forEach(item => {
    //         if(item.children){
    //             item.children.forEach(val => {
    //                 let url = `../views/${val.url}.vue`
    //                 val.component = modules[url];
    //                 routeArr.push(val);
    //             })
    //         }else{
    //             let url = `../views/${item.url}.vue`;
    //             item.component = modules[url];
    //             routeArr.push(item)
    //         }
    //     });
    //     state.value.routerList = [];
    //     let routers = router.getRoutes();
    //     routers.forEach(item => {
    //         if(item.name === 'main' || item.name === 'login'){
    //             return
    //         }else{
    //             router.removeRoute(item.name)
    //         }
    //         state.value.routerList.push(router.addRoute('main', item))
    //     });
    // }
    const addMenu = (router, type) => {
        if (type === 'refresh') {
            if (JSON.parse(localStorage.getItem('store'))) {
                state.value = JSON.parse(localStorage.getItem('store'))
                state.value.routerList = [];
            } else {
                return
            }
        }
        const menu = state.value.menuList;
        const modules = import.meta.glob('../views/**/*.vue');
        const routeArr = [];
        menu.forEach(item => {
            if (item.children) {
                item.children.forEach(val => {
                    let url = `../views/${val.url}.vue`;
                    if (modules[url]) {
                        val.component = modules[url];
                        routeArr.push(val);
                    }
                });
            } else {
                let url = `../views/${item.url}.vue`;
                if (modules[url]) {
                    item.component = modules[url];
                    routeArr.push(item);
                }
            }
        });
        // 清空旧动态路由
        router.getRoutes().forEach(r => {
            if (r.name && r.name !== 'main' && r.name !== 'login' && r.name !== '404') {
                router.removeRoute(r.name);
            }
        });
        // 添加新路由到 main 的 children
        routeArr.forEach(route => {
            router.addRoute('main', route);
        });
        state.value.routerList = routeArr;
    };
    // const clean = () => {
    //     state.value.routerList.forEach(item => {
    //         if (item) item();
    //     });
    //     state.value = initState();
    //     localStorage.removeItem('store');
    // };
    const clean = () => {
        state.value.routerList.forEach(item => {
            // 只执行真正的函数，忽略其他类型
            if (typeof item === 'function') {
                try {
                    item(); // 执行清理函数
                } catch (error) {
                    console.error('清理函数执行失败:', error);
                }
            } else if (item !== undefined && item !== null) {
                // 可选：记录非函数元素以便调试
                // console.warn('routerList中存在非函数元素:', item);
            }
        });
        state.value = initState();
        localStorage.removeItem('store');
    };
    return {
        state,
        selectMenu,
        updateMenu,
        updateMenuList,
        addMenu,
        clean
    }
})