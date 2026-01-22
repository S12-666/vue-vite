const POS_COLOR = '#e74c3c' // 正向红
const NEG_COLOR = '#3498db' // 负向蓝
const CAT_DEFAULT_COLOR = '#9aa0a6' // 类别默认灰
const MODEL_DEFAULT_COLOR = '#4b5563' // 模型默认深灰

// 1. 配置：自定义指标分类颜色
const CATEGORY_COLORS = {
    'HeatingIndex': '#FF8247',
    'RollingIndex': '#67c23a',
    'CoolingIndex': '#1E90FF',
    'MeasurTempIndex': '#8B8989',
    'SpecIndex': '#DA70D6'
}

// 2. 配置：模型预测结果颜色
const MODEL_PRED_1_COLOR = '#40b4ff' // 预测为 1 (亮蓝 - 正常/或特定状态)
const MODEL_PRED_0_COLOR = '#f56c6c' // 预测为 0 (亮红 - 异常/或特定状态)

function getModelKeys(coolingStatus) {
    return coolingStatus === 0 ? ['pa', 'pf', 'pn'] : ['pa', 'pf']
}

export function buildSankeyFromPredictions(predictions, coolingStatus, mapCategory) {
    const modelKeys = getModelKeys(coolingStatus)

    // --- 1. 第一遍遍历：构建基础数据 & 统计节点数量 ---
    const nodesData = new Map()
    // 预估高度配置 (和 ECharts 配置保持一致，用于计算比例)
    const CHART_H = 400; // 有效绘图高度 (450 - margin)
    const NODE_GAP = 8;

    const getOrInitNodeData = (key, type, label, extra = {}) => {
        if (!nodesData.has(key)) {
            nodesData.set(key, {
                name: key, type, label,
                pos: 0, neg: 0, total: 0,
                items: [],
                ...extra
            })
        }
        return nodesData.get(key)
    }

    // 临时存储 links，稍后统一处理
    const rawLinks = []

    modelKeys.forEach(model => {
        const mData = predictions?.[model]
        if (!mData?.top_features?.length) return

        const rawLabel = mData.pred_label ?? mData.prediction ?? mData.value;
        const predLabel = rawLabel !== undefined ? Number(rawLabel) : -1;

        mData.top_features.forEach(f => {
            const feature = f.feature
            const shap = Number(f.shap_value ?? 0)
            const absShap = Math.abs(shap)
            const cat = mapCategory(feature) || 'OtherIndex'

            const fKey = `F:${feature}`
            const cKey = `C:${cat}`
            const mKey = `M:${model}`

            const sign = shap >= 0 ? 'pos' : 'neg'

            // Nodes
            const fNode = getOrInitNodeData(fKey, 'feature', feature)
            fNode[sign] += absShap
            fNode.total += absShap
            fNode.items.push({ model, shap_value: shap, actual_value: f.actual_value, category: cat })

            const cNode = getOrInitNodeData(cKey, 'category', cat)
            cNode.total += absShap

            const mNode = getOrInitNodeData(mKey, 'model', model, { predLabel })
            mNode.total += absShap

            // Links (先存原始值)
            rawLinks.push({ source: fKey, target: cKey, sign, value: absShap, meta: { type: 'f2c', feature, category: cat } })
            rawLinks.push({ source: cKey, target: mKey, sign, value: absShap, meta: { type: 'c2m', category: cat, model } })
        })
    })

    // --- 2. 计算放大系数 (核心逻辑) ---
    // 统计各列节点数量
    const allNodes = Array.from(nodesData.values());
    const countF = allNodes.filter(n => n.type === 'feature').length;
    const countC = allNodes.filter(n => n.type === 'category').length;
    const countM = allNodes.filter(n => n.type === 'model').length;

    // 计算各列因为 Gap 占用的高度
    const gapHeightF = Math.max(0, countF - 1) * NODE_GAP;
    const gapHeightM = Math.max(0, countM - 1) * NODE_GAP;

    // 计算放大倍数：
    // 逻辑：右侧因为 Gap 少，所以剩下的空间(DataHeight) 很大。
    // 为了让右侧填满高度，我们需要让它的 DataValue 膨胀。
    // 比例 = (总高度 - 右侧少量的Gap) / (总高度 - 左侧大量的Gap)
    // 这样右侧的数据总高度就会等于左侧的数据总高度。
    let scaleRatio = 1;
    if (countF > countM) {
        const availableHeightF = Math.max(100, CHART_H - gapHeightF);
        const availableHeightM = Math.max(100, CHART_H - gapHeightM);
        scaleRatio = availableHeightM / availableHeightF;
    }
    // 限制一下最大放大倍数，防止极端情况
    scaleRatio = Math.min(Math.max(scaleRatio, 1), 3);

    // --- 3. 构建最终 Links (应用放大系数) ---
    const linksMap = new Map()
    const addLink = (l) => {
        const key = `${l.source}__${l.target}`
        if (!linksMap.has(key)) {
            linksMap.set(key, {
                source: l.source, target: l.target,
                pos: 0, neg: 0,
                meta: l.meta
            })
        }
        const linkObj = linksMap.get(key)

        // 【关键】如果是 Category -> Model 的连线，应用放大系数
        // Feature -> Category 的连线保持原样（因为 Feature 本来就很挤，不需要放大）
        const finalValue = (l.meta.type === 'c2m') ? l.value * scaleRatio : l.value;

        if (l.sign === 'pos') linkObj.pos += finalValue
        else linkObj.neg += finalValue
    }
    rawLinks.forEach(addLink);

    // --- 4. 构建最终 Nodes ---
    const nodes = []
    allNodes.forEach(d => {
        if (d.total <= 0.0001) return

        // 【关键】计算节点的显示值
        // Feature 节点：保持原始值
        // Category 节点：因为输出连线变粗了，节点大小取 max(输入, 输出)，所以会自动变大
        // Model 节点：因为输入连线变粗了，所以会自动变大
        let displayValue = d.total;
        if (d.type !== 'feature') {
            displayValue = d.total * scaleRatio;
        }

        const nodeObj = {
            name: d.name,
            value: displayValue, // 使用放大后的值用于绘图
            meta: {
                type: d.type,
                label: d.label,
                shap_value: d.items.reduce((sum, item) => sum + item.shap_value, 0),
                items: d.items,
                predLabel: d.predLabel,
                rawValue: d.total // 【关键】保存原始值用于 Tooltip 显示
            }
        }

        // 样式 (保持不变)
        if (d.type === 'feature') {
            const ratio = d.pos / d.total
            nodeObj.itemStyle = {
                color: {
                    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: POS_COLOR },
                        { offset: ratio, color: POS_COLOR },
                        { offset: ratio, color: NEG_COLOR },
                        { offset: 1, color: NEG_COLOR }
                    ]
                },
                borderColor: '#666', borderWidth: 0.5
            }
        } else if (d.type === 'category') {
            nodeObj.itemStyle = { color: CATEGORY_COLORS[d.label] || CAT_DEFAULT_COLOR }
        } else {
            let mColor = MODEL_DEFAULT_COLOR
            if (d.predLabel === 1) mColor = MODEL_PRED_1_COLOR
            else if (d.predLabel === 0) mColor = MODEL_PRED_0_COLOR
            nodeObj.itemStyle = { color: mColor }
        }
        nodes.push(nodeObj)
    })

    nodes.sort((a, b) => b.value - a.value)

    const links = []
    linksMap.forEach(l => {
        if (l.pos > 0) links.push({
            source: l.source, target: l.target, value: l.pos,
            lineStyle: { color: POS_COLOR, opacity: 0.4 },
            meta: { ...l.meta, sign: 'pos', val: l.pos }
        })
        if (l.neg > 0) links.push({
            source: l.source, target: l.target, value: l.neg,
            lineStyle: { color: NEG_COLOR, opacity: 0.4 },
            curveness: l.meta.type === 'c2m' ? -0.2 : 0.5,
            meta: { ...l.meta, sign: 'neg', val: l.neg }
        })
    })

    return { nodes, links }
}