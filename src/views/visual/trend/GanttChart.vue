<script setup>
import { ref, onMounted, watch, computed, nextTick, onBeforeUnmount } from 'vue';
import * as d3 from 'd3';

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
    const bottomHeight = 100;
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
        })
        .on("mouseout", function (event, d) {
            d3.select(this).attr("stroke", adaptiveGap < 1 ? "#fff" : "none").attr("stroke-width", 0.5);
            d3.select(`#link-${d.id}`).attr("stroke-opacity", 0.2).attr("stroke-width", 1);
            const safeId = d.platetype.replace(/[^a-zA-Z0-9]/g, '_');
            d3.select(`#bottom-${safeId}`).select("rect.bg").attr("stroke", "#dcdfe6").attr("stroke-width", 1);
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

    // 卡片背景
    cardGroups.append("rect").attr("class", "bg")
        .attr("width", CARD_WIDTH).attr("height", bottomHeight)
        .attr("fill", "#fff").attr("rx", 4).attr("stroke", "#dcdfe6");

    // 顶部色条
    cardGroups.append("rect").attr("width", CARD_WIDTH).attr("height", 4).attr("fill", d => colorScale(d.platetype));

    // 文字：钢种名称
    cardGroups.append("text")
        .attr("x", 8)
        .attr("y", 20)
        .attr("text-anchor", "start")
        .text(d => d.platetype)
        .attr("fill", "#303133")
        .style("font-size", "10px")
        .style("font-weight", "bold");

    // 文字：总数量
    cardGroups.append("text")
        .attr("x", 8)
        .attr("y", 32)
        .attr("text-anchor", "start")
        .text(d => `${d.totalCount}块`)
        .attr("fill", "#909399")
        .style("font-size", "9px");

    // === 环形图 (Pie Chart for Abnormal Rate) ===
    const pieGenerator = d3.pie().sort(null).value(d => d);
    const arcGenerator = d3.arc().innerRadius(5).outerRadius(9);

    cardGroups.each(function (d) {
        const gItem = d3.select(this);

        const pieData = pieGenerator([d.abnormalRate, 1 - d.abnormalRate]);

        const pieGroup = gItem.append("g")
            .attr("transform", `translate(${CARD_WIDTH - 15}, 20)`);

        pieGroup.selectAll("path")
            .data(pieData)
            .enter()
            .append("path")
            .attr("d", arcGenerator)
            .attr("fill", (slice, i) => { // 这里 i 是 pieData 的索引
                return i === 0 ? "#F56C6C" : "#E4E7ED";
            })
            .append("title")
            // 【关键修复】这里的 text 回调也需要接收 i
            .text((slice, i) => i === 0 ? `异常率: ${(d.abnormalRate * 100).toFixed(1)}%` : "正常");
    });

    // === 范围可视化 (Box Plot) ===
    const rangeScaleX = d3.scaleLinear().domain([0, 1]).range([10, CARD_WIDTH - 10]);
    const safeNorm = (val, min, max) => (max === min) ? 0.5 : (val - min) / (max - min);

    cardGroups.each(function (d) {
        const gItem = d3.select(this);
        // T
        gItem.append("text").attr("x", 5).attr("y", 50).text("T").attr("fill", "#909399").style("font-size", "8px");
        gItem.append("line").attr("x1", 15).attr("x2", CARD_WIDTH - 5).attr("y1", 48).attr("y2", 48).attr("stroke", "#ebeef5");
        const tx1 = rangeScaleX(safeNorm(d.thickMin, globalRanges.tMin, globalRanges.tMax));
        const tx2 = rangeScaleX(safeNorm(d.thickMax, globalRanges.tMin, globalRanges.tMax));
        gItem.append("rect").attr("x", tx1).attr("y", 46).attr("width", Math.max(tx2 - tx1, 2)).attr("height", 4).attr("fill", "#4facfe");
        gItem.append("text").attr("x", CARD_WIDTH / 2).attr("y", 60).text(`${d.thickMin}-${d.thickMax}`).attr("text-anchor", "middle").attr("fill", "#4facfe").style("font-size", "8px");

        // W
        gItem.append("text").attr("x", 5).attr("y", 80).text("W").attr("fill", "#909399").style("font-size", "8px");
        gItem.append("line").attr("x1", 15).attr("x2", CARD_WIDTH - 5).attr("y1", 78).attr("y2", 78).attr("stroke", "#ebeef5");
        const wx1 = rangeScaleX(safeNorm(d.widthMin, globalRanges.wMin, globalRanges.wMax));
        const wx2 = rangeScaleX(safeNorm(d.widthMax, globalRanges.wMin, globalRanges.wMax));
        gItem.append("rect").attr("x", wx1).attr("y", 76).attr("width", Math.max(wx2 - wx1, 2)).attr("height", 4).attr("fill", "#67c23a");
        gItem.append("text").attr("x", CARD_WIDTH / 2).attr("y", 90).text(`${d.widthMin}-${d.widthMax}`).attr("text-anchor", "middle").attr("fill", "#67c23a").style("font-size", "8px");
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
            .attr("stroke-width", 1)
            .attr("stroke-opacity", 0.15);

        links.merge(linksEnter).attr("d", getPath);
        links.exit().remove();
    };

    updateVisuals();

    // ==========================================
    // 4. 事件监听 (仅下层滚动)
    // ==========================================
    bottomClipper.append("rect")
        .attr("width", containerWidth)
        .attr("height", bottomHeight)
        .attr("fill", "transparent")
        .style("cursor", "grab")
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