import { defineStore } from 'pinia';
import { ref } from 'vue';

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
        currentMenu: null
    }
}
export const useAllDataStore = defineStore('AllData', () => {
    
    const state = ref(initState());
    const selectMenu = (val) => {
        if(val.name === 'home'){
            state.value.currentMenu === null
        }else{
            let index = state.value.tags.findIndex(item=>item.name === val.name);
            index === -1 ? state.value.tags.push(val) : '';
        }
    }
    const updateMenu = (tag) => {
        let index = state.value.tags.findIndex(item=>item.name === tag.name);
        state.value.tags.splice(index, 1)
    }
    return {
        state,
        selectMenu,
        updateMenu
    }
})