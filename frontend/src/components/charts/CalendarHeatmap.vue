<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3>📅 打卡日历</h3>
      <span class="subtitle">{{ currentMonth }}</span>
    </div>
    <div class="calendar-grid">
      <div class="weekdays">
        <span v-for="day in weekdays" :key="day">{{ day }}</span>
      </div>
      <div class="days">
        <div 
          v-for="(day, index) in calendarDays" 
          :key="index"
          class="day-cell"
          :class="{
            'has-record': day.hasRecord,
            'today': day.isToday,
            'empty': !day.date
          }"
          :style="{ background: getDayColor(day.intensity) }"
        >
          <span class="day-number">{{ day.date }}</span>
          <span v-if="day.hasRecord" class="emoji-indicator">{{ day.emoji }}</span>
        </div>
      </div>
    </div>
    <div class="legend">
      <span class="legend-label">情绪强度</span>
      <div class="legend-items">
        <div class="legend-item" v-for="level in intensityLevels" :key="level.value">
          <div class="color-block" :style="{ background: level.color }"></div>
          <span>{{ level.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  records: {
    type: Array,
    default: () => []
  }
})

const weekdays = ['一', '二', '三', '四', '五', '六', '日']

const intensityLevels = [
  { value: 0, label: '无记录', color: '#f5f5f5' },
  { value: 1, label: '低落', color: '#A78BFA' },
  { value: 2, label: '一般', color: '#9B9B9B' },
  { value: 3, label: '平静', color: '#6BCB77' },
  { value: 4, label: '愉悦', color: '#FFD93D' },
  { value: 5, label: '兴奋', color: '#FF6B6B' }
]

const currentMonth = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月`
})

// 生成日历数据
const calendarDays = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  let startDay = firstDay.getDay() || 7 // 周一为1，周日为7
  const days = []
  
  // 填充上月末尾
  for (let i = 1; i < startDay; i++) {
    days.push({ date: null, hasRecord: false, intensity: 0 })
  }
  
  // 填充本月
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const record = props.records.find(r => r.day === i)
    days.push({
      date: i,
      hasRecord: !!record,
      intensity: record?.intensity || 0,
      emoji: record?.emoji || '',
      isToday: i === now.getDate()
    })
  }
  
  return days
})

const getDayColor = (intensity) => {
  const level = intensityLevels.find(l => l.value === intensity)
  return level?.color || '#f5f5f5'
}
</script>

<style scoped>
.chart-container {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.subtitle {
  font-size: 13px;
  color: #999;
}

.calendar-grid {
  .weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-bottom: 8px;
    
    span {
      text-align: center;
      font-size: 12px;
      color: #999;
      padding: 8px 0;
    }
  }
  
  .days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    
    .day-cell {
      aspect-ratio: 1;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: pointer;
      transition: all 0.3s;
      
      &:hover {
        transform: scale(1.05);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      
      &.today {
        border: 2px solid #667eea;
      }
      
      &.empty {
        background: transparent !important;
        pointer-events: none;
      }
      
      .day-number {
        font-size: 12px;
        color: #666;
      }
      
      .emoji-indicator {
        font-size: 14px;
        margin-top: 2px;
      }
    }
  }
}

.legend {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  
  .legend-label {
    font-size: 12px;
    color: #999;
    margin-bottom: 8px;
    display: block;
  }
  
  .legend-items {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #666;
      
      .color-block {
        width: 16px;
        height: 16px;
        border-radius: 4px;
      }
    }
  }
}
</style>