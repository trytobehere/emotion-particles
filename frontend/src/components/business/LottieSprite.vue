<template>
  <div class="gif-sprite-container">
    <!-- GIF 动画精灵 -->
    <img 
      ref="spriteImage"
      :src="currentSprite.url"
      :style="spriteStyle"
      class="sprite-gif"
      :class="{ dragging: isDragging }"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      @click="handleClick"
      @dragstart.prevent
      draggable="false"
    />
    
    <!-- 精灵光晕效果 -->
    <div 
      class="sprite-glow"
      :style="glowStyle"
    ></div>
    
    <!-- 当前情绪标签 -->
    <div class="sprite-label" v-if="currentSprite">
      <span class="label-emoji">{{ currentSprite.emoji }}</span>
      <span class="label-name">{{ currentSprite.name }}</span>
    </div>
    
    <!-- 情绪选择器 -->
    <div 
      v-if="showEmotionPicker" 
      class="emotion-picker"
      :style="{ left: pickerPosition.x + 'px', top: pickerPosition.y + 'px' }"
    >
      <div class="picker-header">
        <span class="title">✨ 选择情绪精灵</span>
      </div>
      
      <div class="emotion-grid">
        <div 
          v-for="sprite in spriteLibrary" 
          :key="sprite.id"
          class="emotion-item"
          :class="{ active: currentSprite?.id === sprite.id }"
          :style="{ '--sprite-color': sprite.color }"
          @click="selectSprite(sprite)"
        >
          <div class="emotion-preview">
            <img :src="sprite.url" class="preview-gif" />
          </div>
          <div class="emotion-info">
            <span class="emotion-name">{{ sprite.name }}</span>
            <span class="emotion-emoji">{{ sprite.emoji }}</span>
          </div>
          <div class="active-badge" v-if="currentSprite?.id === sprite.id">✓</div>
        </div>
      </div>
    </div>
    
    <!-- 点击提示 -->
    <div class="click-hint" v-if="!showEmotionPicker">
      <span>👆 点击精灵切换情绪</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'

// 精灵库 - 使用可访问的 GIF 动图
const spriteLibrary = ref([
  {
    id: 'happy',
    name: '开心',
    emoji: '😊',
    color: '#FFD93D',
    // 开心的粉色小幽灵（来自 Tenor）
    url: 'https://media.tenor.com/vxFNoJHV3I4AAAAi/peach-goma-pet.gif'
  },
  {
    id: 'calm',
    name: '平静',
    emoji: '😌',
    color: '#6BCB77',
    // 平静的小猫
    url: 'https://media.tenor.com/Wg8xNkAqRLwAAAAi/cat-kitten.gif'
  },
  {
    id: 'tired',
    name: '疲惫',
    emoji: '😫',
    color: '#9B9B9B',
    // 瞌睡的小狗
    url: 'https://media.tenor.com/1AlKpRcu1hQAAAAi/sleepy-tired.gif'
  },
  {
    id: 'excited',
    name: '兴奋',
    emoji: '🤩',
    color: '#FF6B6B',
    // 兴奋的小熊
    url: 'https://media.tenor.com/YjH6c5oWQrEAAAAi/bear-cute.gif'
  },
  {
    id: 'sad',
    name: '低落',
    emoji: '😔',
    color: '#A78BFA',
    // 伤心的小猫
    url: 'https://media.tenor.com/C5oLe5xr1o8AAAAi/sad-cat.gif'
  },
  {
    id: 'love',
    name: '爱意',
    emoji: '🥰',
    color: '#FF85A2',
    // 爱心小熊
    url: 'https://media.tenor.com/Kv1vAAiTQxkAAAAi/bear-love.gif'
  },
  {
    id: 'playful',
    name: '调皮',
    emoji: '😝',
    color: '#F4A460',
    // 调皮的小狗
    url: 'https://media.tenor.com/x5fD8q2dHrAAAAAi/dog-puppy.gif'
  },
  {
    id: 'shy',
    name: '害羞',
    emoji: '😳',
    color: '#FFB6C1',
    // 害羞的小兔子
    url: 'https://media.tenor.com/kO8A6MxS2h0AAAAi/bunny-cute.gif'
  }
])

const spriteImage = ref(null)
const currentSprite = ref(spriteLibrary.value[0])

// 状态
const showEmotionPicker = ref(false)
const pickerPosition = ref({ x: 0, y: 0 })

// 位置和拖拽
const spritePos = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const containerRect = ref(null)

const spriteStyle = computed(() => ({
  left: spritePos.value.x + 'px',
  top: spritePos.value.y + 'px',
  transform: `translate(-50%, -50%) scale(${isDragging.value ? 1.05 : 1})`
}))

const glowStyle = computed(() => ({
  left: spritePos.value.x + 'px',
  top: spritePos.value.y + 'px',
  background: `radial-gradient(circle, ${currentSprite.value.color}40 0%, transparent 70%)`,
  transform: 'translate(-50%, -50%)'
}))

// 选择精灵
const selectSprite = (sprite) => {
  currentSprite.value = sprite
  showEmotionPicker.value = false
  
  // 添加切换动画
  if (spriteImage.value) {
    spriteImage.value.style.animation = 'none'
    setTimeout(() => {
      spriteImage.value.style.animation = 'popIn 0.3s ease'
    }, 10)
  }
  
  ElMessage.success({
    message: `✨ 记录成功：${sprite.emoji} ${sprite.name}`,
    duration: 1500
  })
  
  // 保存到本地
  localStorage.setItem('currentEmotionSprite', JSON.stringify(sprite.id))
}

// 拖拽逻辑
const handleMouseDown = (e) => {
  const container = spriteImage.value?.parentElement
  if (!container) return
  
  containerRect.value = container.getBoundingClientRect()
  
  const mouseX = e.clientX - containerRect.value.left
  const mouseY = e.clientY - containerRect.value.top
  
  isDragging.value = true
  dragStart.value = {
    x: mouseX - spritePos.value.x,
    y: mouseY - spritePos.value.y
  }
  
  e.preventDefault()
  e.stopPropagation()
}

const handleMouseMove = (e) => {
  if (!isDragging.value || !containerRect.value) return
  
  const mouseX = e.clientX - containerRect.value.left
  const mouseY = e.clientY - containerRect.value.top
  
  const newX = mouseX - dragStart.value.x
  const newY = mouseY - dragStart.value.y
  
  // 边界限制
  const maxX = containerRect.value.width - 50
  const maxY = containerRect.value.height - 70
  const minX = 50
  const minY = 70
  
  spritePos.value = {
    x: Math.max(minX, Math.min(maxX, newX)),
    y: Math.max(minY, Math.min(maxY, newY))
  }
}

const handleMouseUp = () => {
  isDragging.value = false
}

const handleClick = (e) => {
  if (isDragging.value) {
    isDragging.value = false
    return
  }
  
  const container = spriteImage.value?.parentElement
  if (!container) return
  
  const rect = container.getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const clickY = e.clientY - rect.top
  
  showEmotionPicker.value = !showEmotionPicker.value
  
  if (showEmotionPicker.value) {
    // 计算选择器位置
    const pickerWidth = 340
    const pickerHeight = 380
    
    let left = clickX - pickerWidth / 2
    let top = clickY - pickerHeight - 20
    
    if (left < 10) left = 10
    if (left + pickerWidth > rect.width - 10) left = rect.width - pickerWidth - 10
    if (top < 10) top = clickY + 30
    
    pickerPosition.value = { x: left, y: top }
  }
}

// 图片加载失败处理
const handleImageError = (e) => {
  console.warn('GIF加载失败，使用备选显示')
  // 如果图片加载失败，可以替换为其他链接
  const fallbackUrls = {
    'happy': 'https://media.tenor.com/Nub8j1E-kn0AAAAi/cute-bear.gif',
    'calm': 'https://media.tenor.com/YhH6c5oWQrEAAAAi/bear-cute.gif',
    'tired': 'https://media.tenor.com/1AlKpRcu1hQAAAAi/sleepy-tired.gif',
    'excited': 'https://media.tenor.com/vxFNoJHV3I4AAAAi/peach-goma-pet.gif',
    'sad': 'https://media.tenor.com/kO8A6MxS2h0AAAAi/bunny-cute.gif',
    'love': 'https://media.tenor.com/Kv1vAAiTQxkAAAAi/bear-love.gif'
  }
}

// 加载保存的精灵
const loadSavedSprite = () => {
  const saved = localStorage.getItem('currentEmotionSprite')
  if (saved) {
    try {
      const savedId = JSON.parse(saved)
      const sprite = spriteLibrary.value.find(s => s.id === savedId)
      if (sprite) {
        currentSprite.value = sprite
      }
    } catch (e) {}
  }
}

onMounted(() => {
  loadSavedSprite()
  
  setTimeout(() => {
    const container = spriteImage.value?.parentElement
    if (container) {
      const rect = container.getBoundingClientRect()
      spritePos.value = {
        x: rect.width / 2,
        y: rect.height / 2 - 10
      }
    }
  }, 100)
})
</script>

<style scoped lang="scss">
.gif-sprite-container {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0a0a14 0%, #151525 50%, #0f0f1f 100%);
  border-radius: 28px;
  overflow: hidden;
  position: relative;
  
  // 星星背景
  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    background-image: 
      radial-gradient(2px 2px at 15% 25%, rgba(255,255,255,0.8), transparent),
      radial-gradient(2px 2px at 75% 15%, rgba(255,255,255,0.6), transparent),
      radial-gradient(1px 1px at 30% 70%, rgba(255,255,255,0.7), transparent),
      radial-gradient(2px 2px at 85% 80%, rgba(255,255,255,0.5), transparent),
      radial-gradient(1px 1px at 50% 45%, rgba(255,255,255,0.8), transparent),
      radial-gradient(2px 2px at 10% 85%, rgba(255,255,255,0.6), transparent),
      radial-gradient(1px 1px at 90% 40%, rgba(255,255,255,0.7), transparent);
    background-size: 200px 200px;
    animation: twinkle 4s infinite;
  }
  
  .sprite-gif {
    position: absolute;
    width: 130px;
    height: 130px;
    object-fit: contain;
    cursor: grab;
    z-index: 10;
    filter: drop-shadow(0 0 30px rgba(255, 255, 255, 0.3));
    transition: filter 0.3s ease, transform 0.2s ease;
    pointer-events: auto;
    
    &:hover {
      filter: drop-shadow(0 0 45px rgba(255, 255, 255, 0.5));
    }
    
    &.dragging {
      cursor: grabbing;
      filter: drop-shadow(0 0 50px rgba(255, 255, 255, 0.6));
    }
  }
  
  .sprite-glow {
    position: absolute;
    width: 180px;
    height: 180px;
    pointer-events: none;
    z-index: 5;
    transition: all 0.3s ease;
    animation: pulse 3s infinite;
  }
  
  .sprite-label {
    position: absolute;
    bottom: 20px;
    left: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(20, 20, 35, 0.7);
    backdrop-filter: blur(15px);
    padding: 10px 18px;
    border-radius: 40px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 20;
    
    .label-emoji {
      font-size: 26px;
    }
    
    .label-name {
      color: white;
      font-size: 16px;
      font-weight: 500;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
  }
  
  .click-hint {
    position: absolute;
    bottom: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(15px);
    padding: 10px 20px;
    border-radius: 40px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    z-index: 20;
    animation: hintPulse 2.5s infinite;
    
    span {
      color: rgba(255, 255, 255, 0.85);
      font-size: 14px;
    }
  }
  
  .emotion-picker {
    position: absolute;
    background: rgba(18, 18, 30, 0.95);
    backdrop-filter: blur(25px);
    border-radius: 28px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08);
    z-index: 100;
    width: 340px;
    padding: 18px;
    animation: slideUp 0.25s ease;
    
    .picker-header {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      
      .title {
        font-size: 17px;
        font-weight: 600;
        color: white;
      }
    }
    
    .emotion-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      max-height: 340px;
      overflow-y: auto;
      
      &::-webkit-scrollbar {
        width: 4px;
      }
      
      &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
      }
      
      .emotion-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px;
        border-radius: 18px;
        cursor: pointer;
        transition: all 0.2s ease;
        background: rgba(255, 255, 255, 0.03);
        border: 1.5px solid transparent;
        position: relative;
        
        &:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: scale(1.02);
        }
        
        &.active {
          background: linear-gradient(135deg, var(--sprite-color)20, transparent);
          border-color: var(--sprite-color);
        }
        
        .emotion-preview {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          
          .preview-gif {
            width: 45px;
            height: 45px;
            object-fit: contain;
          }
        }
        
        .emotion-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          
          .emotion-name {
            font-size: 14px;
            font-weight: 600;
            color: white;
          }
          
          .emotion-emoji {
            font-size: 16px;
          }
        }
        
        .active-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 20px;
          height: 20px;
          background: var(--sprite-color);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: bold;
        }
      }
    }
  }
}

@keyframes twinkle {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.1); }
}

@keyframes hintPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.9; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes popIn {
  0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
  50% { transform: translate(-50%, -50%) scale(1.1); }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}
</style>