<script setup>
import { ref, onMounted, onBeforeUnmount, watch, shallowRef, nextTick } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
    curveData: {
        type: Object,
        default: () => ({ position: [], force: [], torque: [] })
    }
});

</script>

<template>
    <div ref="chartRef" style="height: 100%; width: 100%"></div>
</template>

<style scoped></style>