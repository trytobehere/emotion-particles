import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '@/utils/request'
import router from '@/router'

export const useUserStore = defineStore('user', () => {
  // 用户信息
  const userInfo = ref(null)
  
  // Token
  const accessToken = ref(localStorage.getItem('accessToken') || '')
  const refreshToken = ref(localStorage.getItem('refreshToken') || '')
  
  // 使用统计
  const statistics = ref({
    totalDiaries: 0,
    totalRecords: 0,
    continuousDays: 0,
    totalLikes: 0
  })
  
  // 应用设置
  const settings = ref({
    theme: localStorage.getItem('theme') || 'dark',
    notifications: true,
    anonymousMode: false,
    autoSync: true,
    fontSize: 'medium',
    language: 'zh-CN'
  })
  
  // 是否已登录
  const isLoggedIn = computed(() => !!accessToken.value)
  
  // ========== 认证相关 ==========
  
  // 注册
  const register = async (username, password, email) => {
    try {
      const res = await request.post('/auth/register', {
        username,
        password,
        email
      })
      return { success: true, data: res }
    } catch (error) {
      console.error('注册失败', error)
      return { success: false, error: error.response?.data?.message || '注册失败' }
    }
  }
  
  // 登录
  const login = async (username, password) => {
    try {
      const res = await request.post('/auth/login', { username, password })
      const data = res.data || res
      
      console.log('登录响应:', data)
      
      // 确保正确保存 Token
      accessToken.value = data.accessToken
      refreshToken.value = data.refreshToken
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      
      userInfo.value = data.userInfo
      
      return { success: true, data }
    } catch (error) {
      console.error('登录失败', error)
      return { success: false, error: error.response?.data?.message || '登录失败' }
    }
  }
  
  // 退出登录
  const logout = () => {
    accessToken.value = ''
    refreshToken.value = ''
    userInfo.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    // ✅ 清除聊天历史（sessionStorage）
    sessionStorage.removeItem('chatHistory')
    router.push('/login')
  }
  
  // ========== 用户信息相关 ==========
  
  // 获取当前用户信息
  const fetchUserInfo = async () => {
    try {
      console.log('fetchUserInfo: 开始获取用户信息')
      const res = await request.get('/users/me')
      console.log('fetchUserInfo: 获取成功', res.data)
      userInfo.value = res.data
      return res
    } catch (error) {
      console.error('fetchUserInfo: 获取失败', error)
      // 如果是401，清除Token
      if (error.response?.status === 401) {
        logout()
      }
      return null
    }
  }
  
  // 更新用户信息
  const updateUserInfo = async (updates) => {
    try {
      const res = await request.put('/users/me', updates)
      userInfo.value = { ...userInfo.value, ...updates }
      return { success: true, data: res }
    } catch (error) {
      console.error('更新用户信息失败', error)
      return { success: false, error: error.response?.data?.message }
    }
  }
  
  // ========== 设置相关 ==========
  
  // 更新设置
  const updateSettings = (key, value) => {
    settings.value[key] = value
    if (key === 'theme') {
      localStorage.setItem('theme', value)
    }
  }
  
  // 保存设置到后端
  const saveSettings = async () => {
    try {
      await request.put('/users/me/settings', settings.value)
      return { success: true }
    } catch (error) {
      console.error('保存设置失败', error)
      return { success: false }
    }
  }
  
  // ========== 统计相关 ==========
  
  // 获取使用统计
  const fetchStatistics = async () => {
    try {
      const res = await request.get('/users/me/statistics')
      Object.assign(statistics.value, res.data)
      return res
    } catch (error) {
      console.error('获取统计失败', error)
      return null
    }
  }
  
  // 计算注册天数
  const daysSinceJoin = computed(() => {
    if (!userInfo.value?.createdAt) return 0
    const join = new Date(userInfo.value.createdAt)
    const now = new Date()
    return Math.floor((now - join) / (1000 * 60 * 60 * 24))
  })
  
  // ========== 初始化 ==========
  
  // 初始化：如果已登录，获取用户信息
  const init = async () => {
    if (accessToken.value) {
      await fetchUserInfo()
      await fetchStatistics()
    }
  }
  
  return {
    // 状态
    userInfo,
    accessToken,
    refreshToken,
    statistics,
    settings,
    isLoggedIn,
    daysSinceJoin,
    
    // 认证
    register,
    login,
    logout,
    
    // 用户信息
    fetchUserInfo,
    updateUserInfo,
    
    // 设置
    updateSettings,
    saveSettings,
    
    // 统计
    fetchStatistics,
    
    // 初始化
    init
  }
})