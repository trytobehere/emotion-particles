import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDiaryStore = defineStore('diary', () => {
  // 日记列表
  const diaries = ref([
    {
      id: 1,
      title: '今天工作有点累',
      content: '项目赶进度，加班到9点...',
      emotion: { emoji: '😫', label: '疲惫', color: '#9B9B9B' },
      tags: ['工作', '加班'],
      images: [],
      createdAt: '2026-04-15 21:30',
      weather: '多云'
    },
    {
      id: 2,
      title: '和朋友聚餐很开心',
      content: '好久不见的老朋友，聊了很多...',
      emotion: { emoji: '😊', label: '开心', color: '#FFD93D' },
      tags: ['社交', '美食'],
      images: [],
      createdAt: '2026-04-14 19:20',
      weather: '晴'
    }
  ])
  
  // 常用标签
  const commonTags = ref([
    '工作', '学习', '生活', '社交', '家庭', 
    '健康', '运动', '美食', '旅行', '阅读',
    '电影', '音乐', '游戏', '购物', '理财'
  ])
  
  // 添加日记
  const addDiary = (diary) => {
    diaries.value.unshift({
      id: Date.now(),
      ...diary,
      createdAt: new Date().toLocaleString('zh-CN')
    })
  }
  
  // 删除日记
  const deleteDiary = (id) => {
    const index = diaries.value.findIndex(d => d.id === id)
    if (index > -1) {
      diaries.value.splice(index, 1)
    }
  }
  
  // 更新日记
  const updateDiary = (id, updates) => {
    const diary = diaries.value.find(d => d.id === id)
    if (diary) {
      Object.assign(diary, updates)
    }
  }
  
  return {
    diaries,
    commonTags,
    addDiary,
    deleteDiary,
    updateDiary
  }
})