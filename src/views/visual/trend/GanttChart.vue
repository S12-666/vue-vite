<script setup>
import { ref, onMounted, watch, computed, nextTick, onBeforeUnmount } from 'vue';
import * as d3 from 'd3';
import { chartTooltip } from '@/utils/tooltip_utils/tooltip.js';

const props = defineProps({
    rawGroupData: { type: Object, default: () => ({}) }
});

const chartRef = ref(null);
// 滚动偏移量（只有下层需要滚动）
const bottomOffset = ref(0);

// 1. 数据解析与聚合
const parsedData = computed(() => {
    if (!props.rawGroupData) return { timeData: [], uniqueCapData: [], globalRanges: {}, totalCount: 0 };

    // --- Step 1: 原始数据清洗 ---
    let rawArray = Object.entries(props.rawGroupData).map(([key, value]) => {
        const count = Number(value.plate_nums ?? value.playe_nums ?? 0);
        // 假设后端返回了 abnormal_rate (0~1)，计算异常数量
        const abRate = Number(value.abnormal_rate ?? 0);
        const abCount = Math.round(count * abRate);

        return {
            id: key,
            ...value,
            count: count,
            abnormalCount: abCount,
            thickMin: Number(value.thick_range?.[0]) || 0,
            thickMax: Number(value.thick_range?.[1]) || 0,
            widthMin: Number(value.width_range?.[0]) || 0,
            widthMax: Number(value.width_range?.[1]) || 0,
            lenMin: Number(value.length_range?.[0]) || 0, // 新增：长度解析
            lenMax: Number(value.length_range?.[1]) || 0, // 新增：长度解析
            platetype: value.platetype || 'Unknown'
        };
    });

    // --- Step 2: 上层数据 (按时间排序) ---
    const timeData = [...rawArray].sort((a, b) => Number(a.id) - Number(b.id));
    let accumulator = 0;
    timeData.forEach(d => {
        d.x0_cumulative = accumulator;
        accumulator += d.count;
        d.x1_cumulative = accumulator;
    });
    const totalCount = accumulator;

    // --- Step 3: 下层数据聚合 (按钢种 Group By) ---
    const groupedMap = new Map();

    rawArray.forEach(d => {
        if (!groupedMap.has(d.platetype)) {
            groupedMap.set(d.platetype, {
                platetype: d.platetype,
                totalCount: 0,
                totalAbnormal: 0,
                // 初始化极值，反向设置以便 update
                thickMin: Infinity, thickMax: -Infinity,
                widthMin: Infinity, widthMax: -Infinity,
                lenMin: Infinity, lenMax: -Infinity, // 新增：长度极值初始化
                batchIds: []
            });
        }
        const group = groupedMap.get(d.platetype);
        group.totalCount += d.count;
        group.totalAbnormal += d.abnormalCount;
        group.thickMin = Math.min(group.thickMin, d.thickMin);
        group.thickMax = Math.max(group.thickMax, d.thickMax);
        group.widthMin = Math.min(group.widthMin, d.widthMin);
        group.widthMax = Math.max(group.widthMax, d.widthMax);
        group.lenMin = Math.min(group.lenMin, d.lenMin); // 新增：长度极值比较
        group.lenMax = Math.max(group.lenMax, d.lenMax); // 新增：长度极值比较
        group.batchIds.push(d.id);
    });

    // 转数组并按总产能排序
    const uniqueCapData = Array.from(groupedMap.values())
        .map(d => ({
            ...d,
            // 计算综合异常率
            abnormalRate: d.totalCount > 0 ? (d.totalAbnormal / d.totalCount) : 0
        }))
        .sort((a, b) => b.totalCount - a.totalCount);

    // --- Step 4: 全局范围 ---
    const globalRanges = {
        tMin: d3.min(rawArray, d => d.thickMin) || 0,
        tMax: d3.max(rawArray, d => d.thickMax) || 100,
        wMin: d3.min(rawArray, d => d.widthMin) || 0,
        wMax: d3.max(rawArray, d => d.widthMax) || 3000,
        lMax: d3.max(rawArray, d => d.lenMax) || 100, // 新增：全局最大长度（用于进度条比例）
    };

    return { timeData, uniqueCapData, totalCount, globalRanges };
});

// 2. 核心绘图
const drawChart = () => {
    const { timeData, uniqueCapData, totalCount, globalRanges } = parsedData.value;
    const container = chartRef.value;
    d3.select(container).selectAll("svg").remove();

    if (!timeData.length || !container || container.clientWidth === 0) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight || 350;
    const margin = { top: 0, right: 0, bottom: 0, left: 0 };

    const topHeight = 30;
    const bottomHeight = 105; // 【修改】将高度从 100 提升到 120，为长度 L 腾出空间
    const gap = 80;

    const CARD_WIDTH = 90;
    const CARD_GAP = 15;
    const bottomContentWidth = uniqueCapData.length * (CARD_WIDTH + CARD_GAP);

    const svg = d3.select(container).append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight)
        .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`);

    // ClipPath
    const defs = svg.append("defs");
    defs.append("clipPath").attr("id", "bottom-clip").append("rect")
        .attr("x", 0).attr("y", -20).attr("width", containerWidth).attr("height", bottomHeight + 40);

    const mainGroup = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

    const colorScale = d3.scaleOrdinal()
        .domain(uniqueCapData.map(d => d.platetype))
        .range(d3.schemeTableau10);

    // ==========================================
    // 1. 上层 (Gantt - 弹性自适应)
    // ==========================================
    const availableWidth = containerWidth - margin.left - margin.right;
    const BASE_UNIT_WIDTH = 2;
    const totalNaturalWidth = totalCount * BASE_UNIT_WIDTH;

    let adaptiveGap = 0;
    let widthScaleFactor = 1;
    const count = timeData.length;

    if (totalNaturalWidth < availableWidth && count > 1) {
        widthScaleFactor = 1;
        adaptiveGap = (availableWidth - totalNaturalWidth) / (count - 1);
    } else {
        adaptiveGap = 0;
        widthScaleFactor = (totalNaturalWidth > 0) ? (availableWidth / totalNaturalWidth) : 1;
    }

    let currentX = 0;
    const layoutData = timeData.map(d => {
        const w = d.count * BASE_UNIT_WIDTH * widthScaleFactor;
        const x = currentX;
        currentX += w + adaptiveGap;
        return {
            ...d,
            _drawX: x,
            _drawW: w,
            _centerX: x + w / 2
        };
    });

    const topGroup = mainGroup.append("g").attr("class", "top-layer");
    const topCoords = {};

    topGroup.selectAll("rect")
        .data(layoutData)
        .enter()
        .append("rect")
        .attr("id", d => `top-rect-${d.id}`)
        .attr("x", d => d._drawX)
        .attr("y", 0)
        .attr("width", d => Math.max(d._drawW, 1))
        .attr("height", topHeight)
        .attr("rx", 0)
        .attr("fill", d => colorScale(d.platetype))
        .attr("stroke", adaptiveGap < 1 ? "#fff" : "none")
        .attr("stroke-width", 0.5)
        .each(function (d) {
            topCoords[d.id] = { x: d._centerX, y: topHeight };
        })
        .on("mouseover", function (event, d) {
            d3.select(this).attr("stroke", "#333").attr("stroke-width", 1);
            d3.select(`#link-${d.id}`).attr("stroke-opacity", 0.9).attr("stroke-width", 2);
            const safeId = d.platetype.replace(/[^a-zA-Z0-9]/g, '_');
            d3.select(`#bottom-${safeId}`).select("rect.bg").attr("stroke", "#409EFF").attr("stroke-width", 2);

            const startTime = d.date_range?.[0] || '未知时间';
            const endTime = d.date_range?.[1] || '未知时间';
            const rate = ((d.abnormal_rate || 0) * 100).toFixed(1);
            const nums = d.plate_nums || 0;

            const htmlContent = `
                <div style="font-weight: bold; font-size: 13px; margin-bottom: 6px; color: #303133;">
                    platetype: ${d.platetype}
                </div>
                <div style="margin-bottom: 4px; color: #606266;">
                    <span style="display:inline-block; width: 50px;">Range:</span> ${startTime}
                </div>
                <div style="margin-bottom: 4px; color: #606266;">
                    <span style="display:inline-block; width: 50px;"></span>- ${endTime}
                </div>
                <div style="margin-bottom: 4px; color: #606266;">
                    <span style="display:inline-block; width: 50px;">plates:</span> ${nums}
                </div>
                <div style="color: ${rate > 0 ? '#F56C6C' : '#67C23A'};">
                    <span style="display:inline-block; width: 50px;">异常率:</span> ${rate}%
                </div>
            `;
            chartTooltip.show(event, htmlContent, colorScale(d.platetype));
        })
        .on("mousemove", function (event, d) {
            const startTime = d.date_range?.[0] || '未知时间';
            const endTime = d.date_range?.[1] || '未知时间';
            const rate = ((d.abnormal_rate || 0) * 100).toFixed(1);
            const htmlContent = `
                <div style="font-weight: bold; font-size: 13px; margin-bottom: 6px; color: #303133;">
                    platetype: ${d.platetype}
                </div>
                <div style="margin-bottom: 4px; color: #606266;">
                    <span style="display:inline-block; width: 50px;">range:</span> ${startTime}
                </div>
                <div style="margin-bottom: 4px; color: #606266;">
                    <span style="display:inline-block; width: 50px;"></span>- ${endTime}
                </div>
                <div style="margin-bottom: 4px; color: #606266;">
                    <span style="display:inline-block; width: 50px;">plates:</span> ${d.plate_nums || 0}
                </div>
                <div style="color: ${rate > 0 ? '#F56C6C' : '#67C23A'};">
                    <span style="display:inline-block; width: 50px;">abnormal:</span> ${rate}%
                </div>
            `;
            chartTooltip.show(event, htmlContent, colorScale(d.platetype));
        })
        .on("mouseout", function (event, d) {
            d3.select(this).attr("stroke", adaptiveGap < 1 ? "#fff" : "none").attr("stroke-width", 0.5);
            d3.select(`#link-${d.id}`).attr("stroke-opacity", 0.7).attr("stroke-width", 1.1);
            const safeId = d.platetype.replace(/[^a-zA-Z0-9]/g, '_');
            d3.select(`#bottom-${safeId}`).select("rect.bg").attr("stroke", "#dcdfe6").attr("stroke-width", 1);
            chartTooltip.hide();
        });

    // ==========================================
    // 2. 下层 (规格卡片 - 聚合视图)
    // ==========================================
    const bottomWrapperY = topHeight + gap;
    const bottomClipper = mainGroup.append("g")
        .attr("transform", `translate(0, ${bottomWrapperY})`)
        .attr("clip-path", "url(#bottom-clip)");

    const bottomGroup = bottomClipper.append("g").attr("class", "bottom-content");
    const bottomCoordsOrigin = {};

    const cardGroups = bottomGroup.selectAll(".card")
        .data(uniqueCapData)
        .enter()
        .append("g")
        .attr("class", "card")
        .attr("id", d => `bottom-${d.platetype.replace(/[^a-zA-Z0-9]/g, '_')}`)
        .attr("transform", (d, i) => {
            const x = i * (CARD_WIDTH + CARD_GAP);
            bottomCoordsOrigin[d.platetype] = { x: x + CARD_WIDTH / 2, y: 0 };
            return `translate(${x}, 0)`;
        });

    cardGroups
        .style("cursor", "pointer")
        .on("mouseover", function (event, d) {
            d3.select(this).select("rect.bg").attr("stroke", "#409EFF").attr("stroke-width", 2);
            if (d.batchIds && d.batchIds.length > 0) {
                d.batchIds.forEach(batchId => {
                    d3.select(`#link-${batchId}`)
                        .attr("stroke-opacity", 0.9)
                        .attr("stroke-width", 2);
                    d3.select(`#top-rect-${batchId}`)
                        .attr("stroke", "#333")
                        .attr("stroke-width", 1);
                });
            }
            const rate = ((d.abnormalRate || 0) * 100).toFixed(1);
            const htmlContent = `
            <div style="font-weight: bold; font-size: 13px; margin-bottom: 6px; color: #303133;">
                ${d.platetype}
            </div>
            <div style="color: ${rate > 0 ? '#F56C6C' : '#67C23A'};">
                <span style="display:inline-block; width: 50px;">异常率:</span> ${rate}%
            </div>
        `;
            chartTooltip.show(event, htmlContent, colorScale(d.platetype));
        })
        .on("mousemove", function (event, d) {
            const rate = ((d.abnormalRate || 0) * 100).toFixed(1);
            const htmlContent = `
            <div style="font-weight: bold; font-size: 13px; margin-bottom: 6px; color: #303133;">
                ${d.platetype}
            </div>
            <div style="color: ${rate > 0 ? '#F56C6C' : '#67C23A'};">
                <span style="display:inline-block; width: 50px;">异常率:</span> ${rate}%
            </div>
        `;
            chartTooltip.show(event, htmlContent, colorScale(d.platetype));
        })
        .on("mouseout", function (event, d) {
            d3.select(this).select("rect.bg").attr("stroke", "#dcdfe6").attr("stroke-width", 1);
            if (d.batchIds && d.batchIds.length > 0) {
                d.batchIds.forEach(batchId => {
                    d3.select(`#link-${batchId}`)
                        .attr("stroke-opacity", 0.7)
                        .attr("stroke-width", 1.1);
                    d3.select(`#top-rect-${batchId}`)
                        .attr("stroke", adaptiveGap < 1 ? "#fff" : "none")
                        .attr("stroke-width", 0.5);
                });
            }
            chartTooltip.hide();
        })
        .on("click", function (event, d) {
            console.log("点击了卡片，准备下钻或弹出详情:", d.platetype);
        })
        .on("wheel", function (e) {
            e.preventDefault();
            bottomOffset.value -= e.deltaY;
            updateVisuals();
        });

    // 卡片背景
    cardGroups.append("rect").attr("class", "bg")
        .attr("width", CARD_WIDTH).attr("height", bottomHeight)
        .attr("fill", "#fff").attr("rx", 4).attr("stroke", "#dcdfe6");

    // 顶部色条
    cardGroups.append("rect").attr("width", CARD_WIDTH).attr("height", 4).attr("fill", d => colorScale(d.platetype));

    // 文字：钢种名称
    cardGroups.append("text")
        .attr("x", 4)
        .attr("y", 18)
        .attr("text-anchor", "start")
        .text(d => d.platetype.length > 9 ? d.platetype.substring(0, 9) + '...' : d.platetype)
        .attr("fill", "#303133")
        .style("font-size", "10px")
        .style("font-weight", "bold")
        .append("title")
        .text(d => d.platetype);

    // 文字：总数量
    cardGroups.append("text")
        .attr("x", 4)
        .attr("y", 30)
        .attr("text-anchor", "start")
        .text(d => `${d.totalCount}`)
        .attr("fill", "#909399")
        .style("font-size", "9px");

    // === 环形图 (Pie Chart for Abnormal Rate) ===
    const pieGenerator = d3.pie().sort(null).value(d => d);
    const arcGenerator = d3.arc().innerRadius(5).outerRadius(9);

    cardGroups.each(function (d) {
        const gItem = d3.select(this);
        const pieData = pieGenerator([d.abnormalRate, 1 - d.abnormalRate]);

        const pieGroup = gItem.append("g")
            .attr("transform", `translate(${CARD_WIDTH - 12}, 18)`);

        pieGroup.selectAll("path")
            .data(pieData)
            .enter()
            .append("path")
            .attr("d", arcGenerator)
            .attr("fill", (slice, i) => {
                return i === 0 ? "#F56C6C" : "#E4E7ED";
            })
            .append("title")
            .text((slice, i) => i === 0 ? `异常率: ${(d.abnormalRate * 100).toFixed(1)}%` : "正常");
    });

    // === 范围可视化 (树状分支 + 子弹图/进度条) ===
    cardGroups.each(function (d) {
        const gItem = d3.select(this);

        const startY = 48; // 第一条（T）的 Y 坐标
        const rowGap = 22; // 每行的间距
        const barX = 18;   // 进度条的起始 X 坐标
        const barW = CARD_WIDTH - 24; // 进度条宽度
        const barH = 14;   // 进度条高度

        const lineTopY = startY - (barH / 2) - 3; 
        const lineBottomY = (startY + rowGap * 2) + (barH / 2) + 3; 
        const lineX = barX - 1; 

        // 只画一根笔直的线
        const pathData = `M ${lineX} ${lineTopY} L ${lineX} ${lineBottomY}`;
        gItem.append("path")
            .attr("d", pathData)
            .attr("stroke", "#909399") // 树状分支线颜色
            .attr("stroke-width", 1.5)
            .attr("fill", "none");

        // 配置 T, W, L 三个指标的数据与样式
        const metrics = [
            { label: 'T', min: d.thickMin, max: d.thickMax, gMax: globalRanges.tMax, unit: 'mm', y: startY },
            { label: 'W', min: d.widthMin, max: d.widthMax, gMax: globalRanges.wMax, unit: 'm', y: startY + rowGap },
            { label: 'L', min: d.lenMin, max: d.lenMax, gMax: globalRanges.lMax, unit: 'm', y: startY + rowGap * 2 }
        ];

        metrics.forEach(m => {
            // 取该钢种范围的平均值作为展示值
            const val = (m.min + m.max) / 2;
            const barY = m.y - barH / 2;

            // 1. 左侧文本标签 (T, W, L)
            gItem.append("text")
                .attr("x", 13)
                .attr("y", m.y + 4) // 微调垂直居中
                .attr("text-anchor", "end")
                .text(m.label)
                .attr("fill", "#909399") // 橙黄色标签
                .style("font-size", "10px")
                .style("font-weight", "bold");

            // 2. 进度条背景框
            gItem.append("rect")
                .attr("x", barX)
                .attr("y", barY)
                .attr("width", barW)
                .attr("height", barH)
                .attr("fill", "#ffffff")
                .attr("stroke", "#DCDFE6") // 浅灰色边框
                .attr("stroke-width", 1);

            // 3. 内部进度色块
            const ratio = m.gMax > 0 ? (val / m.gMax) : 0;
            const fillWidth = Math.min(ratio * barW, barW); // 防止超出边框
            gItem.append("rect")
                .attr("x", barX)
                .attr("y", barY)
                .attr("width", fillWidth)
                .attr("height", barH)
                .attr("fill", "#D4E4F7"); // 浅蓝色进度条

            // 4. 居中显示的数值和单位
            let displayVal = val.toFixed(2);
            gItem.append("text")
                .attr("x", barX + barW / 2)
                .attr("y", m.y + 3) // 微调对齐进度条中间
                .attr("text-anchor", "middle")
                .attr("fill", "#606266")
                .style("font-size", "9px")
                .text(`${displayVal} ${m.unit}`);
        });
    });

    // ==========================================
    // 3. 动态连线 (Many-to-One)
    // ==========================================
    const linkGroup = mainGroup.append("g").attr("class", "link-layer").lower();
    linkGroup.attr("clip-path", "url(#bottom-clip)");

    const updateVisuals = () => {
        const maxScroll = Math.max(0, bottomContentWidth - availableWidth);
        bottomOffset.value = Math.max(-maxScroll, Math.min(0, bottomOffset.value));
        bottomGroup.attr("transform", `translate(${bottomOffset.value}, 0)`);

        const links = linkGroup.selectAll("path.dynamic-link").data(layoutData);

        const getPath = (d) => {
            const start = topCoords[d.id];
            const endOrigin = bottomCoordsOrigin[d.platetype];

            if (!start || !endOrigin) return "";

            const sx = start.x;
            const sy = start.y;
            const ex = endOrigin.x + bottomOffset.value;
            const ey = topHeight + gap;

            const path = d3.path();
            path.moveTo(sx, sy);
            path.bezierCurveTo(sx, sy + gap * 0.6, ex, ey - gap * 0.6, ex, ey);
            return path.toString();
        };

        const linksEnter = links.enter().append("path")
            .attr("class", "dynamic-link")
            .attr("id", d => `link-${d.id}`)
            .attr("fill", "none")
            .attr("stroke", d => colorScale(d.platetype))
            .attr("stroke-width", 1.1)
            .attr("stroke-opacity", 0.7);

        links.merge(linksEnter).attr("d", getPath);
        links.exit().remove();
    };

    updateVisuals();

    // ==========================================
    // 4. 事件监听 (仅下层滚动)
    // ==========================================
    bottomClipper.append("rect")
        .attr("class", "scroll-bg")
        .attr("width", containerWidth)
        .attr("height", bottomHeight)
        .attr("fill", "transparent")
        .lower()
        .on("wheel", (e) => {
            e.preventDefault();
            bottomOffset.value -= e.deltaY;
            updateVisuals();
        });

    mainGroup.append("rect")
        .attr("y", topHeight)
        .attr("width", containerWidth)
        .attr("height", gap)
        .attr("fill", "transparent")
        .on("wheel", (e) => {
            e.preventDefault();
            bottomOffset.value -= e.deltaY;
            updateVisuals();
        });
};

watch(() => props.rawGroupData, () => {
    bottomOffset.value = 0;
    nextTick(() => drawChart());
}, { deep: true });

onMounted(() => {
    setTimeout(() => drawChart(), 100);
    window.addEventListener('resize', drawChart);
});
onBeforeUnmount(() => {
    window.removeEventListener('resize', drawChart);
});
</script>

<template>
    <div class="chart-container" ref="chartRef"></div>
</template>

<style scoped>
.chart-container {
    width: 100%;
    height: 100%;
    background: transparent;
    overflow: hidden;
    position: relative;
}
</style>