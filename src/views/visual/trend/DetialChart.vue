<script setup>
import { ref, watch, onMounted, onUnmounted, shallowRef, nextTick } from 'vue';
import * as d3 from 'd3';
import { chartTooltip } from '@/utils/tooltip_utils/tooltip.js';

const props = defineProps({
    detailData: {
        type: Array,
        default: () => []
    }
});

const wrapperRef = ref(null);
const chartRef = ref(null);
let resizeObserver = null;
let rafId = null;

const containerSize = shallowRef({ width: 0 });

// 动态卡片高度 (数值范围 10~100，UI 上展示为百分比)
const currentCardHeight = ref(70);

const LABEL_COLORS = {
    1: '#409eff',
    0: '#f56c6c',
    2: '#b5bac2'
};
const COOLING_ICON_PATH = "M12 2v20m9-10H3m14.5-6.5L6.5 18.5M18.5 18.5L6.5 5.5";
const PRED_ICON_PATH = "M3 17l6-6 4 4 8-8m-4 0h4v4";

const renderChart = () => {
    // 1. 严格校验传入数据和容器，防止算出 NaN 和找不到 DOM
    if (!chartRef.value || !props.detailData || !Array.isArray(props.detailData) || props.detailData.length === 0) return;

    const { width } = containerSize.value;
    if (width === 0) return;

    const data = props.detailData;
    const margin = { top: 5, right: 10, bottom: 5, left: 5 };
    const innerWidth = width - margin.left - margin.right;

    const cardHeight = currentCardHeight.value;
    const gap = 5;
    const rowStep = cardHeight + gap;

    const isMacroView = cardHeight < 35;
    const totalSvgHeight = data.length * rowStep + margin.top + margin.bottom - gap;

    const leftWidth = isMacroView ? 0 : 260;
    const dividerGap = isMacroView ? 0 : 20;

    const indicatorStartX = leftWidth + dividerGap;
    // 右侧同样预留 dividerGap，保证视觉对称
    const rightWidth = innerWidth - indicatorStartX - 10;

    const fontSize = Math.max(10, Math.min(14, cardHeight * 0.25));

    const svg = d3.select(chartRef.value).selectAll('svg').data([1])
        .join('svg')
        .attr('width', width)
        .attr('height', totalSvgHeight)
        .style('display', 'block');

    const g = svg.selectAll('.main-group').data([1])
        .join('g')
        .attr('class', 'main-group')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const rows = g.selectAll('.plate-row')
        .data(data, d => d.upid)
        .join('g')
        .attr('class', 'plate-row')
        .attr('transform', (d, i) => `translate(0, ${i * rowStep})`);

    // ================= 背景框 (过冷却变蓝) =================
    rows.selectAll('.bg-rect').data(d => [d])
        .join('rect').attr('class', 'bg-rect')
        .attr('width', innerWidth)
        .attr('height', cardHeight)
        .attr('rx', 4)
        .attr('fill', '#ffffff')
        .attr('stroke', d => (d.status_cooling == 0 || d.status_cooling === '0') ? '#409eff' : '#dcdfe6')
        .attr('stroke-width', 1)
        .on('mousemove', (event, d) => {
            // 获取鼠标相对于当前 svg 组的 X 坐标
            const pointerX = d3.pointer(event)[0];
            // 只有鼠标在左侧元数据区域时才显示
            if (pointerX < indicatorStartX) {
            const isCooled = (d.status_cooling == 0 || d.status_cooling === '0');
                const tooltipBorderColor = isCooled ? '#409eff' : '#dcdfe6'; // 蓝色 或 灰色
                const htmlContent = `
                    <div style="line-height: 1.6;">
                        <div><b>tgtlength:</b> ${d.tgtlength !== undefined ? d.tgtlength : '-'}</div>
                        <div><b>tgtthickness:</b> ${d.tgtthickness !== undefined ? d.tgtthickness : '-'}</div>
                        <div><b>tgtwidth:</b> ${d.tgtwidth !== undefined ? d.tgtwidth : '-'}</div>
                        <div><b>toc:</b> ${d.toc || '-'}</div>
                    </div>
                `;
                chartTooltip.show(event, htmlContent, tooltipBorderColor);
            } else {
                // 如果鼠标移动到了右侧条形图的空白背景上，隐藏左侧 tooltip
                chartTooltip.hide();
            }
        })
        .on('mouseout', () => {
            chartTooltip.hide();
        });

    // ================= 左侧元素渲染 =================
    const metaDataFunc = d => isMacroView ? [] : [d];
    const row1Y = cardHeight * 0.35;

    rows.selectAll('.text-upid').data(metaDataFunc)
        .join('text').attr('class', 'text-upid')
        .attr('x', 10).attr('y', row1Y).attr('dy', '0.35em')
        .style('font-size', `${fontSize}px`).style('font-weight', 'bold').style('fill', '#303133')
        .text(d => d.upid);

    rows.selectAll('.rect-platetype').data(metaDataFunc)
        .join('rect').attr('class', 'rect-platetype')
        .attr('x', 116).attr('y', row1Y - fontSize / 2 - 4)
        .attr('width', d => (d.platetype || '').length * (fontSize * 0.55) + 10)
        .attr('height', fontSize + 8).attr('rx', 3)
        .attr('fill', '#fafafa').attr('stroke', '#b3d8ff').attr('stroke-width', 1);

    rows.selectAll('.text-platetype').data(metaDataFunc)
        .join('text').attr('class', 'text-platetype')
        .attr('x', 120).attr('y', row1Y).attr('dy', '0.35em')
        .style('font-size', `${fontSize * 0.9}px`).style('fill', '#909399')
        .text(d => d.platetype);

    rows.each(function (d) {
        const rowG = d3.select(this);
        if (isMacroView) {
            rowG.selectAll('.label-rect').remove();
            rowG.selectAll('.cooling-icon').remove();
            rowG.selectAll('.pred-icon').remove();
            return;
        }
        const row2Y = cardHeight * 0.70;
        const labelStartX = 10;
        const boxSize = Math.max(6, Math.min(12, cardHeight * 0.15));
        const labelsArr = d.labels || [];
        const LABEL_NAMES = ['pa', 'pf', 'pn', 'ps', 'gs'];
        const labelDataWithIndex = labelsArr.map((val, index) => ({ val, index }));

        rowG.selectAll('.label-rect')
            .data(labelDataWithIndex)
            .join('rect')
            .attr('class', 'label-rect')
            .attr('x', (d) => labelStartX + d.index * (boxSize + 4))
            .attr('y', row2Y - boxSize / 2)
            .attr('width', boxSize)
            .attr('height', boxSize)
            .attr('rx', 2)
            .attr('fill', d => LABEL_COLORS[d.val] || '#dcdfe6')
            .on('mousemove', (event, d) => {
                event.stopPropagation(); 
                const labelName = LABEL_NAMES[d.index] || `标签 ${d.index + 1}`;
                const borderColor = LABEL_COLORS[d.val] || '#dcdfe6';
                const htmlContent = `
                    <div style="font-weight: bold; font-size: 13px; color: #333;">
                        ${labelName.toUpperCase()}
                    </div>
                `;
                chartTooltip.show(event, htmlContent, borderColor);
                d3.select(event.currentTarget).attr('stroke', '#333').attr('stroke-width', 1);
            })
            .on('mouseout', (event, d) => {
                chartTooltip.hide();
                d3.select(event.currentTarget).attr('stroke', null);
            });

        const iconScale = Math.max(0.4, Math.min(0.8, cardHeight / 80));
        const isCooled = (d.status_cooling == 0 || d.status_cooling === '0');

        rowG.selectAll('.cooling-icon').data(isCooled ? [d] : [])
            .join('path').attr('class', 'cooling-icon').attr('d', COOLING_ICON_PATH)
            .attr('transform', `translate(90, ${row2Y - 12 * iconScale}) scale(${iconScale})`)
            .attr('stroke', '#409eff').attr('stroke-width', 2).attr('fill', 'none');

        const isAllTwo = labelsArr.length === 5 && labelsArr.every(l => l == 2 || l === '2');
        const predGroup = rowG.selectAll('.pred-group').data(isAllTwo ? [d] : [])
            .join('g')
            .attr('class', 'pred-group')
            // 将整个组平移到原本图标的位置
            .attr('transform', `translate(120, ${row2Y - 12 * iconScale})`);

        // 2. 绘制透明底板 (作为 Hit Area)
        // 这个矩形的大小你可以根据需要调整，24x24 通常是一个合适的点击区域
        predGroup.selectAll('.hit-area').data(d => [d])
            .join('rect')
            .attr('class', 'hit-area')
            // 为了让图标居中在这个 24x24 的区域，我们把矩形稍微往左上偏移一点
            .attr('x', -4)
            .attr('y', -4)
            .attr('width', 30) // 扩大点击宽度
            .attr('height', 30) // 扩大点击高度
            .attr('fill', 'transparent') // 关键：填充透明色
            .style('cursor', 'pointer')  // 鼠标悬浮显示手型
            .on('click', (event, rowData) => {
                // 点击事件现在绑定在这个大方块上
                console.log('点击了预测区域, 对应的 UPID 为:', rowData.upid);
            });

        // 3. 绘制实际的图标路径 (不需要再绑定事件和 cursor 了，因为它在 hit-area 上方，事件会穿透或被其组捕获)
        predGroup.selectAll('.pred-icon-path').data(d => [d])
            .join('path')
            .attr('class', 'pred-icon-path')
            .attr('d', PRED_ICON_PATH)
            .attr('transform', `scale(${iconScale})`) // 只需要缩放即可，位置已经在 Group 层面处理了
            .attr('stroke', '#67c23a')
            .attr('stroke-width', 2)
            .attr('stroke-linecap', 'round')
            .attr('stroke-linejoin', 'round')
            .attr('fill', 'none')
            // 关键：让图标本身的鼠标事件穿透，完全交给底层的透明矩形处理
            .style('pointer-events', 'none');
    });

    rows.selectAll('.divider-line').data(isMacroView ? [] : d => [d])
        .join('line').attr('class', 'divider-line')
        .attr('x1', leftWidth + dividerGap / 2).attr('y1', 5)
        .attr('x2', leftWidth + dividerGap / 2).attr('y2', cardHeight - 5)
        .attr('stroke', '#dcdfe6').attr('stroke-width', 1).attr('stroke-dasharray', '4, 4');

    // ================= 右侧指标渲染区 (修复占位及颜色逻辑) =================
    rows.each(function (d) {
        const rowG = d3.select(this);
        const diagnosis = d.diagnosis || [];
        const numIndicators = diagnosis.length;
        if (numIndicators === 0) return;

        const barStep = rightWidth / numIndicators;
        const barWidth = Math.max(1, barStep - 0.5);
        const maxBarH = cardHeight * 0.8;
        const minBarH = Math.max(2, cardHeight * 0.2);

        // 判断当前块是否为 未冷却
        const isUncooled = (d.status_cooling == 1 || d.status_cooling === '1');

        const COLOR_NORMAL = '#e4e7ed';
        const COLOR_WARN_HIGH = '#f56c6c';
        const COLOR_ERROR_HIGH = '#c82333';
        const COLOR_WARN_LOW = '#409eff';
        const COLOR_ERROR_LOW = '#0056b3';
        const COLOR_IGNORED = '#f0f2f5';

        const getBarColor = (diag) => {
            const val = diag.orig_v;
            if (val > diag.s_ext_orig_u) return COLOR_ERROR_HIGH; // 严重超上限
            if (val < diag.s_ext_orig_l) return COLOR_ERROR_LOW;  // 严重超下限
            if (val > diag.ext_orig_u) return COLOR_WARN_HIGH;    // 一般超上限
            if (val < diag.ext_orig_l) return COLOR_WARN_LOW;     // 一般超下限
            return COLOR_NORMAL;                                  // 正常范围
        };

        rowG.selectAll('.indicator-bar')
            .data(diagnosis)
            .join('rect')
            .attr('class', 'indicator-bar')
            .attr('x', (diag, i) => indicatorStartX + i * barStep)
            .attr('width', barWidth)
            .attr('height', (diag, i) => {
                if (isUncooled && i >= numIndicators - 19) return minBarH;
                const color = getBarColor(diag);
                return color !== COLOR_NORMAL ? maxBarH : minBarH;
            })
            .attr('y', (diag, i) => {
                if (isUncooled && i >= numIndicators - 19) return (cardHeight - minBarH) / 2;
                const isOut = diag.orig_v > diag.ext_orig_u || diag.orig_v < diag.ext_orig_l;
                return isOut ? (cardHeight - maxBarH) / 2 : (cardHeight - minBarH) / 2;
            })
            .attr('fill', (diag, i) => {
                // 如果未冷却 且 是最后 19 个指标，强制填充基础灰色 (不再报红/黄)
                if (isUncooled && i >= numIndicators - 19) return COLOR_IGNORED;
                return getBarColor(diag);
            })
            .on('mouseover', (event, diag) => {
                const i = diagnosis.indexOf(diag);
                if (isUncooled && i >= numIndicators - 19) return;

                d3.select(event.currentTarget).attr('fill', '#333');
            })
            .on('mousemove', (event, diag) => {
                const i = diagnosis.indexOf(diag);
                if (isUncooled && i >= numIndicators - 19) return;
                const borderColor = getBarColor(diag);
                const htmlContent = `
                    <div style="line-height: 1.6; min-width: 150px;">
                        <div style="font-weight: bold; border-bottom: 1px solid #eee; margin-bottom: 6px; padding-bottom: 4px;">
                            ${diag.name}
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span><b>orig_v:</b></span> <span>${diag.orig_v}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span><b>orig_l/orig_u:</b></span> <span style="margin-left: 12px;">${diag.orig_l} ~ ${diag.orig_u}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span><b>ext_orig_l/ext_orig_u:</b></span> <span style="margin-left: 12px;">${diag.ext_orig_l} ~ ${diag.ext_orig_u}</span>
                        </div>
                    </div>
                `;
                chartTooltip.show(event, htmlContent, borderColor === COLOR_NORMAL ? '#dcdfe6' : borderColor);
            })
            .on('mouseout', (event, diag) => {
                chartTooltip.hide();
                const i = diagnosis.indexOf(diag);
                if (isUncooled && i >= numIndicators - 19) return;
                d3.select(event.currentTarget).attr('fill', getBarColor(diag));
            });
    });
};

const handleSliderInput = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
        renderChart();
    });
};

// 关键修复：加入 await nextTick()
watch(() => props.detailData, async () => {
    await nextTick();
    if (chartRef.value) {
        renderChart();
    }
}, { deep: true });

onMounted(() => {
    resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            const { width } = entry.contentRect;
            if (width !== containerSize.value.width) {
                containerSize.value = { width };
                renderChart();
            }
        }
    });

    if (wrapperRef.value) {
        resizeObserver.observe(wrapperRef.value);
    }
});

onUnmounted(() => {
    if (resizeObserver && wrapperRef.value) {
        resizeObserver.unobserve(wrapperRef.value);
    }
    if (rafId) cancelAnimationFrame(rafId);
});
</script>

<template>
    <div class="component-container">
        <div key="toolbar" class="toolbar" v-if="detailData && detailData.length > 0">
            <span class="toolbar-label">高度</span>
            <input type="range" class="density-slider" v-model.number="currentCardHeight" min="10" max="100" step="1"
                @input="handleSliderInput">
            <span class="toolbar-value">{{ currentCardHeight }}%</span>
        </div>

        <div key="chart-wrapper" ref="wrapperRef" class="detail-chart-wrapper">
            <div ref="chartRef" class="d3-container"></div>
        </div>
    </div>
</template>

<style scoped>
.component-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}

/* ================= 顶部控制区样式 ================= */
.toolbar {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    font-size: 13px;
    color: #606266;
    background: transparent;
    flex-shrink: 0;
}

.toolbar-label {
    margin-right: 12px;
    font-weight: bold;
    font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
}

.density-slider {
    flex: 1;
    max-width: 200px;
    margin-right: 12px;
    cursor: ew-resize;
    accent-color: #c0c4cc;
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    /* 强制背景透明，防止黑色块 */
    height: 6px;
    /* 设定统一的轨道高度 */
    border-radius: 3px;
}

.density-slider:focus {
    outline: none;
}

.density-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;

    /* 👇 核心修改：滑块变成纯白 👇 */
    background: #ffffff;

    /* 👇 核心修改：加上清晰、柔和的灰色边框 (#dcdfe6) 👇 */
    border: 1px solid #dcdfe6;

    cursor: grab;
    /* 垂直居中滑块：(轨道高度6 - 滑块高度16) / 2 = -5 */
    margin-top: -5px;

    /* 淡淡的阴影，增加一点立体感，防止在纯白背景下隐形 */
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: transform 0.1s ease, background-color 0.2s, border-color 0.2s;
}

/* 悬浮和按下时的视觉反馈 */
.density-slider::-webkit-slider-thumb:hover {
    transform: scale(1.05);
    /* 稍微放大一点点 */
    border-color: #c0c4cc;
    /* 边框稍微加深一点 */
}

.density-slider::-webkit-slider-thumb:active {
    cursor: grabbing;
    background: #f5f7fa;
    /* 按下时滑块变成极浅的灰色 */
    border-color: #409eff;
    /* 边框变成 Element 蓝色，提示正在交互 */
}

/* 2. 定制轨道 (滑块底部的那条线) */
.density-slider::-webkit-slider-runnable-track {
    width: 100%;
    height: 6px;
    cursor: pointer;

    /* 👇 修改：轨道也换成极浅的灰色 (#f0f2f5) 👇 */
    background: #f0f2f5;

    /* 可选：给轨道也加上淡淡的边框，使其更清晰 */
    border: 1px solid #e4e7ed;
    border-radius: 3px;
}

.toolbar-value {
    width: 40px;
    text-align: left;
    font-weight: bold;
    font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
}

/* ================= 核心图表区样式 ================= */
.detail-chart-wrapper {
    flex: 1;
    width: 100%;
    height: 0;
    min-height: 0;
    background: transparent;
    overflow-y: auto;
    scroll-behavior: auto;

    /* 隐藏滚动条 */
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.detail-chart-wrapper::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
}

.d3-container {
    width: 100%;
}
</style>