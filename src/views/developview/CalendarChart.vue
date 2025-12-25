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

// 注册组件
echarts.use([CalendarComponent, TooltipComponent, VisualMapComponent, HeatmapChart, CanvasRenderer])

const props = defineProps({
    monthKey: { type: String, required: true }, // 格式 '2025-12'
    commits: { type: Array, default: () => [] },
    height: { type: String, default: '320px' }
})

const elRef = ref(null)
let chart = null
let resizeObserver = null

const boxStyle = computed(() => ({ height: props.height }))

// ================== 数据处理 ==================
const chartData = computed(() => {
    const map = new Map()

    // 1. 填充当月每一天（保证 0 提交的格子也存在）
    if (props.monthKey) {
        const [y, m] = props.monthKey.split('-').map(Number)
        const daysInMonth = new Date(y, m, 0).getDate() // 获取当月总天数

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            map.set(dateStr, 0)
        }
    }

    // 2. 统计实际提交数
    props.commits.forEach(item => {
        const d = new Date(item.date)
        if (isNaN(d.getTime())) return
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

        if (map.has(dateStr)) {
            map.set(dateStr, map.get(dateStr) + 1)
        }
    })

    return Array.from(map.entries())
})

// 动态计算最大值，用于颜色映射
const maxCount = computed(() => {
    let m = 0
    for (const [, count] of chartData.value) {
        if (count > m) m = count
    }
    return Math.max(5, m) // 至少分为5级
})

// ================== 渲染逻辑 ==================
function render() {
    if (!chart) return

    const option = {
        tooltip: {
            position: 'top',
            formatter: (p) => {
                return `${p.data[0]}<br/><b>${p.data[1]} contributions</b>`
            }
        },
        // ✅ GitHub 绿色阶配置
        visualMap: {
            min: 0,
            max: maxCount.value,
            calculable: false,
            show: true,
            orient: 'horizontal',
            left: 'center',
            bottom: 0,
            itemWidth: 12,
            itemHeight: 12,
            inRange: {
                // 0次(灰) -> 少(浅绿) -> 多(深绿)
                color: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']
            },
            text: ['More', 'Less'],
            textStyle: { color: '#999', fontSize: 12 }
        },
        calendar: {
            // ✅ 核心布局配置：
            orient: 'vertical',  // 垂直布局 = 挂历模式 (一周一行，向下排列)
            range: props.monthKey, // 锁定单月

            top: 40,
            bottom: 40,
            left: 'center', // 居中显示

            // ✅ 样式调整：确保是正方形格子
            cellSize: [50, 50], // [宽, 高] 固定大小，看起来更整齐

            yearLabel: { show: false }, // 不需要显示年份
            monthLabel: { show: false }, // 不需要显示月份(已经在外部显示了)

            // ✅ 星期标签：放在顶部
            dayLabel: {
                firstDay: 1, // 周一开始
                nameMap: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
                margin: 10, // 距离格子的距离
                color: '#666',
                fontWeight: 'bold'
            },

            // 格子边框样式 (模拟间距)
            itemStyle: {
                borderWidth: 4,
                borderColor: '#fff'
            },
            splitLine: { show: false } // 去掉默认分割线
        },
        series: [
            {
                type: 'heatmap',
                coordinateSystem: 'calendar',
                data: chartData.value,
                emphasis: {
                    itemStyle: {
                        shadowBlur: 5,
                        shadowColor: 'rgba(0, 0, 0, 0.3)'
                    }
                }
            }
        ]
    }

    chart.setOption(option)
}

// ================== 生命周期 ==================
onMounted(() => {
    if (elRef.value) {
        chart = echarts.init(elRef.value)
        resizeObserver = new ResizeObserver(() => chart.resize())
        resizeObserver.observe(elRef.value)
        render()
    }
})

watch(() => [props.commits, props.monthKey], render, { deep: true })

onBeforeUnmount(() => {
    resizeObserver?.disconnect()
    chart?.dispose()
})

defineExpose({
    resize: () => chart?.resize(),
    refresh: render
})
</script>

<style scoped>
.echarts-box {
    width: 100%;
    height: v-bind('boxStyle.height');
    /* 确保容器居中 */
    display: flex;
    justify-content: center;
}
</style>