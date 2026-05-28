import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/userStore'

const routes = [
  { path: '/login', name: 'Login', component: () => import('@/views/LoginView.vue') },
  { path: '/register', name: 'Register', component: () => import('@/views/RegisterView.vue') },
  { path: '/', name: 'Spirit', component: () => import('@/views/SpiritView.vue') },
  { path: '/diary', name: 'Diary', component: () => import('@/views/DiaryView.vue') },
  { path: '/dashboard', name: 'Dashboard', component: () => import('@/views/DashboardView.vue') },
  { path: '/universe', name: 'Universe', component: () => import('@/views/UniverseView.vue') },
  { path: '/profile', name: 'Profile', component: () => import('@/views/ProfileView.vue') },
  // ✅ 新增：树洞详情独立页面
  { 
    path: '/treeholes/:id', 
    name: 'TreeholeDetail', 
    component: () => import('@/views/TreeholeDetailView.vue') 
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from) => {
  const userStore = useUserStore()
  const publicPages = ['/login', '/register', '/universe']
  
  const isLoggedIn = userStore.isLoggedIn
  
  if (!publicPages.includes(to.path) && !isLoggedIn) {
    return '/login'
  }
  if ((to.path === '/login' || to.path === '/register') && isLoggedIn) {
    return '/'
  }
})

export default router