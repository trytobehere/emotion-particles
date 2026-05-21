<template>
  <div class="gif-sprite-container">
    <img 
      ref="spriteImage"
      :src="currentSprite.gif"
      :style="spriteStyle"
      class="sprite-gif"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      @click="handleClick"
      draggable="false"
    />
    
    <!-- 情绪选择器 -->
    <div 
      v-if="showEmotionPicker" 
      class="emotion-picker"
      :style="{ left: pickerPosition.x + 'px', top: pickerPosition.y + 'px' }"
    >
      <div class="emotion-grid">
        <div 
          v-for="sprite in spriteLibrary" 
          :key="sprite.id"
          class="emotion-card"
          :class="{ active: currentSprite?.id === sprite.id }"
          @click="selectSprite(sprite)"
        >
          <img :src="sprite.gif" class="card-gif" />
          <div class="card-info">
            <span class="name">{{ sprite.name }}</span>
            <span class="emoji">{{ sprite.emoji }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 使用免费的 GIF 动图
const spriteLibrary = ref([
  {
    id: 'happy',
    name: '开心',
    emoji: '😊',
    gif: 'https://media.tenor.com/Y2lQ6kX5Z9MAAAAi/cute-happy.gif'
  },
  {
    id: 'calm',
    name: '平静',
    emoji: '😌',
    gif: 'https://media.tenor.com/Y8rLZ4L5Z9MAAAAi/cute-calm.gif'
  },
  {
    id: 'tired',
    name: '疲惫',
    emoji: '😫',
    gif: 'https://media.tenor.com/X2lQ6kX5Z9MAAAAi/tired-sleepy.gif'
  },
  {
    id: 'excited',
    name: '兴奋',
    emoji: '🤩',
    gif: 'https://media.tenor.com/Z2lQ6kX5Z9MAAAAi/excited-star.gif'
  }
])

const currentSprite = ref(spriteLibrary.value[0])
const showEmotionPicker = ref(false)
const pickerPosition = ref({ x: 0, y: 0 })

const spritePos = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

const spriteStyle = computed(() => ({
  left: spritePos.value.x + 'px',
  top: spritePos.value.y + 'px',
  transform: 'translate(-50%, -50%)'
}))

const selectSprite = (sprite) => {
  currentSprite.value = sprite
  showEmotionPicker.value = false
  ElMessage.success(`✨ 切换为 ${sprite.name}`)
}

// 拖拽逻辑
const handleMouseDown = (e) => {
  isDragging.value = true
  const rect = e.target.parentElement.getBoundingClientRect()
  dragStart.value = {
    x: e.clientX - rect.left - spritePos.value.x,
    y: e.clientY - rect.top - spritePos.value.y
  }
  e.preventDefault()
}

const handleMouseMove = (e) => {
  if (!isDragging.value) return
  const rect = e.target.parentElement.getBoundingClientRect()
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
  
  const rect = e.target.parentElement.getBoundingClientRect()
  showEmotionPicker.value = !showEmotionPicker.value
  if (showEmotionPicker.value) {
    pickerPosition.value = {
      x: Math.max(10, Math.min(rect.width - 320, e.clientX - rect.left - 140)),
      y: Math.max(10, e.clientY - rect.top - 180)
    }
  }
}

onMounted(() => {
  setTimeout(() => {
    const container = document.querySelector('.gif-sprite-container')
    const rect = container.getBoundingClientRect()
    spritePos.value = { x: rect.width / 2, y: rect.height / 2 }
  }, 100)
})
</script>

<style scoped lang="scss">
.gif-sprite-container {
  width: 100%;
  height: 100%;
  background: transparent;  // 透明背景
  border-radius: 0;
  overflow: hidden;
  position: relative;
  
  .sprite-gif {
    position: absolute;
    width: 120px;
    height: 120px;
    object-fit: contain;
    cursor: grab;
    filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
    
    &:active {
      cursor: grabbing;
    }
  }
  
  .emotion-picker {
    position: absolute;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    padding: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    z-index: 100;
    
    .emotion-grid {
      display: flex;
      gap: 12px;
      
      .emotion-card {
        padding: 12px;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.3s;
        
        &.active {
          background: rgba(102, 126, 234, 0.15);
        }
        
        &:hover {
          background: #f5f7fa;
          transform: scale(1.05);
        }
        
        .card-gif {
          width: 70px;
          height: 70px;
          object-fit: contain;
        }
        
        .card-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 8px;
          
          .name {
            font-size: 12px;
            color: #666;
          }
          
          .emoji {
            font-size: 16px;
          }
        }
      }
    }
  }
}
</style>