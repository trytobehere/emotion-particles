import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Spirit',
    component: () => import('@/views/SpiritView.vue')
  },
  {
    path: '/diary',
    name: 'Diary',
    component: () => import('@/views/DiaryView.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue')
  },
  {
    path: '/universe',
    name: 'Universe',
    component: () => import('@/views/UniverseView.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/ProfileView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router