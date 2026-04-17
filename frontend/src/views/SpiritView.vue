<template>
  <div class="spirit-view">
    <div class="header">
      <h1>
        <span class="greeting">{{ greeting }}</span>
        <span class="date">{{ currentDate }}</span>
      </h1>
    </div>
    
    <div class="spirit-wrapper">
      <GifSprite ref="spriteRef" />
    </div>
    
    <div class="quick-actions">
      <button class="action-btn primary" @click="goToDiary">
        <span class="btn-icon">📝</span>
        <span>写日记</span>
      </button>
      <button class="action-btn" @click="goToDashboard">
        <span class="btn-icon">📊</span>
        <span>看分析</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import GifSprite from '@/components/business/LottieSprite.vue'

const router = useRouter()

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const currentDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', { 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  })
})

const goToDiary = () => router.push('/diary')
const goToDashboard = () => router.push('/dashboard')
</script>

<style scoped lang="scss">
.spirit-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
  
  .header {
    color: white;
    margin-bottom: 20px;
    
    h1 {
      display: flex;
      flex-direction: column;
      margin: 0;
      
      .greeting {
        font-size: 32px;
        font-weight: 700;
        text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
      }
      
      .date {
        font-size: 15px;
        opacity: 0.8;
        margin-top: 6px;
        font-weight: 400;
      }
    }
  }
  
  .spirit-wrapper {
    flex: 1;
    min-height: 0;
    margin-bottom: 20px;
  }
  
  .quick-actions {
    display: flex;
    gap: 14px;
    justify-content: center;
    padding-bottom: 10px;
    
    .action-btn {
      flex: 1;
      max-width: 160px;
      height: 54px;
      border: none;
      border-radius: 30px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.15);
      transition: all 0.3s ease;
      
      .btn-icon {
        font-size: 20px;
      }
      
      &.primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
      }
      
      &:hover {
        transform: translateY(-2px);
        background: rgba(255, 255, 255, 0.15);
        
        &.primary {
          background: linear-gradient(135deg, #7b90f0 0%, #8b5eb8 100%);
          box-shadow: 0 12px 25px rgba(102, 126, 234, 0.4);
        }
      }
      
      &:active {
        transform: translateY(0);
      }
    }
  }
}
</style>