<template>
  <div class="dashboard-view">
    <!-- 头部 -->
    <div class="header">
      <h1>📊 数据看板</h1>
      <el-select v-model="timeRange" size="small" class="time-select">
        <el-option label="近7天" value="week" />
        <el-option label="近30天" value="month" />
        <el-option label="全部" value="all" />
      </el-select>
    </div>
    
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📝</div>
        <div class="stat-content">
          <span class="stat-value">{{ totalDiaries }}</span>
          <span class="stat-label">总日记数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔥</div>
        <div class="stat-content">
          <span class="stat-value">{{ continuousDays }}</span>
          <span class="stat-label">连续记录</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">😊</div>
        <div class="stat-content">
          <span class="stat-value">{{ avgMood }}</span>
          <span class="stat-label">平均情绪值</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏷️</div>
        <div class="stat-content">
          <span class="stat-value">{{ topTag }}</span>
          <span class="stat-label">高频标签</span>
        </div>
      </div>
    </div>
    
    <!-- 趋势图 -->
    <MoodTrendChart :data="trendData" />
    
    <!-- 饼图 -->
    <MoodPieChart :data="pieData" />
    
    <!-- 日历热力图 -->
    <CalendarHeatmap :records="calendarRecords" />
    
    <!-- 情绪洞察卡片 -->
    <div class="insight-card">
      <h3>💡 情绪洞察</h3>
      <div class="insight-content">
        <p>{{ insight }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDiaryStore } from '@/stores/diaryStore'
import MoodTrendChart from '@/components/charts/MoodTrendChart.vue'
import MoodPieChart from '@/components/charts/MoodPieChart.vue'
import CalendarHeatmap from '@/components/charts/CalendarHeatmap.vue'

const diaryStore = useDiaryStore()
const timeRange = ref('week')

// 总日记数
const totalDiaries = computed(() => diaryStore.diaries.length)

// 连续记录天数（模拟）
const continuousDays = computed(() => {
  return diaryStore.diaries.length > 0 ? Math.min(7, diaryStore.diaries.length) : 0
})

// 平均情绪值
const avgMood = computed(() => {
  const diaries = diaryStore.diaries
  if (diaries.length === 0) return '0.0'
  const sum = diaries.reduce((acc, d) => acc + (d.emotion?.value || 3), 0)
  return (sum / diaries.length).toFixed(1)
})

// 高频标签
const topTag = computed(() => {
  const tagCount = {}
  diaryStore.diaries.forEach(d => {
    d.tags?.forEach(tag => {
      tagCount[tag] = (tagCount[tag] || 0) + 1
    })
  })
  
  let maxTag = '暂无'
  let maxCount = 0
  Object.entries(tagCount).forEach(([tag, count]) => {
    if (count > maxCount) {
      maxTag = tag
      maxCount = count
    }
  })
  return maxTag
})

// 趋势数据（模拟）
const trendData = computed(() => {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const diaries = diaryStore.diaries
  
  return days.map((day, index) => {
    const recentDiaries = diaries.filter(d => {
      const date = new Date(d.createdAt)
      return date.getDay() === index + 1
    })
    
    const avgValue = recentDiaries.length > 0
      ? recentDiaries.reduce((acc, d) => acc + (d.emotion?.value || 3), 0) / recentDiaries.length
      : 2 + Math.random() * 3
    
    return {
      date: day,
      value: parseFloat(avgValue.toFixed(1))
    }
  })
})

// 饼图数据
const pieData = computed(() => {
  const emotionCount = {}
  diaryStore.diaries.forEach(d => {
    const label = d.emotion?.label || '平静'
    emotionCount[label] = (emotionCount[label] || 0) + 1
  })
  
  const emotionMap = {
    '开心': { color: '#FFD93D' },
    '平静': { color: '#6BCB77' },
    '疲惫': { color: '#9B9B9B' },
    '焦虑': { color: '#FF9F9F' },
    '兴奋': { color: '#FF6B6B' },
    '低落': { color: '#A78BFA' }
  }
  
  return Object.entries(emotionCount).map(([name, value]) => ({
    name,
    value,
    itemStyle: { color: emotionMap[name]?.color || '#999' }
  }))
})

// 日历数据
const calendarRecords = computed(() => {
  const now = new Date()
  return diaryStore.diaries
    .filter(d => {
      const date = new Date(d.createdAt)
      return date.getMonth() === now.getMonth()
    })
    .map(d => ({
      day: new Date(d.createdAt).getDate(),
      intensity: d.emotion?.value || 3,
      emoji: d.emotion?.emoji || '😊'
    }))
})

// 洞察文本
const insight = computed(() => {
  const count = diaryStore.diaries.length
  const avg = parseFloat(avgMood.value)
  
  if (count === 0) {
    return '还没有日记记录，开始记录你的第一份情绪吧！'
  }
  
  if (avg >= 4) {
    return '最近情绪状态很好！保持积极心态，继续记录美好时刻。'
  } else if (avg >= 2.5) {
    return '情绪状态平稳，偶尔的波动是正常的，记得照顾好自己。'
  } else {
    return '最近情绪有些低落，试试运动、听音乐或和朋友聊聊天。'
  }
})
</script>

<style scoped lang="scss">
.dashboard-view {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px 20px 80px;
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h1 {
      font-size: 24px;
      margin: 0;
    }
    
    .time-select {
      width: 120px;
    }
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 20px;
    
    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      
      .stat-icon {
        font-size: 32px;
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
      }
      
      .stat-content {
        display: flex;
        flex-direction: column;
        
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #333;
        }
        
        .stat-label {
          font-size: 12px;
          color: #999;
          margin-top: 2px;
        }
      }
    }
  }
  
  .insight-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    padding: 20px;
    margin-top: 16px;
    color: white;
    
    h3 {
      margin: 0 0 12px 0;
      font-size: 18px;
    }
    
    p {
      margin: 0;
      line-height: 1.6;
      opacity: 0.95;
    }
  }
}
</style>