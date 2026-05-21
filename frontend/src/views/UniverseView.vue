<template>
  <div class="universe-view">
    <!-- 粒子流背景 -->
    <ParticleFlow />
    
    <!-- 顶部操作栏（居中） -->
    <div class="action-bar">
      <h2>🌌 情绪宇宙</h2>
      <el-button type="primary" round @click="showPublish = true">
        <el-icon><Edit /></el-icon>
        发布
      </el-button>
    </div>
    
    <!-- 展开树洞按钮（右下角） -->
    <div class="expand-float-btn" @click="toggleTreehole" v-if="!isTreeholeOpen">
      <span class="btn-icon">💬</span>
      <span class="btn-text">树洞</span>
    </div>
    
    <!-- 消息弹窗（可拖拽调整高度） -->
    <transition name="message-slide">
      <div 
        v-if="isTreeholeOpen" 
        class="message-panel"
        :style="{ height: panelHeight + 'px' }"
      >
        <!-- 拖拽手柄 -->
        <div class="drag-handle" @mousedown="startDrag">
          <span class="drag-bar"></span>
        </div>
        
        <div class="message-header">
          <span class="title">📬 树洞消息</span>
          <span class="close-btn" @click="toggleTreehole">✕</span>
        </div>
        <div class="message-list">
          <div 
            v-for="post in displayPosts" 
            :key="post.id"
            class="message-card"
            @click="viewDetail(post)"
          >
            <div class="message-left">
              <span class="emotion-badge" :style="{ background: getEmotionColor(post.emotion) }">
                {{ post.emotion }}
              </span>
            </div>
            <div class="message-right">
              <div class="message-header-info">
                <span class="anonymous-id">{{ post.anonymousId }}</span>
                <span class="time">{{ post.time }}</span>
              </div>
              <p class="message-content">{{ post.content }}</p>
              <div class="message-actions">
                <span class="action" @click.stop="handleLike(post.id)">
                  {{ post.liked ? '❤️' : '🤍' }} {{ post.likes }}
                </span>
                <span class="action" @click.stop="viewDetail(post)">
                  💬 {{ post.comments }}
                </span>
              </div>
            </div>
          </div>
          
          <div v-if="displayPosts.length === 0" class="empty-message">
            <span>📭 暂无树洞消息</span>
          </div>
        </div>
      </div>
    </transition>
    
    <!-- 发布抽屉 -->
    <el-drawer
      v-model="showPublish"
      title="发布树洞"
      direction="btt"
      size="70%"
    >
      <div class="publish-form">
        <el-input
          v-model="newPost.content"
          type="textarea"
          placeholder="分享你的心情...（匿名发布）"
          :rows="6"
          resize="none"
        />
        
        <div class="emotion-selector">
          <span class="label">此刻情绪：</span>
          <div class="emotion-options">
            <div 
              v-for="emo in emotions" 
              :key="emo"
              class="emotion-option"
              :class="{ active: newPost.emotion === emo }"
              @click="newPost.emotion = emo"
            >
              {{ emo }}
            </div>
          </div>
        </div>
        
        <div class="publish-footer">
          <el-button @click="showPublish = false">取消</el-button>
          <el-button type="primary" @click="publishPost" :disabled="!newPost.content">
            匿名发布
          </el-button>
        </div>
      </div>
    </el-drawer>
    
    <!-- 详情抽屉 -->
    <el-drawer
      v-model="showDetail"
      title="树洞详情"
      direction="btt"
      size="80%"
    >
      <div class="detail-content" v-if="currentPost">
        <div class="detail-card">
          <div class="detail-header">
            <span class="emotion-badge-large" :style="{ background: getEmotionColor(currentPost.emotion) }">
              {{ currentPost.emotion }}
            </span>
            <div class="detail-user">
              <span class="anonymous-id">{{ currentPost.anonymousId }}</span>
              <span class="time">{{ currentPost.time }}</span>
            </div>
          </div>
          <p class="detail-content-text">{{ currentPost.content }}</p>
          <div class="detail-actions">
            <span class="action" @click="handleLike(currentPost.id)">
              {{ currentPost.liked ? '❤️' : '🤍' }} {{ currentPost.likes }}
            </span>
            <span class="action">💬 {{ currentPost.comments }}</span>
          </div>
        </div>
        
        <div class="comment-section">
          <h4>评论 ({{ comments.length }})</h4>
          
          <div class="comment-list">
            <div v-for="comment in comments" :key="comment.id" class="comment-item">
              <span class="comment-user">{{ comment.user }}</span>
              <p class="comment-content">{{ comment.content }}</p>
              <span class="comment-time">{{ comment.time }}</span>
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
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Edit } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import ParticleFlow from '@/components/business/ParticleFlow.vue'
import request from '@/utils/request'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()

const showPublish = ref(false)
const showDetail = ref(false)
const currentPost = ref(null)
const isTreeholeOpen = ref(false)
const loading = ref(false)

// ========== 拖拽调整高度 ==========
const panelHeight = ref(400)  // 默认高度 400px
const isDragging = ref(false)
const startY = ref(0)
const startHeight = ref(0)
const maxHeight = ref(window.innerHeight * 0.85)
const minHeight = ref(250)

const startDrag = (e) => {
  isDragging.value = true
  startY.value = e.clientY
  startHeight.value = panelHeight.value
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.body.style.cursor = 'ns-resize'
  document.body.style.userSelect = 'none'
}

const onDrag = (e) => {
  if (!isDragging.value) return
  
  const deltaY = startY.value - e.clientY  // 向上拖增加高度
  let newHeight = startHeight.value + deltaY
  
  // 限制高度范围
  newHeight = Math.max(minHeight.value, Math.min(maxHeight.value, newHeight))
  panelHeight.value = newHeight
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  
  // 保存高度到本地
  localStorage.setItem('treeholePanelHeight', panelHeight.value)
}

// 窗口大小变化时更新最大高度
const updateMaxHeight = () => {
  maxHeight.value = window.innerHeight * 0.85
  // 如果当前高度超过新的最大高度，调整它
  if (panelHeight.value > maxHeight.value) {
    panelHeight.value = maxHeight.value
  }
}

// ========== 树洞列表数据 ==========
const posts = ref([])

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

// ========== 获取树洞列表 ==========
const fetchTreeholes = async () => {
  loading.value = true
  try {
    const res = await request.get('/treeholes', {
      params: { page: 1, size: 50, sort: 'new' }
    })
    posts.value = (res.data?.content || res.data || []).map(item => ({
      id: item.id,
      anonymousId: item.anonymousId,
      content: item.content,
      emotion: item.tagEmoji || '😊',
      time: formatTime(item.createdAt),
      likes: item.likeCount || 0,
      comments: item.commentCount || 0,
      liked: false,
      tagId: item.tagId
    }))
  } catch (error) {
    console.error('获取树洞失败', error)
  } finally {
    loading.value = false
  }
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

const displayPosts = computed(() => {
  return [...posts.value].sort((a, b) => b.id - a.id)
})

// ========== 发布树洞 ==========
const newPost = ref({
  content: '',
  emotion: '😊'
})

const emotionToTagId = {
  '😊': 1, '😌': 2, '😫': 3, '😰': 4, '🤩': 5, '😔': 6
}

const emotions = ['😊', '😌', '😫', '😰', '🤩', '😔']

const publishPost = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  if (!newPost.value.content.trim()) {
    ElMessage.warning('请输入内容')
    return
  }
  try {
    const tagId = emotionToTagId[newPost.value.emotion] || 1
    await request.post('/treeholes', { content: newPost.value.content, tagId })
    ElMessage.success('发布成功')
    showPublish.value = false
    newPost.value = { content: '', emotion: '😊' }
    await fetchTreeholes()
    isTreeholeOpen.value = true
  } catch (error) {
    console.error('发布失败', error)
    ElMessage.error('发布失败，请重试')
  }
}

// ========== 点赞 ==========
const handleLike = async (id) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  const post = posts.value.find(p => p.id === id)
  if (!post) return
  try {
    const res = await request.post(`/treeholes/${id}/like`)
    const data = res.data || res
    post.liked = data.liked
    post.likes = data.likeCount
  } catch (error) {
    console.error('点赞失败', error)
  }
}

// ========== 查看详情 ==========
const viewDetail = (post) => {
  currentPost.value = post
  showDetail.value = true
  fetchComments(post.id)
}

// ========== 评论 ==========
const comments = ref([])
const newComment = ref('')

const fetchComments = async (treeholeId) => {
  try {
    const res = await request.get(`/treeholes/${treeholeId}/comments`)
    comments.value = (res.data || []).map(item => ({
      id: item.id,
      user: item.anonymousId,
      content: item.content,
      time: formatTime(item.createdAt)
    }))
  } catch (error) {
    console.error('获取评论失败', error)
    comments.value = []
  }
}

const addComment = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  if (!newComment.value.trim()) return
  try {
    await request.post(`/treeholes/${currentPost.value.id}/comments`, {
      content: newComment.value
    })
    comments.value.push({
      id: Date.now(),
      user: '我',
      content: newComment.value,
      time: '刚刚'
    })
    if (currentPost.value) currentPost.value.comments++
    newComment.value = ''
    ElMessage.success('评论成功')
  } catch (error) {
    console.error('评论失败', error)
    ElMessage.error('评论失败')
  }
}

// 切换树洞弹窗
const toggleTreehole = () => {
  isTreeholeOpen.value = !isTreeholeOpen.value
  if (isTreeholeOpen.value && posts.value.length === 0) {
    fetchTreeholes()
  }
}

onMounted(() => {
  // 恢复保存的高度
  const savedHeight = localStorage.getItem('treeholePanelHeight')
  if (savedHeight) {
    panelHeight.value = parseInt(savedHeight)
  }
  window.addEventListener('resize', updateMaxHeight)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateMaxHeight)
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
})
</script>

<style scoped lang="scss">
.universe-view {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.action-bar {
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  
  h2 {
    color: white;
    margin: 0 0 12px 0;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    font-size: 24px;
  }
}

.expand-float-btn {
  position: fixed;
  bottom: 100px;
  right: 20px;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  cursor: pointer;
  z-index: 100;
  transition: all 0.3s;
  
  &:hover {
    transform: scale(1.05);
  }
  
  .btn-icon {
    font-size: 24px;
    color: white;
  }
  
  .btn-text {
    font-size: 10px;
    color: white;
  }
}

// 消息弹窗
.message-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  min-height: 250px;
  max-height: 85vh;
  background: rgba(20, 20, 35, 0.25);
  backdrop-filter: blur(15px);
  border-radius: 30px 30px 0 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.2);
  transition: height 0.1s ease;
  
  // 拖拽手柄
  .drag-handle {
    display: flex;
    justify-content: center;
    padding: 8px 0 4px;
    cursor: ns-resize;
    
    .drag-bar {
      width: 40px;
      height: 4px;
      background: rgba(255, 255, 255, 0.4);
      border-radius: 2px;
      transition: background 0.2s;
    }
    
    &:hover .drag-bar {
      background: rgba(255, 255, 255, 0.7);
      width: 50px;
    }
  }
  
  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 20px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    
    .title {
      font-size: 18px;
      font-weight: 600;
      color: white;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    
    .close-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 16px;
      background: rgba(0, 0, 0, 0.2);
      cursor: pointer;
      color: white;
      
      &:hover {
        background: rgba(0, 0, 0, 0.3);
      }
    }
  }
  
  .message-list {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    
    &::-webkit-scrollbar {
      width: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
    }
  }
  
  .message-card {
    display: flex;
    gap: 12px;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(5px);
    border-radius: 20px;
    padding: 14px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid rgba(255, 255, 255, 0.08);
    
    &:hover {
      background: rgba(255, 255, 255, 0.12);
      transform: translateX(4px);
      border-color: rgba(255, 255, 255, 0.15);
    }
    
    .message-left {
      .emotion-badge {
        width: 50px;
        height: 50px;
        border-radius: 25px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
    }
    
    .message-right {
      flex: 1;
      
      .message-header-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
        
        .anonymous-id {
          color: white;
          font-size: 13px;
          font-weight: 500;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        }
        
        .time {
          color: rgba(255, 255, 255, 0.7);
          font-size: 11px;
        }
      }
      
      .message-content {
        color: rgba(255, 255, 255, 0.95);
        font-size: 14px;
        line-height: 1.4;
        margin: 0 0 8px 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
      }
      
      .message-actions {
        display: flex;
        gap: 16px;
        
        .action {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.2s;
          
          &:hover {
            color: white;
          }
        }
      }
    }
  }
  
  .empty-message {
    text-align: center;
    padding: 40px;
    color: rgba(255, 255, 255, 0.7);
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  }
}

// 详情样式
.detail-content {
  padding: 20px;
  padding-bottom: 100px;
  
  .detail-card {
    background: #f5f7fa;
    border-radius: 20px;
    padding: 20px;
    margin-bottom: 20px;
    
    .detail-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      
      .emotion-badge-large {
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
      max-height: 300px;
      overflow-y: auto;
      
      .comment-item {
        padding: 12px;
        background: #f5f7fa;
        border-radius: 12px;
        margin-bottom: 10px;
        
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
    }
  }
}

.publish-form {
  padding: 20px;
  
  .emotion-selector {
    margin-top: 20px;
    
    .label {
      display: block;
      margin-bottom: 12px;
      color: #666;
    }
    
    .emotion-options {
      display: flex;
      gap: 12px;
      
      .emotion-option {
        font-size: 28px;
        padding: 8px;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s;
        opacity: 0.5;
        
        &.active {
          opacity: 1;
          background: rgba(102, 126, 234, 0.1);
          transform: scale(1.1);
        }
        
        &:hover {
          opacity: 0.8;
        }
      }
    }
  }
  
  .publish-footer {
    display: flex;
    gap: 12px;
    margin-top: 30px;
    
    .el-button {
      flex: 1;
      height: 48px;
    }
  }
}

.message-slide-enter-active,
.message-slide-leave-active {
  transition: all 0.3s ease;
}

.message-slide-enter-from,
.message-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>