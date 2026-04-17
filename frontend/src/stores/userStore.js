import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // 用户信息
  const userInfo = ref({
    id: 1,
    username: '情绪旅人',
    avatar: '😊',
    email: 'user@emotion.com',
    joinDate: '2026-03-15',
    bio: '记录情绪，了解自己'
  })
  
  // 使用统计
  const statistics = ref({
    totalDiaries: 0,
    totalRecords: 0,
    continuousDays: 0,
    totalLikes: 0
  })
  
  // 应用设置
  const settings = ref({
    theme: 'dark',
    notifications: true,
    anonymousMode: false,
    autoSync: true,
    fontSize: 'medium',
    language: 'zh-CN'
  })
  
  // 更新用户信息
  const updateUserInfo = (updates) => {
    Object.assign(userInfo.value, updates)
  }
  
  // 更新设置
  const updateSettings = (key, value) => {
    settings.value[key] = value
  }
  
  // 更新统计
  const updateStatistics = (stats) => {
    Object.assign(statistics.value, stats)
  }
  
  // 计算注册天数
  const daysSinceJoin = computed(() => {
    const join = new Date(userInfo.value.joinDate)
    const now = new Date()
    return Math.floor((now - join) / (1000 * 60 * 60 * 24))
  })
  
  return {
    userInfo,
    statistics,
    settings,
    daysSinceJoin,
    updateUserInfo,
    updateSettings,
    updateStatistics
  }
})