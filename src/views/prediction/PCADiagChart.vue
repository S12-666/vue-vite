<template>
    <div ref="chartRef" class="pca-chart"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
    // 直接传后端 res.data.predictions 进来
    predictions: {
        type: Object,
        default: () => ({})
    }
})

const chartRef = ref(null)
let chart = null
let ro = null

// 目标展示顺序优先（你说主要是 ps/gs 或 pn/ps/gs）
const preferredTargets = ['pn', 'ps', 'gs']

const normalizePred = (p) => {
    // 只取 PCA（无监督）结果：通常有 instance_metrics
    if (!p || p.status !== 'success' || !p.instance_metrics) return null

    const im = p.instance_metrics || {}
    const spe = Number(im.current_score ?? im.current_error ?? 0)
    const speLimit = Number(im.threshold_score ?? p.model_metrics?.threshold ?? 0)
    const ratio = speLimit > 0 ? spe / speLimit : null
    const prob = Number(p.abnormal_prob ?? 0)

    return {
        pred_label: p.pred_label,          // 0异常 1正常
        abnormal_prob: prob,
        spe,
        speLimit,
        ratio,
        is_safe: !!im.is_safe,
        top_features: Array.isArray(p.top_features) ? p.top_features : []
    }
}

const targetsData = computed(() => {
    const result = []
    for (const t of preferredTargets) {
        const item = normalizePred(props.predictions?.[t])
        if (item) {
            result.push({ target: t, ...item })
        }
    }
    // 兜底：如果 preferredTargets 没命中，就从 predictions 里找所有带 instance_metrics 的
    if (result.length === 0 && props.predictions) {
        Object.keys(props.predictions).forEach((k) => {
            const item = normalizePred(props.predictions[k])
            if (item) result.push({ target: k, ...item })
        })
    }
    return result
})

const displayName = (t) => t?.toUpperCase?.() ?? String(t)

// 影响力评分：优先 ratio（SPE/Limit），否则 abnormal_prob
const impactScore = (d) => {
    if (typeof d.ratio === 'number' && isFinite(d.ratio)) return d.ratio
    return d.abnormal_prob
}

let selectedTarget = null

const theme = {
    // 状态颜色
    colorAbnormal: '#F56C6C', // 红色：异常 (pred_label=0)
    colorNormal: '#409EFF',   // 蓝色：正常 (pred_label=1)
    colorFeature: '#67c23a',  // 浅蓝：右侧特征柱子颜色

    // 字体颜色
    textTitle: '#303133',     // 标题颜色
    textAxis: '#606266',      // 坐标轴文字颜色
    textLabel: '#909399',     // 柱子旁边的数值标签颜色

    // 辅助线
    splitLine: '#E4E7ED',
}

function buildOption(dataList) {
    // 影响力排序（降序）
    const sorted = [...dataList].sort((a, b) => impactScore(b) - impactScore(a))

    if (!selectedTarget) selectedTarget = sorted[0]?.target
    if (selectedTarget && !sorted.find(x => x.target === selectedTarget)) {
        selectedTarget = sorted[0]?.target
    }

    const leftNames = sorted.map(d => displayName(d.target))
    const leftValues = sorted.map(d => impactScore(d))

    // 左侧 bar 的标签：同时展示 abnormal_prob 和 SPE/Limit
    const leftLabelFormatter = (params) => {
        const d = sorted[params.dataIndex]
        const prob = isFinite(d.abnormal_prob) ? d.abnormal_prob : 0
        const ratio = isFinite(d.ratio) ? d.ratio : null
        const ratioText = ratio !== null ? `${ratio.toFixed(2)}×` : '-'
        return `Prob ${(prob * 100).toFixed(0)}%  |  SPE ${ratioText}`
    }

    const current = sorted.find(d => d.target === selectedTarget) || sorted[0]
    const MAX_FEATS = 15
    const feats = (current?.top_features || []).slice(0, MAX_FEATS)

    const featNames = feats.map(x => x.feature)
    const featVals = feats.map(x => Number(x.shap_value ?? 0))
    const featActual = feats.map(x => Number(x.actual_value ?? 0))

    // 右侧标题
    const rightTitle = current
        ? `关键驱动特征（SPE贡献Top）- ${displayName(current.target)}`
        : '关键驱动特征（SPE贡献Top）'

    // x 轴范围：左侧（ratio/prob）自适应
    const leftMax = (() => {
        const maxV = Math.max(...leftValues, 0)
        // 稍微留空
        return maxV <= 1.2 ? 1.2 : maxV * 1.15
    })()

    return {
        tooltip: {
            trigger: 'item',
            confine: true,
            formatter: (p) => {
                // 左侧：指标bar
                if (p.seriesName === '指标影响力') {
                    const d = sorted[p.dataIndex]
                    const prob = (d.abnormal_prob * 100).toFixed(1)
                    const spe = d.spe?.toFixed?.(2) ?? '-'
                    const lim = d.speLimit?.toFixed?.(2) ?? '-'
                    const ratio = (d.ratio ?? 0)?.toFixed?.(2) ?? '-'
                    const status = d.pred_label === 0 ? '异常' : '正常'
                    return [
                        `<b>${displayName(d.target)}</b>（${status}）`,
                        `异常强度：${prob}%`,
                        `SPE：${spe}`,
                        `Limit：${lim}`,
                        `SPE/Limit：${ratio}×`
                    ].join('<br/>')
                }

                // 右侧：特征bar
                if (p.seriesName === '特征贡献') {
                    const idx = p.dataIndex
                    const name = featNames[idx]
                    const contrib = featVals[idx]?.toFixed?.(4) ?? '0'
                    const actual = featActual[idx]
                    const actualText = isFinite(actual) ? actual.toFixed(4) : String(actual)
                    return [
                        `<b>${name}</b>`,
                        `贡献（SPE）：${contrib}`,
                        `实际值：${actualText}`
                    ].join('<br/>')
                }

                return ''
            }
        },
        grid: [
            // 左：指标影响力
            { left: 30, top: 30, bottom: 18, width: '48%' },
            // 右：特征贡献
            { right: 18, top: 30, bottom: 18, width: '48%' }
        ],
        title: [
            { text: '指标影响力排序', left: 18, top: 4, textStyle: { fontSize: 12, fontWeight: 600 } },
            { text: rightTitle, right: 18, top: 4, textStyle: { fontSize: 12, fontWeight: 600 } }
        ],
        xAxis: [
            {
                type: 'value',
                gridIndex: 0,
                min: 0,
                max: leftMax,
                axisLabel: { fontSize: 11 }
            },
            {
                type: 'value',
                gridIndex: 1,
                min: 0,
                axisLabel: { fontSize: 11 }
            }
        ],
        yAxis: [
            {
                type: 'category',
                gridIndex: 0,
                data: leftNames,
                axisLabel: { fontSize: 12, fontWeight: 600 }
            },
            {
                type: 'category',
                gridIndex: 1,
                data: featNames,
                axisLabel: { fontSize: 11 }
            }
        ],
        series: [
            {
                name: '指标影响力',
                type: 'bar',
                xAxisIndex: 0,
                yAxisIndex: 0,
                data: leftValues,
                itemStyle: {
                    color: (params) => {
                        const item = sorted[params.dataIndex]
                        // 如果 pred_label 为 0，认为是异常（红色），否则正常（蓝色）
                        if (item && item.pred_label === 0) {
                            return theme.colorAbnormal
                        }
                        return theme.colorNormal
                    }
                },
                label: {
                    show: true,
                    position: 'right',
                    fontSize: 11,
                    formatter: leftLabelFormatter
                },
                emphasis: { focus: 'series' }
            },
            {
                name: '特征贡献',
                type: 'bar',
                xAxisIndex: 1,
                yAxisIndex: 1,
                data: featVals,
                itemStyle: {

                    color: theme.colorFeature // 右侧使用固定颜色，或者根据需要渐变
                },
                label: {
                    show: false
                },
                emphasis: { focus: 'series' }
            }
        ]
    }
}

function render() {
    const dataList = targetsData.value
    if (!chart || !dataList || dataList.length === 0) {
        if (chart) chart.clear()
        return
    }

    const option = buildOption(dataList)
    chart.setOption(option, true)

    // 点击左侧指标，刷新右侧特征贡献
    chart.off('click')
    chart.on('click', (params) => {
        if (params.seriesName !== '指标影响力') return
        const dataListNow = targetsData.value
        const sorted = [...dataListNow].sort((a, b) => impactScore(b) - impactScore(a))
        const clicked = sorted[params.dataIndex]
        if (!clicked) return
        selectedTarget = clicked.target
        chart.setOption(buildOption(dataListNow), true)
    })
}

onMounted(async () => {
    await nextTick()
    chart = echarts.init(chartRef.value)
    render()

    ro = new ResizeObserver(() => {
        if (chart) chart.resize()
    })
    ro.observe(chartRef.value)
})

watch(() => props.predictions, async () => {
    await nextTick()
    render()
}, { deep: true })

onBeforeUnmount(() => {
    if (ro) ro.disconnect()
    if (chart) {
        chart.dispose()
        chart = null
    }
})
</script>

<style scoped>
.pca-chart {
    width: 100%;
    height: 320px;
    /* 350px区域里留点padding给card */
}
</style>
