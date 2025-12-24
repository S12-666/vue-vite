<template>
    <div class="dashboard-container">
        <el-row :gutter="24" class="main-row">
            <el-col :xs="24" :sm="6" :md="6" class="left-panel">
                <el-card shadow="never" class="profile-card card-like">
                    <div class="user-top">
                        <div class="avatar-wrapper">
                            <el-avatar :size="156" :src="userInfo?.avatar_url" class="large-avatar" />
                            <div class="status-dot" title="online"></div>
                        </div>

                        <div class="profile-text">
                            <h1 class="username">{{ userInfo?.name || USER_NAME }}</h1>
                            <p class="bio">{{ userInfo?.bio || 'No bio available' }}</p>

                            <div class="meta-info">
                                <span class="meta-item">
                                    <el-icon>
                                        <Location />
                                    </el-icon>
                                    {{ userInfo?.location || 'Shenyang' }}
                                </span>
                                <span class="meta-item">
                                    <el-icon>
                                        <Calendar />
                                    </el-icon>
                                    加入于 {{ formatYear(userInfo?.created_at) }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="divider"></div>

                    <div class="language-stats" v-if="languageData.length > 0">
                        <div class="stats-head">
                            <span class="stats-title">Languages</span>
                            <el-tag size="small" type="info" effect="plain">web</el-tag>
                        </div>

                        <div class="language-bar">
                            <div v-for="lang in languageData" :key="lang.name" class="bar-segment"
                                :style="{ width: lang.percent + '%', backgroundColor: lang.color }"
                                :title="`${lang.name} ${lang.percent}%`" />
                        </div>

                        <div class="language-legend">
                            <div v-for="lang in languageData" :key="lang.name" class="legend-item">
                                <span class="dot" :style="{ backgroundColor: lang.color }"></span>
                                <span class="name">{{ lang.name }}</span>
                                <span class="percent">{{ lang.percent }}%</span>
                            </div>
                        </div>
                    </div>
                </el-card>

                <el-card shadow="never" class="chart-card card-like">
                    <template #header>
                        <div class="card-header">
                            <span class="section-title">📅 月度记录</span>
                            <el-config-provider :locale="zhCn">
                                <div class="block">
                                    <el-date-picker v-model="currentMonthDate" type="month" placeholder="选择月份"
                                        :clearable="false" />
                                </div>
                            </el-config-provider>
                        </div>
                    </template>

                    <div class="chart-wrap" v-loading="loadingMonth">
                        <CalendarChart ref="calendarRef" :commits="monthCommits" :month-key="monthRange" />
                    </div>
                </el-card>
            </el-col>

            <el-col :xs="24" :sm="18" :md="18" class="right-panel">
                <el-card shadow="never" class="commit-section card-like today-card">
                    <template #header>
                        <div class="card-header">
                            <span class="section-title">🚀 今日代码动态</span>
                            <el-tag size="small" type="primary">{{ todayCommits.length }} 条</el-tag>
                        </div>
                    </template>

                    <div class="card-body">
                        <el-scrollbar class="scroll-fill">
                            <div v-if="todayCommits.length > 0" class="commit-list">
                                <div v-for="item in todayCommits" :key="item.sha" class="commit-item">
                                    <div class="commit-msg">{{ item.message }}</div>
                                    <div class="commit-time">{{ formatTime(item.date) }}</div>
                                </div>
                            </div>
                            <el-empty v-else :image-size="80" description="今天还在憋大招..." />
                        </el-scrollbar>
                    </div>
                </el-card>

                <el-card shadow="never" class="commit-section card-like history-card">
                    <template #header>
                        <div class="card-header">
                            <span class="section-title">📜 历史更新日志</span>
                            <el-tag size="small" type="info" effect="plain">{{ historyCommits.length }} 条</el-tag>
                        </div>
                    </template>

                    <div class="card-body">
                        <el-scrollbar class="scroll-fill" ref="historyScrollbar" @scroll="onHistoryScroll">
                            <el-timeline class="custom-timeline">
                                <el-timeline-item v-for="item in historyCommits" :key="item.sha"
                                    :timestamp="formatTime(item.date)" type="primary" :hollow="true">
                                    <span class="history-msg">{{ item.message }}</span>
                                </el-timeline-item>
                            </el-timeline>

                            <div class="load-more">
                                <span v-if="loadingMore">正在加载更多...</span>
                                <span v-else-if="noMore">没有更多了</span>
                                <span v-else>下拉加载更多</span>
                            </div>
                        </el-scrollbar>
                    </div>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { Calendar, Location } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
// 假设你有一个 CalendarChart 组件
import CalendarChart from './CalendarChart.vue'

// ===================== 基本信息 =====================
const USER_NAME = 'S12-666'
const REPO_NAME = 'vue-vite'
const BRANCH = 'my-system'
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || ''

// ===================== refs =====================
const currentMonthDate = ref(new Date()) // 重命名更清晰
const userInfo = ref(null)
const languageData = ref([])
const loading = ref(false)
const loadingMonth = ref(false) // 单独给月度图表加 loading

const calendarRef = ref(null)
const historyScrollbar = ref(null)

const commitPage = ref(1)
const perPage = 50
const loadingMore = ref(false)
const noMore = ref(false)

// 存储“已标准化”的数据，避免在 computed 中重复计算 randomUUID
const timelineCommits = ref([])
const monthCommits = ref([])

// ===================== utils =====================
const pad2 = (n) => String(n).padStart(2, '0')

const toLocalDateKey = (d) => {
    const dt = d instanceof Date ? d : new Date(d)
    if (isNaN(dt.getTime())) return ''
    return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`
}

const todayKey = computed(() => toLocalDateKey(new Date()))

const monthRange = computed(() => {
    const dt = currentMonthDate.value instanceof Date ? currentMonthDate.value : new Date(currentMonthDate.value)
    return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}`
})

// ✅ 修复：正确获取包含时区的查询时间范围
const getMonthBoundsISO = (dtLike) => {
    const dt = dtLike instanceof Date ? dtLike : new Date(dtLike)
    // 设为当月 1 号 00:00:00
    const start = new Date(dt.getFullYear(), dt.getMonth(), 1, 0, 0, 0)
    // 设为下月 1 号 00:00:00
    const end = new Date(dt.getFullYear(), dt.getMonth() + 1, 1, 0, 0, 0)

    // 转换为 ISO 格式供 API 使用
    return { since: start.toISOString(), until: end.toISOString() }
}

// ✅ 优化：标准化逻辑，增加空值保护，确保 ID 稳定
const normalizeCommit = (item) => {
    const iso =
        item?.commit?.author?.date ||
        item?.commit?.committer?.date ||
        item?.commit?.committer_date ||
        null

    return {
        // 优先使用 GitHub 的 SHA，没有才 fallback 到 random (GitHub 返回通常都有 sha)
        sha: item?.sha || String(Math.random()),
        message: item?.commit?.message || '(no message)',
        date: iso ? new Date(iso) : new Date(0)
    }
}

const formatYear = (isoStr) => {
    if (!isoStr) return '2025年'
    return new Date(isoStr).getFullYear() + '年'
}

const formatTime = (d) =>
    new Date(d).toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })

// ===================== GitHub API Logic =====================

// ✅ 修复：移除全局 aborter，改为传入 signal
const apiFetch = async (url, signal = null) => {
    const headers = { Accept: 'application/vnd.github+json' }
    if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`

    const opts = { headers }
    if (signal) opts.signal = signal

    const res = await fetch(url, opts)
    if (!res.ok) {
        throw new Error(`GitHub API Error: ${res.status} ${res.statusText}`)
    }
    return await res.json()
}

// 获取某一页 Commits
const fetchCommitsPage = async (page) => {
    const url = `https://api.github.com/repos/${USER_NAME}/${REPO_NAME}/commits?sha=${BRANCH}&per_page=${perPage}&page=${page}`
    const data = await apiFetch(url)
    // GitHub API 报错时有时返回对象，这里确保返回数组
    return Array.isArray(data) ? data.map(normalizeCommit) : []
}

// 获取整月 Commits (支持 AbortController)
let monthAbortController = null
const fetchMonthCommits = async (targetDate) => {
    // 1. 取消上一次未完成的月度请求
    if (monthAbortController) monthAbortController.abort()
    monthAbortController = new AbortController()

    const { since, until } = getMonthBoundsISO(targetDate)
    const pageSize = 100
    const maxPages = 5 // 限制最大页数防止卡死
    let page = 1
    let all = []

    try {
        while (page <= maxPages) {
            const url =
                `https://api.github.com/repos/${USER_NAME}/${REPO_NAME}/commits` +
                `?sha=${BRANCH}&since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}` +
                `&per_page=${pageSize}&page=${page}`

            const data = await apiFetch(url, monthAbortController.signal)
            const arr = Array.isArray(data) ? data : []

            all = all.concat(arr)
            if (arr.length < pageSize) break
            page += 1
        }
        return all.map(normalizeCommit)
    } catch (err) {
        if (err.name === 'AbortError') {
            console.log('Month fetch aborted')
            return null // 返回 null 表示被取消，不更新数据
        }
        throw err
    }
}

// ===================== computed (基于已处理的 timelineCommits) =====================
// 拆分 Today 和 History
const todayCommits = computed(() =>
    timelineCommits.value
        .filter(c => toLocalDateKey(c.date) === todayKey.value)
        .sort((a, b) => b.date - a.date)
)

const historyCommits = computed(() =>
    timelineCommits.value
        .filter(c => toLocalDateKey(c.date) !== todayKey.value)
        .sort((a, b) => b.date - a.date)
)

// ===================== languages =====================
const hashColor = (str) => {
    let h = 0
    for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i)
    const c = (h >>> 0).toString(16).slice(0, 6).padEnd(6, '0')
    return `#${c}`
}

const fetchLanguages = async () => {
    const url = `https://api.github.com/repos/${USER_NAME}/${REPO_NAME}/languages`
    const data = await apiFetch(url)
    if (!data || typeof data !== 'object') return

    const totalBytes = Object.values(data).reduce((sum, val) => sum + Number(val || 0), 0) || 1
    const colorMap = {
        Vue: '#41b883', JavaScript: '#f1e05a', TypeScript: '#3178c6',
        HTML: '#e34c26', CSS: '#563d7c', Python: '#3572A5'
    }

    languageData.value = Object.entries(data)
        .map(([name, bytes]) => ({
            name,
            percent: Number(((bytes / totalBytes) * 100).toFixed(1)),
            color: colorMap[name] || hashColor(name)
        }))
        .sort((a, b) => b.percent - a.percent)
}

// ===================== scroll / load more =====================
const loadMoreHistory = async () => {
    if (loadingMore.value || noMore.value) return
    loadingMore.value = true

    try {
        const nextPage = commitPage.value + 1
        const nextNormalized = await fetchCommitsPage(nextPage)

        if (nextNormalized.length === 0) {
            noMore.value = true
            return
        }

        // ✅ 去重 (使用 Set 检查 sha)
        const existingShas = new Set(timelineCommits.value.map(x => x.sha))
        const newItems = nextNormalized.filter(x => !existingShas.has(x.sha))

        timelineCommits.value = [...timelineCommits.value, ...newItems]
        commitPage.value = nextPage

        if (nextNormalized.length < perPage) noMore.value = true
    } catch (e) {
        console.error('Load more failed', e)
    } finally {
        loadingMore.value = false
    }
}

const onHistoryScroll = () => {
    const wrap = historyScrollbar.value?.wrapRef
    if (!wrap) return

    // 增加一点阈值，体验更好
    const threshold = 100
    if (wrap.scrollHeight - wrap.clientHeight - wrap.scrollTop < threshold) {
        loadMoreHistory()
    }
}

// ===================== Init & Watch =====================
const handleMonthChange = async (newDate) => {
    loadingMonth.value = true
    try {
        const data = await fetchMonthCommits(newDate)
        // 如果是 null 说明被 Abort 了，忽略
        if (data !== null) {
            monthCommits.value = data
            // 刷新图表
            calendarRef.value?.refresh?.()
        }
    } catch (e) {
        console.error(e)
        ElMessage.warning('获取月度数据失败')
    } finally {
        loadingMonth.value = false
    }
}

// 监听月份变化
watch(() => currentMonthDate.value, (val) => {
    handleMonthChange(val)
})

const initData = async () => {
    loading.value = true
    try {
        // ✅ 安全并发：Promise.all 里的请求不会再互相取消了
        const [user, monthData, timelineData] = await Promise.all([
            apiFetch(`https://api.github.com/users/${USER_NAME}`),
            fetchMonthCommits(currentMonthDate.value),
            fetchCommitsPage(1)
        ])

        userInfo.value = user
        monthCommits.value = monthData || []
        timelineCommits.value = timelineData // timelineData 已经在 fetch 里 normalized 了

        // 检查是否还有更多
        if (timelineData.length < perPage) noMore.value = true

        // 语言数据非关键，可以不阻塞主流程，也可以放在 await 里
        await fetchLanguages()

    } catch (e) {
        console.error(e)
        ElMessage.error(e.message || '初始化数据失败')
    } finally {
        loading.value = false
    }
}

// ECharts resize
let resizeTimer = null
const handleResize = () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
        calendarRef.value?.resize?.()
    }, 100)
}

onMounted(() => {
    initData()
    window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
    if (monthAbortController) monthAbortController.abort()
})
</script>

<style scoped>
.dashboard-container {
    height: 100%;
}

.main-row {
    min-height: calc(100vh - 120px);
}

/* 左栏 */
.left-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* 统一卡片风格 */
.card-like {
    border: 1px solid #e5e7eb;
    background: #fff;
    border-radius: 2px;
    box-shadow: none;
    transition: box-shadow 0.18s ease, border-color 0.18s ease;
}

.card-like:hover {
    border-color: #d0d7de;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.1);
}

/* ✅ 统一 body padding（你之前只改了 header） */
.profile-card :deep(.el-card__body),
.chart-card :deep(.el-card__body),
.commit-section :deep(.el-card__body) {
    padding: 14px 14px;
}

/* 顶部用户区域 */
.user-top {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 14px;
    align-items: center;
}

.avatar-wrapper {
    position: relative;
    width: fit-content;
    margin: 0 auto;
}

.large-avatar {
    border: 4px solid #fff;
    box-shadow: 0 10px 26px rgba(0, 0, 0, 0.12);
    transition: transform 0.25s ease;
    display: block;
}

.large-avatar:hover {
    transform: scale(1.03);
}

.status-dot {
    position: absolute;
    right: 12%;
    bottom: 12%;
    width: 18px;
    height: 18px;
    background: #23d160;
    border: 2px solid #fff;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
    transform: translate(50%, 50%);
}

.profile-text {
    text-align: left;
    align-self: end;
    margin-left: 10px;
    min-width: 0;
}

.username {
    font-size: 22px;
    font-weight: 800;
    margin: 0 0 6px 0;
    color: #1f2328;
}

.bio {
    font-size: 13px;
    color: #6b7280;
    margin: 0 0 10px 0;
    line-height: 1.5;
}

.meta-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    font-size: 12px;
    color: #909399;
}

.meta-item {
    width: 100%;
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.divider {
    height: 1px;
    background: #eef2f7;
    margin: 14px 0;
}

/* language */
.stats-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
}

.stats-title {
    font-weight: 700;
    color: #1f2328;
}

.language-bar {
    display: flex;
    height: 8px;
    border-radius: 999px;
    overflow: hidden;
    background: #eef2f7;
    margin-bottom: 12px;
}

.bar-segment {
    height: 100%;
}

.language-legend {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px 12px;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    min-width: 0;
}

.legend-item .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    flex: 0 0 auto;
}

.legend-item .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.legend-item .percent {
    margin-left: auto;
    color: #6b7280;
}

/* 热力图卡片 */
.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.chart-card :deep(.el-card__header) {
    padding: 12px 14px;
}

.section-title {
    font-weight: 800;
    font-size: 14px;
}

.chart-wrap {
    position: relative;
    min-height: 340px;
    /* ✅ 防止子组件高度塌陷 */
}

/* 右栏 */
.right-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 0;
    max-height: calc(100vh - 140px);
}

.commit-section {
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.today-card {
    flex: 4;
    min-height: 220px;
}

.history-card {
    flex: 6;
    min-height: 260px;
}

.load-more {
    padding: 12px 0 18px;
    text-align: center;
    font-size: 12px;
    color: #909399;
}

.card-body {
    flex: 1;
    min-height: 0;
}

.scroll-fill {
    height: 100%;
}

.commit-list {
    padding: 6px 0;
}

.commit-item {
    padding: 12px 14px;
    border-bottom: 1px solid #eef2f7;
    transition: background 0.2s;
}

.commit-item:hover {
    background: #f7faff;
}

.commit-msg {
    font-size: 13px;
    color: #1f2328;
    font-weight: 600;
    line-height: 1.4;
}

.commit-time {
    font-size: 12px;
    color: #909399;
    margin-top: 6px;
}

.custom-timeline {
    padding: 10px 16px;
}

.history-msg {
    font-size: 13px;
    line-height: 1.6;
}

/* 小屏适配 */
@media (max-width: 768px) {
    .user-top {
        grid-template-columns: 1fr;
        text-align: center;
    }

    .meta-info {
        align-items: center;
    }
}
</style>
