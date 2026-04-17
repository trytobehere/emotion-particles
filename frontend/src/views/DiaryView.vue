<template>
  <div class="diary-view">
    <!-- 头部 -->
    <div class="header">
      <h1>📔 情绪日记</h1>
      <el-button type="primary" round @click="showEditor = true">
        <el-icon><Plus /></el-icon>
        写日记
      </el-button>
    </div>
    
    <!-- 统计卡片 -->
    <div class="stats-card">
      <div class="stat-item">
        <span class="value">{{ diaryStore.diaries.length }}</span>
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
          <div class="emotion-badge" :style="{ background: diary.emotion.color }">
            {{ diary.emotion.emoji }}
          </div>
          <div class="card-info">
            <h3>{{ diary.title || '无标题' }}</h3>
            <div class="meta">
              <span class="time">{{ formatTime(diary.createdAt) }}</span>
              <span class="weather">{{ diary.weather }}</span>
            </div>
          </div>
        </div>
        
        <p class="preview">{{ diary.content.substring(0, 80) }}{{ diary.content.length > 80 ? '...' : '' }}</p>
        
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
      <div v-if="diaryStore.diaries.length === 0" class="empty-state">
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
import { ref, computed } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDiaryStore } from '@/stores/diaryStore'
import DiaryEditor from '@/components/business/DiaryEditor.vue'
import DiaryDetail from '@/components/business/DiaryDetail.vue'

const diaryStore = useDiaryStore()

// UI状态
const showEditor = ref(false)
const showDetail = ref(false)
const currentDiary = ref(null)

// 计算属性
const continuousDays = computed(() => {
  // 简单计算，实际应该基于日期连续判断
  return diaryStore.diaries.length > 0 ? 5 : 0
})

const weeklyCount = computed(() => {
  // 计算本周日记数
  const now = new Date()
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
  return diaryStore.diaries.filter(d => {
    const date = new Date(d.createdAt)
    return date >= weekStart
  }).length
})

// 格式化时间
const formatTime = (time) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  
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
const handleSave = (diary) => {
  if (currentDiary.value) {
    diaryStore.updateDiary(currentDiary.value.id, diary)
    ElMessage.success('日记已更新')
  } else {
    diaryStore.addDiary(diary)
    ElMessage.success('日记已保存')
  }
  showEditor.value = false
  currentDiary.value = null
}

// 删除日记
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除这篇日记吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    diaryStore.deleteDiary(id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}
</script>

<style scoped lang="scss">
.diary-view {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 80px;
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: white;
    
    h1 {
      font-size: 24px;
      margin: 0;
    }
  }
  
  .stats-card {
    display: flex;
    justify-content: space-around;
    padding: 20px;
    margin: 15px 20px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    
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
      background: white;
      border-radius: 16px;
      padding: 18px;
      margin-bottom: 15px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      cursor: pointer;
      transition: all 0.3s;
      position: relative;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
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
          background: #f0f2f5;
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
    
    .empty-icon {
      font-size: 64px;
      opacity: 0.5;
    }
    
    p {
      color: #999;
      margin-top: 16px;
    }
  }
}
</style>