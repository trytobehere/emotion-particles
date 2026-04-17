<template>
  <div class="universe-view">
    <!-- 粒子流背景 -->
    <ParticleFlow />
    
    <!-- 树洞内容层 -->
    <div class="content-layer">
      <!-- 顶部操作栏 -->
      <div class="action-bar">
        <h2>🌌 情绪宇宙</h2>
        <el-button type="primary" round @click="showPublish = true">
          <el-icon><Edit /></el-icon>
          发布树洞
        </el-button>
      </div>
      
      <!-- 标签页 -->
      <el-tabs v-model="activeTab" class="universe-tabs">
        <el-tab-pane label="最新" name="latest">
          <div class="treehole-list">
            <TreeholeCard 
              v-for="post in posts" 
              :key="post.id"
              :post="post"
              @like="handleLike"
              @click="viewDetail(post)"
              @comment="viewDetail(post)"
            />
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="热门" name="hot">
          <div class="treehole-list">
            <TreeholeCard 
              v-for="post in hotPosts" 
              :key="post.id"
              :post="post"
              @like="handleLike"
              @click="viewDetail(post)"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    
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
        <TreeholeCard :post="currentPost" @like="handleLike" />
        
        <!-- 评论区 -->
        <div class="comment-section">
          <h4>评论 ({{ comments.length }})</h4>
          
          <div class="comment-list">
            <div v-for="comment in comments" :key="comment.id" class="comment-item">
              <span class="comment-user">{{ comment.user }}</span>
              <p class="comment-content">{{ comment.content }}</p>
              <span class="comment-time">{{ comment.time }}</span>
            </div>
          </div>
          
          <!-- 发表评论 -->
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
import { ref, computed } from 'vue'
import { Edit } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import ParticleFlow from '@/components/business/ParticleFlow.vue'
import TreeholeCard from '@/components/business/TreeholeCard.vue'

const activeTab = ref('latest')
const showPublish = ref(false)
const showDetail = ref(false)
const currentPost = ref(null)

// 模拟数据
const posts = ref([
  {
    id: 1,
    anonymousId: '星空旅行者',
    content: '今天完成了一个大项目，虽然很累但是很有成就感！',
    emotion: '😊',
    time: '5分钟前',
    likes: 24,
    comments: 5,
    liked: false
  },
  {
    id: 2,
    anonymousId: '雨后彩虹',
    content: '有时候觉得自己不够好，但想想每个人都有自己的节奏...',
    emotion: '😔',
    time: '15分钟前',
    likes: 18,
    comments: 8,
    liked: true
  },
  {
    id: 3,
    anonymousId: '清风徐来',
    content: '周末想去看海，有人一起吗？',
    emotion: '😌',
    time: '32分钟前',
    likes: 42,
    comments: 12,
    liked: false
  },
  {
    id: 4,
    anonymousId: '月光诗人',
    content: '刚看完一本好书，内心平静而充实。',
    emotion: '😌',
    time: '1小时前',
    likes: 15,
    comments: 3,
    liked: false
  }
])

// 热门排序
const hotPosts = computed(() => {
  return [...posts.value].sort((a, b) => b.likes - a.likes)
})

// 新帖
const newPost = ref({
  content: '',
  emotion: '😊'
})

const emotions = ['😊', '😌', '😫', '😰', '🤩', '😔']

// 评论数据
const comments = ref([
  { id: 1, user: '匿名用户A', content: '加油！', time: '2分钟前' },
  { id: 2, user: '匿名用户B', content: '我也是这样想的', time: '10分钟前' }
])
const newComment = ref('')

// 发布树洞
const publishPost = () => {
  posts.value.unshift({
    id: Date.now(),
    anonymousId: `匿名用户${Math.floor(Math.random() * 1000)}`,
    content: newPost.value.content,
    emotion: newPost.value.emotion,
    time: '刚刚',
    likes: 0,
    comments: 0,
    liked: false
  })
  
  ElMessage.success('发布成功')
  showPublish.value = false
  newPost.value = { content: '', emotion: '😊' }
}

// 点赞
const handleLike = (id) => {
  const post = posts.value.find(p => p.id === id)
  if (post) {
    post.liked = !post.liked
    post.likes += post.liked ? 1 : -1
  }
}

// 查看详情
const viewDetail = (post) => {
  currentPost.value = post
  showDetail.value = true
}

// 添加评论
const addComment = () => {
  if (!newComment.value.trim()) return
  
  comments.value.push({
    id: Date.now(),
    user: '我',
    content: newComment.value,
    time: '刚刚'
  })
  
  if (currentPost.value) {
    currentPost.value.comments++
  }
  
  newComment.value = ''
  ElMessage.success('评论成功')
}
</script>

<style scoped lang="scss">
.universe-view {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  
  .content-layer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    pointer-events: none;
    
    > * {
      pointer-events: auto;
    }
  }
  
  .action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    
    h2 {
      color: white;
      margin: 0;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }
  }
  
  .universe-tabs {
    flex: 1;
    padding: 0 20px;
    overflow: hidden;
    
    :deep(.el-tabs__header) {
      margin: 0;
    }
    
    :deep(.el-tabs__nav-wrap::after) {
      display: none;
    }
    
    :deep(.el-tabs__item) {
      color: rgba(255, 255, 255, 0.7);
      font-size: 16px;
      
      &.is-active {
        color: white;
      }
    }
    
    :deep(.el-tabs__active-bar) {
      background: white;
    }
    
    :deep(.el-tabs__content) {
      height: calc(100vh - 140px);
      overflow-y: auto;
      padding-bottom: 80px;
      
      &::-webkit-scrollbar {
        width: 4px;
      }
      
      &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 2px;
      }
    }
  }
  
  .treehole-list {
    padding: 10px 0;
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
  
  .detail-content {
    padding: 20px;
    padding-bottom: 100px;
    
    .comment-section {
      margin-top: 24px;
      
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
}
</style>