<template>
  <div class="spirit-view" :style="bgStyle">
    <div class="header">
      <h1>
        <span class="greeting">{{ greeting }}</span>
        <span class="date">{{ currentDate }}</span>
      </h1>
    </div>
    
    <div class="spirit-wrapper">
      <EmotionSprite />
    </div>
    
    <!-- 右下角导航栏 - 由 App.vue 统一管理，这里留空 -->
  </div>
</template>

<script setup>
import { computed } from 'vue'
import EmotionSprite from '@/components/business/EmotionSprite.vue'
import bgImage from '@/assets/1.png'

const bgStyle = {
  backgroundImage: `url(${bgImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundAttachment: 'fixed'
}

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
</script>

<style scoped lang="scss">
.spirit-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20px;
  
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
}
</style>