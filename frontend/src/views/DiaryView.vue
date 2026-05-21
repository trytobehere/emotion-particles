<template>
  <div class="diary-view" :style="bgStyle">
     <!-- 聊天 AI 组件 -->
    <DiaryChat />

    <!-- 头部 -->
    <div class="header">
      <h1>📔 情绪日记</h1>
      <el-button type="primary" round @click="showEditor = true">
        <el-icon><Plus /></el-icon>
        写日记
      </el-button>
    </div>
    
    <!-- 新增：今日建议 -->
    <div v-if="todaySuggestion" class="today-suggestion">
      <div class="suggestion-header">
        <span class="icon">💡</span>
        <span class="title">今日建议</span>
      </div>
      <p class="suggestion-content">{{ todaySuggestion }}</p>
    </div>
    
    <!-- 统计卡片 -->
    <div class="stats-card">
      <div class="stat-item">
        <span class="value">{{ diaryStore.diaries?.length || 0 }}</span>
        <span class="label">总日记</span>
      </div>
      <div class="stat-item">
        <span class="value">{{ continuousDays }}</span>
        <span class="label">连续记录</span>
      </div>
      <div class="stat-item">
        <span class="value">{{ weeklyCount }}</span>
        <span class="label">本周</span>
      </div>
    </div>
    
    <!-- 日记列表 -->
    <div class="diary-list">
      <div 
        v-for="diary in diaryStore.diaries" 
        :key="diary.id"
        class="diary-card"
        @click="viewDiary(diary)"
      >
        <div class="card-header">
          <div class="emotion-badge" :style="{ background: diary.emotion?.color || '#6BCB77' }">
            {{ diary.emotion?.emoji || '😊' }}
          </div>
          <div class="card-info">
            <h3>{{ diary.title || '无标题' }}</h3>
            <div class="meta">
              <span class="time">{{ formatTime(diary.createdAt) }}</span>
              <span class="weather">{{ diary.weather || '晴' }}</span>
            </div>
          </div>
        </div>
        
        <p class="preview">{{ diary.contentPreview || (diary.content?.substring(0, 80) || '') }}{{ diary.content?.length > 80 ? '...' : '' }}</p>
        
        <div class="tags" v-if="diary.tags?.length">
          <span v-for="tag in diary.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
        
        <div class="card-footer">
          <el-button type="danger" link @click.stop="handleDelete(diary.id)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-if="!diaryStore.diaries || diaryStore.diaries.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>还没有日记，点击上方按钮写一篇吧</p>
      </div>
    </div>
    
    <!-- 日记编辑器抽屉 -->
    <el-drawer
      v-model="showEditor"
      title="写日记"
      direction="btt"
      size="90%"
      :close-on-click-modal="false"
    >
      <DiaryEditor 
        :diary="currentDiary"
        @save="handleSave"
        @cancel="showEditor = false"
      />
    </el-drawer>
    
    <!-- 日记详情抽屉 -->
    <el-drawer
      v-model="showDetail"
      title="日记详情"
      direction="btt"
      size="90%"
    >
      <DiaryDetail 
        v-if="currentDiary"
        :diary="currentDiary"
        @close="showDetail = false"
      />
    </el-drawer>
  </div>
</template>

<script setup>
import DiaryChat from '@/components/business/DiaryChat.vue'
import { ref, computed, onMounted } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDiaryStore } from '@/stores/diaryStore'
import DiaryEditor from '@/components/business/DiaryEditor.vue'
import DiaryDetail from '@/components/business/DiaryDetail.vue'
import bgImage from '@/assets/2.png'

const diaryStore = useDiaryStore()

// 背景样式
const bgStyle = {
  backgroundImage: `url(${bgImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundAttachment: 'fixed'
}

// UI状态
const showEditor = ref(false)
const showDetail = ref(false)
const currentDiary = ref(null)

// 今日建议
const todaySuggestion = ref('')

// 计算属性
const continuousDays = computed(() => {
  return diaryStore.diaries?.length > 0 ? 5 : 0
})

const weeklyCount = computed(() => {
  if (!diaryStore.diaries) return 0
  const now = new Date()
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
  return diaryStore.diaries.filter(d => {
    const date = new Date(d.createdAt)
    return date >= weekStart
  }).length
})

// 格式化时间
const formatTime = (time) => {
  if (!time) return '刚刚'
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  
  if (isNaN(date.getTime())) return '刚刚'
  
  if (diff < 3600000) {
    return Math.floor(diff / 60000) + '分钟前'
  } else if (diff < 86400000) {
    return Math.floor(diff / 3600000) + '小时前'
  } else if (diff < 604800000) {
    return Math.floor(diff / 86400000) + '天前'
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

// 查看日记
const viewDiary = (diary) => {
  currentDiary.value = diary
  showDetail.value = true
}

// 保存日记
const handleSave = async (diary) => {
  try {
    if (currentDiary.value) {
      await diaryStore.updateDiary(currentDiary.value.id, diary)
      ElMessage.success('日记已更新')
    } else {
      await diaryStore.addDiary(diary)
      ElMessage.success('日记已保存')
    }
    showEditor.value = false
    currentDiary.value = null
  } catch (error) {
    ElMessage.error('保存失败，请重试')
  }
}

// 删除日记
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除这篇日记吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await diaryStore.deleteDiary(id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

// 加载数据
onMounted(() => {
  diaryStore.fetchDiaries()
  
  // 生成今日建议（基于最近的一篇日记）
  setTimeout(async () => {
    if (diaryStore.diaries.length > 0) {
      const latest = diaryStore.diaries[0]
      const emotionLabel = latest.emotion?.label || '中性'
      todaySuggestion.value = await diaryStore.generateSuggestion(latest.content, emotionLabel)
    }
  }, 1000)
})
</script>

<style scoped lang="scss">
.diary-view {
  min-height: 100vh;
  padding-bottom: 80px;
  
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 0;
  }
  
  .header,
  .today-suggestion,
  .stats-card,
  .diary-list,
  .empty-state {
    position: relative;
    z-index: 1;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: transparent;
    
    h1 {
      font-size: 24px;
      margin: 0;
      color: white;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }
  }
  
  .today-suggestion {
    margin: 0 20px 15px;
    padding: 16px 20px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    border-left: 4px solid #667eea;
    
    .suggestion-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
      
      .icon {
        font-size: 20px;
      }
      
      .title {
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }
    }
    
    .suggestion-content {
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
      color: #666;
    }
  }
  
  .stats-card {
    display: flex;
    justify-content: space-around;
    padding: 20px;
    margin: 15px 20px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .value {
        font-size: 28px;
        font-weight: 700;
        color: #667eea;
      }
      
      .label {
        font-size: 13px;
        color: #999;
        margin-top: 4px;
      }
    }
  }
  
  .diary-list {
    padding: 0 20px;
    
    .diary-card {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 18px;
      margin-bottom: 15px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: all 0.3s;
      position: relative;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
        background: rgba(255, 255, 255, 0.95);
      }
      
      .card-header {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;
        
        .emotion-badge {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }
        
        .card-info {
          flex: 1;
          
          h3 {
            font-size: 16px;
            margin: 0 0 6px 0;
            font-weight: 600;
            color: #333;
          }
          
          .meta {
            display: flex;
            gap: 12px;
            font-size: 12px;
            color: #999;
          }
        }
      }
      
      .preview {
        font-size: 14px;
        color: #666;
        line-height: 1.5;
        margin: 0 0 12px 0;
      }
      
      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        
        .tag {
          padding: 4px 12px;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 12px;
          font-size: 12px;
          color: #666;
        }
      }
      
      .card-footer {
        position: absolute;
        bottom: 12px;
        right: 12px;
      }
    }
  }
  
  .empty-state {
    text-align: center;
    padding: 60px 20px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    margin: 20px;
    
    .empty-icon {
      font-size: 64px;
      opacity: 0.5;
    }
    
    p {
      color: #666;
      margin-top: 16px;
    }
  }
}
</style>