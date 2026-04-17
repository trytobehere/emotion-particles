<template>
  <div class="emoji-sprite-container">
    <div 
      ref="spriteEl"
      class="sprite-wrapper"
      :style="spriteStyle"
      :class="animationClass"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      @click="handleClick"
    >
      <div class="sprite-emoji">{{ currentSprite.emoji }}</div>
      <div class="sprite-effects">
        <span v-for="effect in currentSprite.effects" :key="effect" class="effect">
          {{ effect }}
        </span>
      </div>
      <div class="sprite-glow" :style="{ background: currentSprite.color }"></div>
    </div>
    
    <!-- 情绪选择器 -->
    <div v-if="showEmotionPicker" class="emotion-picker" :style="pickerStyle">
      <div class="picker-grid">
        <div 
          v-for="sprite in spriteLibrary" 
          :key="sprite.id"
          class="picker-item"
          :class="{ active: currentSprite.id === sprite.id }"
          @click="selectSprite(sprite)"
        >
          <div class="picker-emoji">{{ sprite.emoji }}</div>
          <div class="picker-name">{{ sprite.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const spriteLibrary = ref([
  { id: 'happy', name: '开心', emoji: '😊', color: '#FFD93D', effects: ['✨', '🌟'], animation: 'bounce' },
  { id: 'calm', name: '平静', emoji: '😌', color: '#6BCB77', effects: ['🍃', '☁️'], animation: 'float' },
  { id: 'tired', name: '疲惫', emoji: '😫', color: '#9B9B9B', effects: ['💤', '🥱'], animation: 'float' },
  { id: 'anxious', name: '焦虑', emoji: '😰', color: '#FF9F9F', effects: ['💦', '🌀'], animation: 'shake' },
  { id: 'excited', name: '兴奋', emoji: '🤩', color: '#FF6B6B', effects: ['💫', '⭐'], animation: 'pulse' },
  { id: 'sad', name: '低落', emoji: '😔', color: '#A78BFA', effects: ['🌧️', '💧'], animation: 'float' }
])

const currentSprite = ref(spriteLibrary.value[0])
const showEmotionPicker = ref(false)
const pickerPosition = ref({ x: 0, y: 0 })

const spritePos = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

const animationClass = computed(() => `animation-${currentSprite.value.animation}`)
const spriteStyle = computed(() => ({
  left: spritePos.value.x + 'px',
  top: spritePos.value.y + 'px'
}))

const pickerStyle = computed(() => ({
  left: pickerPosition.value.x + 'px',
  top: pickerPosition.value.y + 'px'
}))

const selectSprite = (sprite) => {
  currentSprite.value = sprite
  showEmotionPicker.value = false
}

// 拖拽逻辑
const handleMouseDown = (e) => {
  isDragging.value = true
  const rect = e.target.closest('.emoji-sprite-container').getBoundingClientRect()
  dragStart.value = {
    x: e.clientX - rect.left - spritePos.value.x,
    y: e.clientY - rect.top - spritePos.value.y
  }
  e.preventDefault()
}

const handleMouseMove = (e) => {
  if (!isDragging.value) return
  const rect = e.target.closest('.emoji-sprite-container').getBoundingClientRect()
  spritePos.value = {
    x: Math.max(60, Math.min(rect.width - 60, e.clientX - rect.left - dragStart.value.x)),
    y: Math.max(60, Math.min(rect.height - 60, e.clientY - rect.top - dragStart.value.y))
  }
}

const handleMouseUp = () => {
  isDragging.value = false
}

const handleClick = (e) => {
  if (isDragging.value) return
  
  const rect = e.target.closest('.emoji-sprite-container').getBoundingClientRect()
  showEmotionPicker.value = !showEmotionPicker.value
  if (showEmotionPicker.value) {
    pickerPosition.value = {
      x: Math.max(10, Math.min(rect.width - 280, e.clientX - rect.left - 120)),
      y: Math.max(10, e.clientY - rect.top - 180)
    }
  }
}

onMounted(() => {
  setTimeout(() => {
    const container = document.querySelector('.emoji-sprite-container')
    const rect = container.getBoundingClientRect()
    spritePos.value = { x: rect.width / 2, y: rect.height / 2 }
  }, 100)
})
</script>

<style scoped lang="scss">
.emoji-sprite-container {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  
  .sprite-wrapper {
    position: absolute;
    transform: translate(-50%, -50%);
    cursor: grab;
    
    &:active {
      cursor: grabbing;
    }
    
    .sprite-emoji {
      font-size: 80px;
      filter: drop-shadow(0 0 20px currentColor);
      position: relative;
      z-index: 2;
    }
    
    .sprite-effects {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      
      .effect {
        position: absolute;
        font-size: 24px;
        animation: floatAround 3s infinite;
        
        &:nth-child(1) { top: -20px; left: -20px; animation-delay: 0s; }
        &:nth-child(2) { top: 20px; right: -20px; animation-delay: 0.5s; }
        &:nth-child(3) { bottom: -10px; left: 10px; animation-delay: 1s; }
      }
    }
    
    .sprite-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 120px;
      height: 120px;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      opacity: 0.3;
      filter: blur(30px);
      z-index: 1;
    }
    
    &.animation-bounce {
      animation: bounce 0.8s infinite alternate;
    }
    
    &.animation-float {
      animation: float 3s infinite ease-in-out;
    }
    
    &.animation-pulse {
      animation: pulse 1.5s infinite;
    }
    
    &.animation-shake {
      animation: shake 0.5s infinite;
    }
  }
  
  .emotion-picker {
    position: absolute;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    padding: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    
    .picker-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      
      .picker-item {
        padding: 16px 12px;
        border-radius: 20px;
        cursor: pointer;
        text-align: center;
        transition: all 0.3s;
        
        &.active {
          background: rgba(102, 126, 234, 0.15);
        }
        
        &:hover {
          background: #f5f7fa;
          transform: scale(1.05);
        }
        
        .picker-emoji {
          font-size: 36px;
          margin-bottom: 6px;
        }
        
        .picker-name {
          font-size: 13px;
          color: #666;
        }
      }
    }
  }
}

@keyframes bounce {
  from { transform: translate(-50%, -60%); }
  to { transform: translate(-50%, -40%); }
}

@keyframes float {
  0%, 100% { transform: translate(-50%, -50%); }
  50% { transform: translate(-50%, -60%); }
}

@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.1); }
}

@keyframes shake {
  0%, 100% { transform: translate(-50%, -50%); }
  25% { transform: translate(-55%, -50%); }
  75% { transform: translate(-45%, -50%); }
}

@keyframes floatAround {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(10px, -10px); }
}
</style>