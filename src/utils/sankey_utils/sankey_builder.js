const POS_COLOR = '#e74c3c' // 正向红
const NEG_COLOR = '#3498db' // 负向蓝
const CAT_COLOR = '#9aa0a6' // 类别灰
const MODEL_COLOR = '#4b5563' // 模型深灰

function getModelKeys(coolingStatus) {
    return coolingStatus === 0 ? ['pa', 'pf', 'pn'] : ['pa', 'pf']
}

export function buildSankeyFromPredictions(predictions, coolingStatus, mapCategory) {
    const modelKeys = getModelKeys(coolingStatus)

    // 1. 数据结构初始化
    // nodesData用于暂存节点统计信息：{ pos: 0, neg: 0, total: 0 }
    const nodesData = new Map()
    const getOrInitNodeData = (key, type, label) => {
        if (!nodesData.has(key)) {
            nodesData.set(key, { 
                name: key, 
                type, 
                label,
                pos: 0, 
                neg: 0, 
                total: 0, // total = pos + neg (绝对值之和)
                items: [] // 仅 feature 用来存明细
            })
        }
        return nodesData.get(key)
    }

    // linksMap 用于聚合连线：key = source__target
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

    // 2. 遍历预测数据，聚合数值
    modelKeys.forEach(model => {
        const mData = predictions?.[model]
        if (!mData?.top_features?.length) return

        mData.top_features.forEach(f => {
            const feature = f.feature
            const shap = Number(f.shap_value ?? 0)
            const absShap = Math.abs(shap)
            const cat = mapCategory(feature) || 'OtherIndex' // 兜底分类

            // 定义节点 Key
            const fKey = `F:${feature}`
            const cKey = `C:${cat}`
            const mKey = `M:${model}`

            // 2.1 累加节点权重 (用于计算节点高度)
            const sign = shap >= 0 ? 'pos' : 'neg'
            
            // Feature 节点
            const fNode = getOrInitNodeData(fKey, 'feature', feature)
            fNode[sign] += absShap
            fNode.total += absShap
            fNode.items.push({ model, shap_value: shap, actual_value: f.actual_value, category: cat })

            // Category 节点
            const cNode = getOrInitNodeData(cKey, 'category', cat)
            cNode.total += absShap // 类别的高度由 feature 累加而来

            // Model 节点
            const mNode = getOrInitNodeData(mKey, 'model', model)
            mNode.total += absShap // 模型的高度由 feature 累加而来

            // 2.2 累加连线 (Feature -> Category)
            addLink(fKey, cKey, sign, absShap, { type: 'f2c', feature, category: cat })

            // 2.3 累加连线 (Category -> Model)
            // 注意：这里需要传递 sign，保证从中间到右边也能分出红蓝
            addLink(cKey, mKey, sign, absShap, { type: 'c2m', category: cat, model })
        })
    })

    // 3. 构建 ECharts Nodes
    const nodes = []
    
    // 将 Map 转数组并处理样式
    Array.from(nodesData.values()).forEach(d => {
        if (d.total <= 0.0001) return // 过滤掉无贡献的节点

        const nodeObj = {
            name: d.name,
            value: d.total, // 【关键】节点高度完全由累加值决定
            meta: {
                type: d.type,
                label: d.label,
                // 计算净值用于显示（例如：正负抵消后的结果）
                shap_value: d.items.reduce((sum, item) => sum + item.shap_value, 0),
                items: d.items
            }
        }

        // 3.1 Feature 节点特殊样式：红蓝渐变
        if (d.type === 'feature') {
            const ratio = d.pos / d.total
            nodeObj.itemStyle = {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1, // 垂直渐变，上方为正(红)，下方为负(蓝)
                    colorStops: [
                        { offset: 0, color: POS_COLOR },
                        { offset: ratio, color: POS_COLOR },     // 红色截止处
                        { offset: ratio, color: NEG_COLOR },     // 蓝色开始处 (硬切割)
                        { offset: 1, color: NEG_COLOR }
                    ]
                },
                borderColor: '#666', // 加上边框防止颜色太浅看不清
                borderWidth: 0.5
            }
        } 
        // 3.2 Category 节点样式
        else if (d.type === 'category') {
            nodeObj.itemStyle = { color: CAT_COLOR }
        } 
        // 3.3 Model 节点样式
        else {
            nodeObj.itemStyle = { color: MODEL_COLOR }
        }

        nodes.push(nodeObj)
    })

    // 【关键】排序：绝对值大的 Feature 在上面
    // 我们主要对 Feature 排序，Category 和 Model 可以按默认或也按大小排
    nodes.sort((a, b) => b.value - a.value)


    // 4. 构建 ECharts Links
    const links = []
    linksMap.forEach(l => {
        // 如果有正向流量，创建红色连线
        if (l.pos > 0) {
            links.push({
                source: l.source,
                target: l.target,
                value: l.pos,
                lineStyle: { color: POS_COLOR, opacity: 0.4 },
                meta: { ...l.meta, sign: 'pos', val: l.pos }
            })
        }
        // 如果有负向流量，创建蓝色连线
        if (l.neg > 0) {
            links.push({
                source: l.source,
                target: l.target,
                value: l.neg,
                lineStyle: { color: NEG_COLOR, opacity: 0.4 },
                // 稍微错开一点曲线，防止完全重叠（可选）
                curveness: l.meta.type === 'c2m' ? -0.2 : 0.5, 
                meta: { ...l.meta, sign: 'neg', val: l.neg }
            })
        }
    })

    return { nodes, links }
}