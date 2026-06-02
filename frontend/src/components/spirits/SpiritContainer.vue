<template>
  <div class="spirit-container" :style="containerStyle">
    <div class="spirit-wrapper">
      <slot></slot>
    </div>
    <div class="emotion-label" v-if="currentEmotion">
      <span class="emoji">{{ currentEmotion.emoji }}</span>
      <span class="name">{{ currentEmotion.name }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: { type: Number, default: 280 },
  shape: { type: String, default: 'circle' },
  color: { type: String, default: '#4A9EFF' },
  currentEmotion: { type: Object, default: null }
})

const containerStyle = computed(() => {
  const base = {
    borderColor: props.color,
    boxShadow: `0 0 40px ${props.color}33, 0 0 80px ${props.color}1A`,
    transition: 'all 0.3s ease'
  }
  
  if (props.shape === 'fullscreen') {
    return {
      ...base,
      width: '100vw',
      height: '100vh',
      borderRadius: '0',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 1,
      border: 'none',
      background: 'transparent',
      backdropFilter: 'none'
    }
  }
  
  if (props.shape === 'rectangle') {
    return {
      ...base,
      width: `${props.size * 1.5}px`,
      height: `${props.size * 0.7}px`,
      borderRadius: '20px'
    }
  }
  
  return {
    ...base,
    width: `${props.size}px`,
    height: `${props.size}px`,
    borderRadius: '50%'
  }
})
</script>

<style scoped>
.spirit-container {
  position: relative;
  border: 2px solid rgba(255, 255, 255, 0.15);
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  flex-shrink: 0;
}

.spirit-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.emotion-label {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 16px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 14px;
  white-space: nowrap;
}

.emotion-label .emoji {
  font-size: 18px;
}
</style>