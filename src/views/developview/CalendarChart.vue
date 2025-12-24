<template>
    <div class="calendar-heatmap">
        <div ref="elRef" class="echarts-box" />
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'

import * as echarts from 'echarts/core'
import { CalendarComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
import { HeatmapChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'

// 注册必须组件
echarts.use([CalendarComponent, TooltipComponent, VisualMapComponent, HeatmapChart, CanvasRenderer])

const props = defineProps({
    /** 日历范围：YYYY-MM 或 YYYY */
    range: { type: String, default: '2017-04' },
    data: { type: Array, default: () => [] },
    cellSize: { type: [Number, Array], default: 40 },
    max: { type: Number, default: 0 },
    height: { type: String, default: '340px' },
    visualMapShow: { type: Boolean, default: true },
    tooltipPosition: { type: String, default: 'top' }
})

const elRef = ref(null)
let chart = null
let ro = null

const boxStyle = computed(() => ({ height: props.height }))

function getVirtualData(year) {
    const start = +echarts.time.parse(year + '-01-01')
    const end = +echarts.time.parse(+year + 1 + '-01-01')
    const dayTime = 3600 * 24 * 1000
    const out = []
    for (let time = start; time < end; time += dayTime) {
        out.push([
            echarts.time.format(time, '{yyyy}-{MM}-{dd}', false),
            Math.floor(Math.random() * 1000)
        ])
    }
    return out
}

function resolveData() {
    if (props.data && props.data.length > 0) return props.data

    const year = String(props.range).slice(0, 4)
    if (/^\d{4}$/.test(year)) return getVirtualData(year)
    return []
}

function resolveMax(data) {
    if (props.max > 0) return props.max
    let m = 0
    for (const item of data) {
        const v = Number(item?.[1] ?? 0)
        if (Number.isFinite(v)) m = Math.max(m, v)
    }
    return Math.max(5, m || 0)
}

function render() {
    if (!chart) return

    const data = resolveData()
    const vmax = resolveMax(data)

    const option = {
        tooltip: { position: props.tooltipPosition },
        visualMap: {
            min: 0,
            max: vmax,
            calculable: true,
            show: props.visualMapShow,
            orient: 'horizontal',
            left: 'center',
            bottom: 12
        },
        calendar: {
            orient: 'vertical',
            yearLabel: { margin: 40 },
            dayLabel: {
                firstDay: 1,
                nameMap: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            },
            monthLabel: { nameMap: 'cn', margin: 20 },
            cellSize: props.cellSize,
            range: props.range
        },
        series: [
            {
                type: 'heatmap',
                coordinateSystem: 'calendar',
                data
            }
        ]
    }

    chart.setOption(option, { notMerge: true })
}

onMounted(() => {
    if (!elRef.value) return
    chart = echarts.init(elRef.value)

    ro = new ResizeObserver(() => chart && chart.resize())
    ro.observe(elRef.value)

    render()
})

watch(
    () => [props.range, props.data, props.cellSize, props.max, props.visualMapShow, props.tooltipPosition],
    () => render(),
    { deep: true }
)

onBeforeUnmount(() => {
    ro?.disconnect()
    ro = null
    chart?.dispose()
    chart = null
})
</script>

<style scoped>
.echarts-box {
    width: 100%;
    height: v-bind('boxStyle.height');
}
</style>
