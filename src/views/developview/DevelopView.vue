<template>
    <div class="github-log-card">
        <el-card>
            <template #header>
                <div class="card-header">
                    <span>🛠️ 开发进度 (分支: {{ BRANCH }})</span>
                    <el-button text bg size="small" :loading="loading" @click="getCommits">
                        刷新日志
                    </el-button>
                </div>
            </template>

            <div v-if="loading" style="padding: 20px;">
                <el-skeleton :rows="3" animated />
            </div>

            <el-timeline v-else>
                <el-timeline-item v-for="(item, index) in commits" :key="item.sha"
                    :timestamp="formatTime(item.commit.author.date)" placement="top"
                    :type="index === 0 ? 'success' : ''" :hollow="index === 0">
                    <div class="log-content">
                        <p class="message">{{ item.commit.message }}</p>

                        <div class="meta">
                            <span class="author">
                                <img :src="item.author ? item.author.avatar_url : ''" class="avatar" />
                                {{ item.commit.author.name }}
                            </span>
                            <a :href="item.html_url" target="_blank" class="link">
                                查看代码 #{{ item.sha.substring(0, 7) }}
                            </a>
                        </div>
                    </div>
                </el-timeline-item>
            </el-timeline>
        </el-card>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// ---------------------------------------------
// ✅ 这里我已经根据你的 URL 帮你填好了
// ---------------------------------------------
const USER_NAME = 'S12-666'
const REPO_NAME = 'vue-vite'
const BRANCH = 'my-system'  // <-- 关键！你的链接里显示的特定分支
// ---------------------------------------------

const commits = ref([])
const loading = ref(false)

const getCommits = async () => {
    loading.value = true
    try {
        // 加上 timestamp 参数防止浏览器缓存 API 请求
        const t = new Date().getTime()
        // 注意：这里加了 sha=${BRANCH} 参数，确保拉取的是 my-system 分支的记录
        const url = `https://api.github.com/repos/${USER_NAME}/${REPO_NAME}/commits?sha=${BRANCH}&per_page=10&t=${t}`

        const res = await fetch(url)
        if (!res.ok) throw new Error(`请求失败: ${res.statusText}`)

        const data = await res.json()
        commits.value = data
    } catch (error) {
        console.error('获取日志失败:', error)
    } finally {
        loading.value = false
    }
}

// 简单的时间格式化
const formatTime = (isoStr) => {
    const date = new Date(isoStr)
    return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// 页面加载时自动拉取
onMounted(() => {
    getCommits()
})
</script>

<style scoped>
/* 简单的样式优化 */
.github-log-card {
    max-width: 800px;
    margin: 20px auto;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.log-content {
    background: #f8f9fa;
    /* 浅灰色背景 */
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #ebeef5;
}

.message {
    font-weight: 600;
    margin: 0 0 8px 0;
    color: #2c3e50;
    font-size: 14px;
}

.meta {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #909399;
}

.author {
    display: flex;
    align-items: center;
    gap: 6px;
}

.avatar {
    width: 18px;
    height: 18px;
    border-radius: 50%;
}

.link {
    color: #409eff;
    text-decoration: none;
    font-family: monospace;
    /* 代码字体 */
}

.link:hover {
    text-decoration: underline;
}
</style>