import { defineStore } from 'pinia';
import { ref } from 'vue';

function initState() {
    return {
        isCollapse: true
    }
}
export const useAllDataStore = defineStore('AllData', () => {
    
    const state = ref(initState());

    return {
        state,
    }
})