import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/userStore'

const routes = [
  { path: '/login', name: 'Login', component: () => import('@/views/LoginView.vue') },
  { path: '/register', name: 'Register', component: () => import('@/views/RegisterView.vue') },
  { path: '/', name: 'Spirit', component: () => import('@/views/SpiritView.vue') },
  { path: '/diary', name: 'Diary', component: () => import('@/views/DiaryView.vue') },
  { path: '/dashboard', name: 'Dashboard', component: () => import('@/views/DashboardView.vue') },
  { path: '/universe', name: 'Universe', component: () => import('@/views/UniverseView.vue') },
  { path: '/profile', name: 'Profile', component: () => import('@/views/ProfileView.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// ✅ 新版路由守卫 - 使用 userStore.isLoggedIn
router.beforeEach((to, from) => {
  const userStore = useUserStore()
  const publicPages = ['/login', '/register', '/universe']
  
  // 使用 userStore 的 isLoggedIn
  const isLoggedIn = userStore.isLoggedIn
  
  console.log('路由守卫 - 路径:', to.path, '登录状态:', isLoggedIn)
  
  if (!publicPages.includes(to.path) && !isLoggedIn) {
    return '/login'
  }
  // 已登录用户访问登录页，跳转首页
  if ((to.path === '/login' || to.path === '/register') && isLoggedIn) {
    return '/'
  }
})

export default router