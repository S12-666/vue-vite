<script setup>
import { ref, onMounted, watch, computed, nextTick, onBeforeUnmount } from 'vue';
import * as d3 from 'd3';

const props = defineProps({
    rawGroupData: { type: Object, default: () => ({}) }
});

const chartRef = ref(null);

// 滚动偏移量（只有下层需要滚动）
const bottomOffset = ref(0);

// 1. 数据解析
const parsedData = computed(() => {
    if (!props.rawGroupData) return { timeData: [], capData: [], globalRanges: {}, totalCount: 0 };

    let rawArray = Object.entries(props.rawGroupData).map(([key, value]) => ({
        id: key,
        ...value,
        // 兼容取值，防止 null
        count: Number(value.plate_nums ?? value.playe_nums ?? 0),
        thickMin: Number(value.thick_range?.[0]) || 0,
        thickMax: Number(value.thick_range?.[1]) || 0,
        widthMin: Number(value.width_range?.[0]) || 0,
        widthMax: Number(value.width_range?.[1]) || 0,
        startTime: value.date_range?.[0] || '',
        platetype: value.platetype || 'Unknown'
    }));

    const globalRanges = {
        tMin: d3.min(rawArray, d => d.thickMin) || 0,
        tMax: d3.max(rawArray, d => d.thickMax) || 100,
        wMin: d3.min(rawArray, d => d.widthMin) || 0,
        wMax: d3.max(rawArray, d => d.widthMax) || 3000,
    };

    // 上层：按时间排序
    const timeData = [...rawArray].sort((a, b) => Number(a.id) - Number(b.id));
    let accumulator = 0;
    timeData.forEach(d => {
        d.x0_cumulative = accumulator;
        accumulator += d.count;
        d.x1_cumulative = accumulator;
    });
    const totalCount = accumulator;

    // 下层：按产能排序
    const capData = [...rawArray].sort((a, b) => b.count - a.count);

    return { timeData, capData, totalCount, globalRanges };
});

// 2. 核心绘图
const drawChart = () => {
    const { timeData, capData, totalCount, globalRanges } = parsedData.value;
    const container = chartRef.value;
    // 清理旧图
    d3.select(container).selectAll("svg").remove();

    if (!timeData.length || !container || container.clientWidth === 0) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight || 350;
    const margin = { top: 0, right: 0, bottom: 0, left: 0 };

    const topHeight = 30;
    const bottomHeight = 100;
    const gap = 80; // 中间连线区域高度

    // 下层布局参数
    const CARD_WIDTH = 80;
    const CARD_GAP = 10;
    const bottomContentWidth = capData.length * (CARD_WIDTH + CARD_GAP);

    const svg = d3.select(container).append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight)
        .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`);

    // 裁剪区域 (防止下层滚动溢出)
    const defs = svg.append("defs");
    defs.append("clipPath")
        .attr("id", "bottom-clip")
        .append("rect")
        .attr("x", 0)
        .attr("y", -20) // 多留点Y空间防止文字被切
        .attr("width", containerWidth)
        .attr("height", bottomHeight + 40);

    const mainGroup = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // 颜色映射
    const platetypes = [...new Set(timeData.map(d => d.platetype))];
    const colorScale = d3.scaleOrdinal().domain(platetypes).range(d3.schemeTableau10);

    // ==========================================
    // 1. 上层 (甘特图 - 智能宽度)
    // ==========================================

    const PLATE_WIDTH_PX = 2; // 默认每块板 2px
    const naturalWidth = totalCount * PLATE_WIDTH_PX;
    const availableWidth = containerWidth - margin.left - margin.right;

    // 核心逻辑：
    // 如果自然宽度小于容器宽度 -> 使用自然宽度 (不拉伸，左对齐)
    // 如果自然宽度大于容器宽度 -> 使用容器宽度 (压缩每块板以挤满容器)
    const finalTopWidth = (naturalWidth > availableWidth) ? availableWidth : naturalWidth;

    const xScaleTop = d3.scaleLinear()
        .domain([0, totalCount > 0 ? totalCount : 1])
        .range([0, finalTopWidth]);

    // 上层不需要滚动，直接绘制
    const topGroup = mainGroup.append("g").attr("class", "top-layer");

    // 记录上层方块的中心点坐标 (固定值)
    const topCoords = {};

    topGroup.selectAll("rect")
        .data(timeData)
        .enter()
        .append("rect")
        .attr("x", d => xScaleTop(d.x0_cumulative))
        .attr("y", 0)
        // 宽度计算：保证至少有可视宽度
        .attr("width", d => {
            const w = xScaleTop(d.x1_cumulative) - xScaleTop(d.x0_cumulative);
            return Math.max(w, 0);
        })
        .attr("height", topHeight)
        .attr("fill", d => colorScale(d.platetype))
        // 关键：使用白色描边来模拟“间隙”
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .each(function (d) {
            const rectX = xScaleTop(d.x0_cumulative);
            const rectW = xScaleTop(d.x1_cumulative) - rectX;
            topCoords[d.id] = { x: rectX + rectW / 2, y: topHeight };
        })
        .on("mouseover", function (event, d) {
            d3.select(this).attr("stroke", "#333").attr("stroke-width", 1); // 悬停加黑边
            d3.select(`#link-${d.id}`).attr("stroke-opacity", 0.9).attr("stroke-width", 2);
            d3.select(`#bottom-${d.id}`).select("rect.bg").attr("stroke", "#409EFF").attr("stroke-width", 2);
        })
        .on("mouseout", function (event, d) {
            d3.select(this).attr("stroke", "#fff").attr("stroke-width", 0.5); // 恢复白边间隙
            d3.select(`#link-${d.id}`).attr("stroke-opacity", 0.2).attr("stroke-width", 1);
            d3.select(`#bottom-${d.id}`).select("rect.bg").attr("stroke", "#dcdfe6").attr("stroke-width", 1);
        });

    // ==========================================
    // 2. 下层 (规格卡片 - 可滚动)
    // ==========================================
    const bottomWrapperY = topHeight + gap;

    // 包装层用于裁剪
    const bottomClipper = mainGroup.append("g")
        .attr("transform", `translate(0, ${bottomWrapperY})`)
        .attr("clip-path", "url(#bottom-clip)"); // 应用裁剪

    // 实际移动的 Group
    const bottomGroup = bottomClipper.append("g").attr("class", "bottom-content");

    // 记录下层卡片的原始坐标 (x=0时的位置)
    const bottomCoordsOrigin = {};

    const cardGroups = bottomGroup.selectAll(".card")
        .data(capData).enter().append("g")
        .attr("class", "card")
        .attr("id", d => `bottom-${d.id}`)
        .attr("transform", (d, i) => {
            const x = i * (CARD_WIDTH + CARD_GAP);
            bottomCoordsOrigin[d.id] = { x: x + CARD_WIDTH / 2, y: 0 };
            return `translate(${x}, 0)`;
        });

    // 卡片样式 (白底)
    cardGroups.append("rect").attr("class", "bg")
        .attr("width", CARD_WIDTH).attr("height", bottomHeight)
        .attr("fill", "#fff").attr("rx", 4).attr("stroke", "#dcdfe6"); // 浅灰边框

    cardGroups.append("rect").attr("width", CARD_WIDTH).attr("height", 4).attr("fill", d => colorScale(d.platetype));

    cardGroups.append("text").attr("x", CARD_WIDTH / 2).attr("y", 18).attr("text-anchor", "middle")
        .text(d => d.platetype).attr("fill", "#303133").style("font-size", "10px").style("font-weight", "bold");

    cardGroups.append("text").attr("x", CARD_WIDTH / 2).attr("y", 30).attr("text-anchor", "middle")
        .text(d => `${d.count}块`).attr("fill", "#909399").style("font-size", "9px");

    // 迷你范围图 (Box Plot)
    const rangeScaleX = d3.scaleLinear().domain([0, 1]).range([10, CARD_WIDTH - 10]);
    const safeNorm = (val, min, max) => (max === min) ? 0.5 : (val - min) / (max - min);

    cardGroups.each(function (d) {
        const gItem = d3.select(this);
        // T (厚度)
        gItem.append("text").attr("x", 5).attr("y", 50).text("T").attr("fill", "#909399").style("font-size", "8px");
        gItem.append("line").attr("x1", 15).attr("x2", CARD_WIDTH - 5).attr("y1", 48).attr("y2", 48).attr("stroke", "#ebeef5");
        const tx1 = rangeScaleX(safeNorm(d.thickMin, globalRanges.tMin, globalRanges.tMax));
        const tx2 = rangeScaleX(safeNorm(d.thickMax, globalRanges.tMin, globalRanges.tMax));
        gItem.append("rect").attr("x", tx1).attr("y", 46).attr("width", Math.max(tx2 - tx1, 2)).attr("height", 4).attr("fill", "#4facfe");
        gItem.append("text").attr("x", CARD_WIDTH / 2).attr("y", 60).text(`${d.thickMin}-${d.thickMax}`).attr("text-anchor", "middle").attr("fill", "#4facfe").style("font-size", "8px");
        // W (宽度)
        gItem.append("text").attr("x", 5).attr("y", 80).text("W").attr("fill", "#909399").style("font-size", "8px");
        gItem.append("line").attr("x1", 15).attr("x2", CARD_WIDTH - 5).attr("y1", 78).attr("y2", 78).attr("stroke", "#ebeef5");
        const wx1 = rangeScaleX(safeNorm(d.widthMin, globalRanges.wMin, globalRanges.wMax));
        const wx2 = rangeScaleX(safeNorm(d.widthMax, globalRanges.wMin, globalRanges.wMax));
        gItem.append("rect").attr("x", wx1).attr("y", 76).attr("width", Math.max(wx2 - wx1, 2)).attr("height", 4).attr("fill", "#67c23a");
        gItem.append("text").attr("x", CARD_WIDTH / 2).attr("y", 90).text(`${d.widthMin}-${d.widthMax}`).attr("text-anchor", "middle").attr("fill", "#67c23a").style("font-size", "8px");
    });

    // ==========================================
    // 3. 动态连线层
    // ==========================================
    // 创建连线层，并应用裁剪（防止连线画到外面）
    const linkGroup = mainGroup.append("g")
        .attr("class", "link-layer")
        .lower(); // 放在最底层

    // 裁剪连线（可选，如果不想连线溢出容器）
    linkGroup.attr("clip-path", "url(#bottom-clip)");

    // 更新函数：负责每一帧重绘
    const updateVisuals = () => {
        // 1. 限制并应用滚动
        // 只有当内容宽度大于容器宽度时才允许负向滚动
        const maxScroll = Math.max(0, bottomContentWidth - availableWidth);
        bottomOffset.value = Math.max(-maxScroll, Math.min(0, bottomOffset.value));

        bottomGroup.attr("transform", `translate(${bottomOffset.value}, 0)`);

        // 2. 重绘连线
        const links = linkGroup.selectAll("path.dynamic-link").data(timeData);

        const getPath = (d) => {
            const start = topCoords[d.id];
            const endOrigin = bottomCoordsOrigin[d.id];
            if (!start || !endOrigin) return "";

            // 上层是固定的，下层是滚动的
            const sx = start.x;
            const sy = start.y;
            const ex = endOrigin.x + bottomOffset.value; // 计算下层当前位置
            const ey = topHeight + gap;

            const path = d3.path();
            path.moveTo(sx, sy);
            path.bezierCurveTo(sx, sy + gap * 0.6, ex, ey - gap * 0.6, ex, ey);
            return path.toString();
        };

        // Enter + Merge + Exit
        const linksEnter = links.enter().append("path")
            .attr("class", "dynamic-link")
            .attr("id", d => `link-${d.id}`)
            .attr("fill", "none")
            .attr("stroke", d => colorScale(d.platetype))
            .attr("stroke-width", 1)
            .attr("stroke-opacity", 0.2);

        links.merge(linksEnter).attr("d", getPath);
        links.exit().remove();
    };

    // 初始绘制
    updateVisuals();

    // ==========================================
    // 4. 事件监听 (局部滚动)
    // ==========================================

    // 仅在下层区域覆盖一个透明Rect来监听滚动
    bottomClipper.append("rect")
        .attr("width", containerWidth)
        .attr("height", bottomHeight)
        .attr("fill", "transparent")
        .style("cursor", "grab")
        .on("wheel", (e) => {
            e.preventDefault();
            // 横向滚动逻辑：shift+滚轮 或者 普通滚轮都触发横向移动
            bottomOffset.value -= e.deltaY;
            updateVisuals();
        });

    // 如果你也想让中间连线区域也能控制下面滚动，可以加这个：
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
    bottomOffset.value = 0; // 重置滚动
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
    /* D3 内部接管滚动 */
    position: relative;
}
</style>