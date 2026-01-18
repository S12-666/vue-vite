const POS_COLOR = '#e74c3c' // 正向红
const NEG_COLOR = '#3498db' // 负向蓝
const CAT_DEFAULT_COLOR = '#9aa0a6' // 类别默认灰
const MODEL_DEFAULT_COLOR = '#4b5563' // 模型默认深灰

// 1. 配置：自定义指标分类颜色
const CATEGORY_COLORS = {
    'HeatingIndex': '#FF8247',
    'RollingIndex': '#32CD32',
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
    // 传入 predictions 自动获取所有模型 (pa, pf, pn, ps, gs)
    const modelKeys = getModelKeys(coolingStatus)

    const nodesData = new Map()
    const getOrInitNodeData = (key, type, label, extra = {}) => {
        if (!nodesData.has(key)) {
            nodesData.set(key, {
                name: key,
                type,
                label,
                pos: 0,
                neg: 0,
                total: 0,
                items: [],
                ...extra
            })
        }
        return nodesData.get(key)
    }

    const linksMap = new Map()
    const addLink = (source, target, sign, value, meta) => {
        const key = `${source}__${target}`
        if (!linksMap.has(key)) {
            linksMap.set(key, { source, target, pos: 0, neg: 0, meta })
        }
        const link = linksMap.get(key)
        if (sign === 'pos') link.pos += value
        else link.neg += value
    }

    // --- 遍历逻辑 ---
    modelKeys.forEach(model => {
        const mData = predictions?.[model]
        // 确保有 top_features 才处理
        if (!mData?.top_features?.length) return

        // 【修改点2】适配真实数据字段：pred_label
        const rawLabel = mData.pred_label ?? mData.prediction ?? mData.value;
        const predLabel = rawLabel !== undefined ? Number(rawLabel) : -1;

        mData.top_features.forEach(f => {
            const feature = f.feature
            const shap = Number(f.shap_value ?? 0)
            const absShap = Math.abs(shap)
            // 如果 mapCategory 没匹配到，给一个默认值，防止 undefined
            const cat = mapCategory(feature) || 'OtherIndex'

            const fKey = `F:${feature}`
            const cKey = `C:${cat}`
            const mKey = `M:${model}`

            const sign = shap >= 0 ? 'pos' : 'neg'

            // 1. Feature Node
            const fNode = getOrInitNodeData(fKey, 'feature', feature)
            fNode[sign] += absShap
            fNode.total += absShap
            fNode.items.push({ model, shap_value: shap, actual_value: f.actual_value, category: cat })

            // 2. Category Node
            const cNode = getOrInitNodeData(cKey, 'category', cat)
            cNode.total += absShap

            // 3. Model Node (传入 predLabel 用于变色)
            const mNode = getOrInitNodeData(mKey, 'model', model, { predLabel })
            mNode.total += absShap

            // 4. Links
            addLink(fKey, cKey, sign, absShap, { type: 'f2c', feature, category: cat })
            addLink(cKey, mKey, sign, absShap, { type: 'c2m', category: cat, model })
        })
    })

    // --- 构建 Nodes ---
    const nodes = []

    Array.from(nodesData.values()).forEach(d => {
        if (d.total <= 0.0001) return

        const nodeObj = {
            name: d.name,
            value: d.total,
            meta: {
                type: d.type,
                label: d.label,
                shap_value: d.items.reduce((sum, item) => sum + item.shap_value, 0),
                items: d.items,
                predLabel: d.predLabel
            }
        }

        // 样式处理
        if (d.type === 'feature') {
            const ratio = d.pos / d.total
            nodeObj.itemStyle = {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: POS_COLOR },
                        { offset: ratio, color: POS_COLOR },
                        { offset: ratio, color: NEG_COLOR },
                        { offset: 1, color: NEG_COLOR }
                    ]
                },
                borderColor: '#666',
                borderWidth: 0.5
            }
        }
        else if (d.type === 'category') {
            // 根据 Category 名字去匹配颜色
            const customColor = CATEGORY_COLORS[d.label] || CAT_DEFAULT_COLOR
            nodeObj.itemStyle = { color: customColor }
        }
        else {
            // Model 颜色逻辑：1 为蓝，0 为红
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
        if (l.pos > 0) {
            links.push({
                source: l.source,
                target: l.target,
                value: l.pos,
                lineStyle: { color: POS_COLOR, opacity: 0.4 },
                meta: { ...l.meta, sign: 'pos', val: l.pos }
            })
        }
        if (l.neg > 0) {
            links.push({
                source: l.source,
                target: l.target,
                value: l.neg,
                lineStyle: { color: NEG_COLOR, opacity: 0.4 },
                curveness: l.meta.type === 'c2m' ? -0.2 : 0.5,
                meta: { ...l.meta, sign: 'neg', val: l.neg }
            })
        }
    })

    return { nodes, links }
}