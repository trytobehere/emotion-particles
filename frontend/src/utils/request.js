import axios from 'axios'
import router from '@/router'
import { useUserStore } from '@/stores/userStore'

const service = axios.create({
  baseURL: '/api',
  timeout: 10000
})

service.interceptors.request.use(
  config => {
    // ✅ 从 userStore 获取 Token，而不是直接 localStorage
    const userStore = useUserStore()
    const token = userStore.accessToken || localStorage.getItem('accessToken')
    
    console.log('request.js - Token:', token ? token.substring(0, 30) + '...' : '无')
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token
    }
    return config
  },
  error => Promise.reject(error)
)

service.interceptors.response.use(
  response => {
    const res = response.data
    console.log('request.js - 响应:', res.code, res.message)
    // 修改：允许 200 或 20000 都视为成功
    if (res.code === 200 || res.code === 20000 || res.code === 200) {
      return res
    } else {
      return Promise.reject(new Error(res.message || '请求失败'))
    }
  },
  error => {
    console.error('request.js - 请求错误:', error.response?.status, error.response?.data)
    
    // ✅ 使用 userStore 处理登出
    if (error.response?.status === 401 || error.response?.status === 403) {
      const userStore = useUserStore()
      userStore.logout()
    }
    return Promise.reject(error)
  }
)

export default service