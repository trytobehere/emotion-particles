<template>
  <div class="treehole-detail-view">
    <!-- 顶部导航 -->
    <div class="header">
      <el-button link @click="router.back()">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h1>🌌 树洞详情</h1>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    
    <div v-else-if="post" class="detail-content">
      <!-- 树洞卡片 -->
      <div class="detail-card">
        <div class="detail-header">
          <span class="emotion-badge" :style="{ background: getEmotionColor(post.emotion) }">
            {{ post.emotion }}
          </span>
          <div class="detail-user">
            <span class="anonymous-id">{{ post.anonymousId }}</span>
            <span class="time">{{ post.time }}</span>
          </div>
        </div>
        <p class="detail-content-text">{{ post.content }}</p>
        <div class="detail-actions">
          <span class="action" @click="handleLike(post.id)">
            {{ post.liked ? '❤️' : '🤍' }} {{ post.likes }}
          </span>
          <span class="action">💬 {{ post.comments }}</span>
        </div>
      </div>
      
      <!-- 评论列表 -->
      <div class="comment-section">
        <h4>评论 ({{ comments.length }})</h4>
        
        <div class="comment-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <span class="comment-user">{{ comment.anonymousId }}</span>
            <p class="comment-content">{{ comment.content }}</p>
            <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
          </div>
        </div>
        
        <div class="comment-input">
          <el-input
            v-model="newComment"
            placeholder="写下你的评论..."
            @keyup.enter="addComment"
          >
            <template #append>
              <el-button @click="addComment">发送</el-button>
            </template>
          </el-input>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const post = ref(null)
const comments = ref([])
const newComment = ref('')
const loading = ref(true)

// 获取树洞详情
const fetchTreeholeDetail = async () => {
  const id = route.params.id
  loading.value = true
  try {
    const res = await request.get(`/treeholes/${id}`)
    const data = res.data
    post.value = {
      id: data.id,
      anonymousId: data.anonymousId,
      content: data.content,
      emotion: data.tagEmoji || '😊',
      time: formatTime(data.createdAt),
      likes: data.likeCount || 0,
      comments: data.commentCount || 0,
      liked: false,
      tagId: data.tagId
    }
    await fetchComments(id)
  } catch (error) {
    ElMessage.error('加载失败')
    router.back()
  } finally {
    loading.value = false
  }
}

// 获取评论
const fetchComments = async (treeholeId) => {
  try {
    const res = await request.get(`/treeholes/${treeholeId}/comments`)
    comments.value = (res.data || []).map(item => ({
      id: item.id,
      anonymousId: item.anonymousId,
      content: item.content,
      createdAt: item.createdAt
    }))
  } catch (error) {
    comments.value = []
  }
}

// 点赞
const handleLike = async (id) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  try {
    const res = await request.post(`/treeholes/${id}/like`)
    const data = res.data
    post.value.liked = data.liked
    post.value.likes = data.likeCount
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 评论
const addComment = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  if (!newComment.value.trim()) return
  try {
    await request.post(`/treeholes/${route.params.id}/comments`, {
      content: newComment.value
    })
    comments.value.push({
      id: Date.now(),
      anonymousId: '我',
      content: newComment.value,
      createdAt: new Date()
    })
    if (post.value) post.value.comments++
    newComment.value = ''
    ElMessage.success('评论成功')
  } catch (error) {
    ElMessage.error('评论失败')
  }
}

// 情绪颜色映射
const getEmotionColor = (emotion) => {
  const colors = {
    '😊': '#FFD93D',
    '😌': '#6BCB77',
    '😫': '#9B9B9B',
    '😰': '#FF9F9F',
    '🤩': '#FF6B6B',
    '😔': '#A78BFA'
  }
  return colors[emotion] || '#999'
}

// 格式化时间
const formatTime = (dateStr) => {
  if (!dateStr) return '刚刚'
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
  return date.toLocaleDateString('zh-CN')
}

onMounted(() => {
  fetchTreeholeDetail()
})
</script>

<style scoped lang="scss">
.treehole-detail-view {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px 20px 100px;
  
  .header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    
    h1 {
      font-size: 20px;
      margin: 0;
    }
  }
  
  .loading {
    text-align: center;
    padding: 60px;
    color: #999;
  }
  
  .detail-card {
    background: white;
    border-radius: 20px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    
    .detail-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      
      .emotion-badge {
        width: 50px;
        height: 50px;
        border-radius: 25px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
      }
      
      .detail-user {
        .anonymous-id {
          display: block;
          font-weight: 600;
          color: #333;
        }
        
        .time {
          font-size: 11px;
          color: #999;
        }
      }
    }
    
    .detail-content-text {
      color: #333;
      line-height: 1.6;
      margin: 0 0 16px 0;
      white-space: pre-wrap;
    }
    
    .detail-actions {
      display: flex;
      gap: 20px;
      
      .action {
        font-size: 14px;
        color: #999;
        cursor: pointer;
        
        &:hover {
          color: #667eea;
        }
      }
    }
  }
  
  .comment-section {
    h4 {
      color: #333;
      margin-bottom: 16px;
    }
    
    .comment-list {
      margin-bottom: 20px;
      max-height: 400px;
      overflow-y: auto;
      
      .comment-item {
        padding: 12px;
        background: white;
        border-radius: 12px;
        margin-bottom: 10px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
        
        .comment-user {
          font-weight: 600;
          color: #667eea;
          font-size: 13px;
        }
        
        .comment-content {
          margin: 6px 0;
          color: #333;
          font-size: 14px;
        }
        
        .comment-time {
          font-size: 11px;
          color: #999;
        }
      }
    }
    
    .comment-input {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 16px 20px;
      background: white;
      border-top: 1px solid #eee;
      z-index: 100;
    }
  }
}
</style>