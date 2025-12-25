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

                    <div class="language-stats" v-if="EndlanguageData.length > 0">
                        <div class="stats-head">
                            <span class="stats-title"></span>
                            <el-tag size="small" type="info" effect="plain">backend</el-tag>
                        </div>
                        <div class="language-bar">
                            <div v-for="lang in EndlanguageData" :key="lang.name" class="bar-segment"
                                :style="{ width: lang.percent + '%', backgroundColor: lang.color }"
                                :title="`${lang.name} ${lang.percent}%`" />
                        </div>
                        <div class="language-legend">
                            <div v-for="lang in EndlanguageData" :key="lang.name" class="legend-item">
                                <span class="dot" :style="{ backgroundColor: lang.color }"></span>
                                <span class="name">{{ lang.name }}</span>
                                <span class="percent">{{ lang.percent }}%</span>
                            </div>
                        </div>
                    </div>
                </el-card>

                <el-card shadow="never" class="chart-card card-like">
                    <template #header>
                        <div class="card-header month-title">
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
                        <div class="split-container">
                            <div class="split-col left-col">
                                <div class="col-header frontend-header">
                                    <span>🎨 前端 ({{ todayFrontend.length }})</span>
                                </div>
                                <el-scrollbar class="col-scroll">
                                    <div v-if="todayFrontend.length > 0" class="commit-list">
                                        <div v-for="item in todayFrontend" :key="item.sha" class="commit-item">
                                            <div class="commit-msg">{{ item.message }}</div>
                                            <div class="commit-meta">
                                                <span class="commit-time">{{ formatTime(item.date).split(' ')[1]
                                                    }}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <el-empty v-else :image-size="60" description="前端摸鱼中..." />
                                </el-scrollbar>
                            </div>

                            <!-- <div class="split-divider"></div> -->

                            <div class="split-col right-col">
                                <div class="col-header backend-header">
                                    <span>⚙️ 后端 ({{ todayBackend.length }})</span>
                                </div>
                                <el-scrollbar class="col-scroll">
                                    <div v-if="todayBackend.length > 0" class="commit-list">
                                        <div v-for="item in todayBackend" :key="item.sha" class="commit-item">
                                            <div class="commit-msg">{{ item.message }}</div>
                                            <div class="commit-meta">
                                                <span class="commit-time">{{ formatTime(item.date).split(' ')[1]
                                                    }}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <el-empty v-else :image-size="60" description="后端很稳..." />
                                </el-scrollbar>
                            </div>
                        </div>
                    </div>
                </el-card>

                <el-card shadow="never" class="commit-section card-like history-card">
                    <template #header>
                        <div class="card-header">
                            <span class="section-title">📜 历史更新日志</span>
                            <el-tag size="small" type="info" effect="plain">{{ historyCommits.length }} 条 (已加载)</el-tag>
                        </div>
                    </template>

                    <div class="card-body">
                        <div class="split-container">
                            <div class="split-col left-col">
                                <div class="col-header frontend-header"><span>🎨 前端历史</span></div>
                                <el-scrollbar class="col-scroll" ref="historyScrollLeft" @scroll="onHistoryScroll">
                                    <el-timeline class="custom-timeline">
                                        <el-timeline-item v-for="item in historyFrontend" :key="item.sha"
                                            :timestamp="formatTime(item.date)" type="primary" :hollow="true"
                                            color="#409EFF">
                                            <span class="history-msg">{{ item.message }}</span>
                                        </el-timeline-item>
                                    </el-timeline>
                                    <div class="load-more-mini" v-if="loadingMore">加载中...</div>
                                    <div class="load-more-mini" v-if="noMore && historyFrontend.length > 0">无更多</div>
                                </el-scrollbar>
                            </div>

                            <!-- <div class="split-divider"></div> -->

                            <div class="split-col right-col">
                                <div class="col-header backend-header"><span>⚙️ 后端历史</span></div>
                                <el-scrollbar class="col-scroll" ref="historyScrollRight" @scroll="onHistoryScroll">
                                    <el-timeline class="custom-timeline">
                                        <el-timeline-item v-for="item in historyBackend" :key="item.sha"
                                            :timestamp="formatTime(item.date)" type="success" :hollow="true"
                                            color="#67C23A">
                                            <span class="history-msg">{{ item.message }}</span>
                                        </el-timeline-item>
                                    </el-timeline>
                                    <div class="load-more-mini" v-if="loadingMore">加载中...</div>
                                    <div class="load-more-mini" v-if="noMore && historyBackend.length > 0">无更多</div>
                                </el-scrollbar>
                            </div>
                        </div>
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
import CalendarChart from './CalendarChart.vue'

// ===================== 配置信息 =====================
const USER_NAME = 'S12-666'
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || ''

// ✅ 定义仓库列表：可以在这里配置更多仓库
const REPO_LIST = [
    {
        id: 'front',
        name: 'vue-vite',  // 前端仓库名
        branch: 'my-system',
        label: 'Frontend',
        type: 'frontend'   // 用于过滤的标识
    },
    {
        id: 'back',
        name: 'my-backend', // 后端仓库名
        branch: 'main',
        label: 'Backend',
        type: 'backend'    // 用于过滤的标识
    }
]

// ===================== refs =====================
const currentMonthDate = ref(new Date())
const userInfo = ref(null)

const languageData = ref([])
const EndlanguageData = ref([])

const loading = ref(false)
const loadingMonth = ref(false)

const calendarRef = ref(null)
const historyScrollLeft = ref(null)
const historyScrollRight = ref(null)

const commitPage = ref(1)
const perPage = 50 // 每个仓库每页取的数量
const loadingMore = ref(false)
const noMore = ref(false)

// 存储“已标准化”的数据 (合并后的)
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

const getMonthBoundsISO = (dtLike) => {
    const dt = dtLike instanceof Date ? dtLike : new Date(dtLike)
    const start = new Date(dt.getFullYear(), dt.getMonth(), 1, 0, 0, 0)
    const end = new Date(dt.getFullYear(), dt.getMonth() + 1, 1, 0, 0, 0)
    return { since: start.toISOString(), until: end.toISOString() }
}

// ✅ 标准化：增加 repoType 参数，用于后续拆分
const normalizeCommit = (item, repoInfo) => {
    const iso =
        item?.commit?.author?.date ||
        item?.commit?.committer?.date ||
        item?.commit?.committer_date ||
        null

    return {
        sha: item?.sha || String(Math.random()),
        message: item?.commit?.message || '(no message)',
        date: iso ? new Date(iso) : new Date(0),
        repoType: repoInfo.type // 'frontend' or 'backend'
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

const apiFetch = async (url, signal = null) => {
    const headers = { Accept: 'application/vnd.github+json' }
    if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`
    const opts = { headers }
    if (signal) opts.signal = signal
    const res = await fetch(url, opts)
    if (!res.ok) throw new Error(`GitHub API Error: ${res.status} ${res.statusText}`)
    return await res.json()
}

// ✅ 并发获取所有仓库的某一页
const fetchCommitsPage = async (page) => {
    // 为 REPO_LIST 中的每个仓库创建一个请求
    const promises = REPO_LIST.map(async (repo) => {
        try {
            const url = `https://api.github.com/repos/${USER_NAME}/${repo.name}/commits?sha=${repo.branch}&per_page=${perPage}&page=${page}`
            const data = await apiFetch(url)
            if (!Array.isArray(data)) return []
            // 标记来源
            return data.map(item => normalizeCommit(item, repo))
        } catch (e) {
            console.warn(`Fetch failed for ${repo.name}:`, e)
            return []
        }
    })

    const results = await Promise.all(promises)
    // 拍平数组并按时间倒序
    return results.flat().sort((a, b) => b.date - a.date)
}

// ✅ 并发获取所有仓库的月度数据 (用于热力图求和)
let monthAbortController = null
const fetchMonthCommits = async (targetDate) => {
    if (monthAbortController) monthAbortController.abort()
    monthAbortController = new AbortController()

    const { since, until } = getMonthBoundsISO(targetDate)

    // 内部函数：获取单个仓库整月数据
    const fetchSingleRepoMonth = async (repo) => {
        const pageSize = 100
        const maxPages = 5
        let page = 1
        let repoCommits = []

        while (page <= maxPages) {
            const url = `https://api.github.com/repos/${USER_NAME}/${repo.name}/commits` +
                `?sha=${repo.branch}&since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}` +
                `&per_page=${pageSize}&page=${page}`

            const data = await apiFetch(url, monthAbortController.signal)
            const arr = Array.isArray(data) ? data : []

            repoCommits = repoCommits.concat(arr.map(item => normalizeCommit(item, repo)))
            if (arr.length < pageSize) break
            page++
        }
        return repoCommits
    }

    try {
        const promises = REPO_LIST.map(repo => fetchSingleRepoMonth(repo))
        const results = await Promise.all(promises)
        // 合并所有结果
        return results.flat().sort((a, b) => b.date - a.date)
    } catch (err) {
        if (err.name === 'AbortError') return null
        throw err
    }
}

// ===================== computed =====================

// 1. 拆分 timelineCommits 为 [今天] 和 [历史]
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

// 2. 进一步拆分为 [前端] 和 [后端]

// Today
const todayFrontend = computed(() =>
    todayCommits.value.filter(item => item.repoType === 'frontend')
)
const todayBackend = computed(() =>
    todayCommits.value.filter(item => item.repoType === 'backend')
)

// History
const historyFrontend = computed(() =>
    historyCommits.value.filter(item => item.repoType === 'frontend')
)
const historyBackend = computed(() =>
    historyCommits.value.filter(item => item.repoType === 'backend')
)

// ===================== languages =====================
const hashColor = (str) => {
    let h = 0
    for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i)
    const c = (h >>> 0).toString(16).slice(0, 6).padEnd(6, '0')
    return `#${c}`
}

// 提取公共的 fetch language 逻辑
const fetchRepoLanguages = async (repoName, targetRef, filterFn = null) => {
    const url = `https://api.github.com/repos/${USER_NAME}/${repoName}/languages`
    const data = await apiFetch(url)
    if (!data || typeof data !== 'object') return

    const totalBytes = Object.values(data).reduce((sum, val) => sum + Number(val || 0), 0) || 1
    const colorMap = {
        Vue: '#41b883', JavaScript: '#f1e05a', TypeScript: '#3178c6',
        HTML: '#e34c26', CSS: '#563d7c', Python: '#3572A5', Dockerfile: "#384d54"
    }

    let list = Object.entries(data).map(([name, bytes]) => ({
        name,
        percent: Number(((bytes / totalBytes) * 100).toFixed(1)),
        color: colorMap[name] || hashColor(name)
    }))

    if (filterFn) {
        list = list.filter(filterFn)
    }

    targetRef.value = list.sort((a, b) => b.percent - a.percent)
}

// ===================== scroll / load more =====================
const loadMoreHistory = async () => {
    if (loadingMore.value || noMore.value) return
    loadingMore.value = true

    try {
        const nextPage = commitPage.value + 1
        // fetchCommitsPage 会同时拉取前后端的新一页并合并
        const nextNormalized = await fetchCommitsPage(nextPage)

        if (nextNormalized.length === 0) {
            noMore.value = true
            return
        }

        // 去重
        const existingShas = new Set(timelineCommits.value.map(x => x.sha))
        const newItems = nextNormalized.filter(x => !existingShas.has(x.sha))

        timelineCommits.value = [...timelineCommits.value, ...newItems]
        commitPage.value = nextPage

        // 如果合并后数据太少，说明两个仓库都快空了
        if (nextNormalized.length < 5) noMore.value = true
    } catch (e) {
        console.error('Load more failed', e)
    } finally {
        loadingMore.value = false
    }
}

// 任意一个滚动条触底都触发加载
const onHistoryScroll = (scrollEvent) => {
    // Element Plus scrollbar event returns { scrollTop, scrollLeft }
    // 但我们需要 wrap ref 来计算 scrollHeight
    // 这里简单处理：检查两个 ref
    const checkWrap = (wrap) => {
        if (!wrap) return false
        const threshold = 50
        return (wrap.scrollHeight - wrap.clientHeight - wrap.scrollTop < threshold)
    }

    const wrapLeft = historyScrollLeft.value?.wrapRef
    const wrapRight = historyScrollRight.value?.wrapRef

    if (checkWrap(wrapLeft) || checkWrap(wrapRight)) {
        loadMoreHistory()
    }
}

// ===================== Init =====================
const handleMonthChange = async (newDate) => {
    loadingMonth.value = true
    try {
        const data = await fetchMonthCommits(newDate)
        if (data !== null) {
            monthCommits.value = data
            calendarRef.value?.refresh?.()
        }
    } catch (e) {
        console.error(e)
        ElMessage.warning('获取月度数据失败')
    } finally {
        loadingMonth.value = false
    }
}

watch(() => currentMonthDate.value, handleMonthChange)

const initData = async () => {
    loading.value = true
    try {
        // 1. 并发请求：UserInfo, MonthData(merged), TimelineData(merged)
        const [user, monthData, timelineData] = await Promise.all([
            apiFetch(`https://api.github.com/users/${USER_NAME}`),
            fetchMonthCommits(currentMonthDate.value),
            fetchCommitsPage(1)
        ])

        userInfo.value = user
        monthCommits.value = monthData || []
        timelineCommits.value = timelineData

        if (timelineData.length < 10) noMore.value = true

        // 2. 获取语言
        // 前端
        const frontRepo = REPO_LIST.find(r => r.type === 'frontend')
        if (frontRepo) await fetchRepoLanguages(frontRepo.name, languageData)

        // 后端 (过滤规则)
        const backRepo = REPO_LIST.find(r => r.type === 'backend')
        if (backRepo) {
            await fetchRepoLanguages(backRepo.name, EndlanguageData, (item) => {
                if (['HTML', 'Dockerfile'].includes(item.name)) return false
                if (item.percent < 0.5) return false
                return true
            })
        }

    } catch (e) {
        console.error(e)
        ElMessage.error(e.message || '初始化数据失败')
    } finally {
        loading.value = false
    }
}

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
/* 基础容器 */
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
    height: 86vh;
}

.profile-card {
    flex: none;
}

/* 个人信息高度自适应 */
.chart-card {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

/* 图表填满剩余 */

/* 让 chart-card body 填满 */
.chart-card :deep(.el-card__body) {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 14px;
}

/* 右栏 */
.right-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 86vh;
    /* 固定总高度 */
}

.commit-section {
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* 左右分栏通用样式 */
.split-container {
    position: absolute;
    display: flex;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.split-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    height: 100%;
    border-right: 1px solid #f0f2f5;;
}

.split-col:last-child {
    border-right: none;
}

.split-divider {
    display: none;
}

.col-header {
    flex: none;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 700;
    border-bottom: 1px solid #f0f2f5;
    background: #fafafa;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.frontend-header {
    color: #409EFF;
}

.backend-header {
    color: #67C23A;
}

.col-scroll {
    flex: 1;
    height: 0;
    min-height: 0;
}

/* 今日动态卡片 (较矮) */
.today-card {
    display: flex;
    flex-direction: column;
    flex: 4;
    min-height: 0;
    overflow: hidden;
}

/* 历史记录卡片 (较高) */
.history-card {
    display: flex;
    flex-direction: column;
    flex: 6;
    min-height: 0;
    overflow: hidden;
}

.history-card :deep(.el-card__body),
.today-card :deep(.el-card__body) {
    padding: 0 !important;
    /* 分栏布局需要去掉 body padding 才能贴边 */
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    position: relative;
}

.card-body {
    flex: 1;
    min-height: 0;
    position: relative; /* 🔥 再次声明基准，双重保险 */
    width: 100%;
}

/* 列表项样式 */
.commit-list {
    padding: 6px 0;
}

.commit-item {
    padding: 10px 12px;
    border-bottom: 1px solid #eef2f7;
    transition: background 0.2s;
}

.commit-item:hover {
    background: #f7faff;
}

.commit-msg {
    font-size: 12px;
    margin-bottom: 4px;
    word-break: break-all;
    color: #1f2328;
}

.commit-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.commit-time {
    font-size: 11px;
    color: #c0c4cc;
}

/* Timeline 样式微调 */
.custom-timeline {
    padding: 12px 12px;
}

.history-msg {
    font-size: 12px;
    line-height: 1.5;
    color: #606266;
    word-break: break-all;
}

.load-more-mini {
    text-align: center;
    padding: 10px;
    font-size: 12px;
    color: #ccc;
}

/* 保持其他原有样式 */
.card-like {
    border: 1px solid #e5e7eb;
    background: #fff;
    border-radius: 2px;
    box-shadow: none;
    transition: box-shadow 0.18s ease;
}

.card-like:hover {
    border-color: #d0d7de;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.1);
}

.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.month-title {
    height: 20px;
}

.section-title {
    font-weight: 800;
    font-size: 14px;
}

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
    display: block;
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
}

.meta-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
    color: #909399;
}

.meta-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.divider {
    height: 1px;
    background: #eef2f7;
    margin: 14px 0 0 0;
}

.stats-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 10px 0 10px;
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

.chart-wrap {
    position: relative;
    flex: 1;
    min-height: 0;
}

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