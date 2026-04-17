<template>
  <div class="spirit-container">
    <canvas 
      ref="canvasRef" 
      :width="canvasWidth" 
      :height="canvasHeight"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      @click="handleCanvasClick"
    ></canvas>
    
    <!-- 情绪选择器 -->
    <div 
      v-if="showEmotionPicker" 
      class="emotion-picker"
      :style="{ left: pickerPosition.x + 'px', top: pickerPosition.y + 'px' }"
    >
      <div class="picker-header">
        <span>选择情绪</span>
        <el-button link @click="showCustomEmotion = true">
          <el-icon><Plus /></el-icon>
          自定义
        </el-button>
      </div>
      
      <div class="emotion-grid">
        <div 
          v-for="emotion in allEmotions" 
          :key="emotion.id"
          class="emotion-item"
          :style="{ background: emotion.color }"
          @click="selectEmotion(emotion)"
        >
          <span class="emoji">{{ emotion.emoji }}</span>
          <span class="label">{{ emotion.label }}</span>
        </div>
      </div>
    </div>
    
    <!-- 自定义情绪对话框 -->
    <el-dialog v-model="showCustomEmotion" title="创建情绪" width="85%">
      <el-form :model="customEmotion" label-width="80px">
        <el-form-item label="表情符号">
          <el-input v-model="customEmotion.emoji" placeholder="如: 😊" maxlength="2" />
          <div class="emoji-suggestions">
            <span 
              v-for="emo in emojiSuggestions" 
              :key="emo"
              @click="customEmotion.emoji = emo"
            >{{ emo }}</span>
          </div>
        </el-form-item>
        <el-form-item label="情绪名称">
          <el-input v-model="customEmotion.label" placeholder="如: 期待" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="customEmotion.color" show-alpha />
        </el-form-item>
        <el-form-item label="情绪值">
          <el-slider v-model="customEmotion.value" :min="1" :max="5" show-stops />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCustomEmotion = false">取消</el-button>
        <el-button type="primary" @click="saveCustomEmotion">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const canvasWidth = ref(400)
const canvasHeight = ref(400)
const canvasRef = ref(null)
const spiritPos = ref({ x: 200, y: 200 })

// 情绪选择器状态
const showEmotionPicker = ref(false)
const pickerPosition = ref({ x: 0, y: 0 })
const showCustomEmotion = ref(false)

// 当前选中的情绪
const currentEmotion = ref(null)

// 动画参数
let time = 0
let floatOffset = 0
let breatheScale = 1
let eyeBlink = 0

// 预设情绪
const presetEmotions = [
  { id: 1, label: '开心', emoji: '😊', color: '#FFD93D', value: 5 },
  { id: 2, label: '平静', emoji: '😌', color: '#6BCB77', value: 3 },
  { id: 3, label: '疲惫', emoji: '😫', color: '#9B9B9B', value: 2 },
  { id: 4, label: '焦虑', emoji: '😰', color: '#FF9F9F', value: 1 },
  { id: 5, label: '兴奋', emoji: '🤩', color: '#FF6B6B', value: 5 },
  { id: 6, label: '低落', emoji: '😔', color: '#A78BFA', value: 1 }
]

// 自定义情绪列表
const customEmotions = ref([])

// 所有情绪（预设 + 自定义）
const allEmotions = computed(() => {
  return [...presetEmotions, ...customEmotions.value]
})

// 表情符号建议
const emojiSuggestions = ['😊', '😄', '😍', '🥰', '😎', '🤔', '😴', '🥺', '😤', '😱', '🤗', '🫠', '🥳', '😇', '🤯']

// 自定义情绪表单
const customEmotion = ref({
  emoji: '😊',
  label: '',
  color: '#667eea',
  value: 3
})

// 保存自定义情绪
const saveCustomEmotion = () => {
  if (!customEmotion.value.label.trim()) {
    ElMessage.warning('请输入情绪名称')
    return
  }
  
  const newEmotion = {
    id: Date.now(),
    ...customEmotion.value
  }
  
  customEmotions.value.push(newEmotion)
  
  // 保存到 localStorage
  localStorage.setItem('customEmotions', JSON.stringify(customEmotions.value))
  
  showCustomEmotion.value = false
  customEmotion.value = {
    emoji: '😊',
    label: '',
    color: '#667eea',
    value: 3
  }
  
  ElMessage.success('新情绪已创建')
}

// 加载保存的自定义情绪
const loadCustomEmotions = () => {
  const saved = localStorage.getItem('customEmotions')
  if (saved) {
    try {
      customEmotions.value = JSON.parse(saved)
    } catch (e) {
      console.error('加载自定义情绪失败', e)
    }
  }
}

// 绘制精灵（增强版）
const drawSpirit = (ctx) => {
  const mainColor = currentEmotion.value?.color || '#FFD93D'
  
  // 浮动效果
  const floatY = spiritPos.value.y + floatOffset
  
  // 呼吸效果
  const baseSize = 35
  const size = baseSize * breatheScale
  
  // 绘制外光晕（动态）
  ctx.shadowColor = mainColor
  ctx.shadowBlur = 30 + Math.sin(time * 3) * 10
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  
  // 绘制光晕圈（动态扩散效果）
  const haloGradient = ctx.createRadialGradient(
    spiritPos.value.x, floatY, size * 0.5,
    spiritPos.value.x, floatY, size * 2
  )
  haloGradient.addColorStop(0, mainColor + '40')
  haloGradient.addColorStop(0.5, mainColor + '15')
  haloGradient.addColorStop(1, 'transparent')
  
  ctx.beginPath()
  ctx.arc(spiritPos.value.x, floatY, size * 2.2, 0, Math.PI * 2)
  ctx.fillStyle = haloGradient
  ctx.fill()
  
  // 主体 - 动态渐变
  const gradient = ctx.createRadialGradient(
    spiritPos.value.x - 10, floatY - 10, 5,
    spiritPos.value.x, floatY, size
  )
  gradient.addColorStop(0, mainColor)
  gradient.addColorStop(0.5, mainColor + 'cc')
  gradient.addColorStop(1, mainColor + '40')
  
  ctx.beginPath()
  ctx.arc(spiritPos.value.x, floatY, size, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()
  
  // 高光（动态旋转）
  ctx.shadowBlur = 0
  const highlightAngle = time * 0.5
  const highlightX = spiritPos.value.x - 12 + Math.cos(highlightAngle) * 5
  const highlightY = floatY - 15 + Math.sin(highlightAngle) * 3
  
  ctx.beginPath()
  ctx.arc(highlightX, highlightY, 6, 0, Math.PI * 2)
  ctx.fillStyle = '#FFFFFF30'
  ctx.fill()
  
  // 眼睛
  const eyeOpen = eyeBlink < 0.1 ? 1 : 0.3 // 眨眼效果
  
  // 左眼
  ctx.beginPath()
  ctx.ellipse(spiritPos.value.x - 12, floatY - 8, 5, 5 * eyeOpen, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
  
  // 右眼
  ctx.beginPath()
  ctx.ellipse(spiritPos.value.x + 12, floatY - 8, 5, 5 * eyeOpen, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
  
  if (eyeOpen > 0.5) {
    // 瞳孔（跟随鼠标轻微移动）
    const pupilOffsetX = Math.sin(time * 0.8) * 2
    const pupilOffsetY = Math.cos(time * 0.6) * 1
    
    ctx.beginPath()
    ctx.arc(spiritPos.value.x - 14 + pupilOffsetX, floatY - 10 + pupilOffsetY, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = '#2C3E50'
    ctx.fill()
    
    ctx.beginPath()
    ctx.arc(spiritPos.value.x + 10 + pupilOffsetX, floatY - 10 + pupilOffsetY, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = '#2C3E50'
    ctx.fill()
    
    // 眼睛高光
    ctx.beginPath()
    ctx.arc(spiritPos.value.x - 16, floatY - 12, 1.2, 0, Math.PI * 2)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()
    
    ctx.beginPath()
    ctx.arc(spiritPos.value.x + 8, floatY - 12, 1.2, 0, Math.PI * 2)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()
  }
  
  // 腮红
  ctx.globalAlpha = 0.3
  ctx.beginPath()
  ctx.arc(spiritPos.value.x - 22, floatY + 2, 6, 0, Math.PI * 2)
  ctx.fillStyle = '#FF9F9F'
  ctx.fill()
  
  ctx.beginPath()
  ctx.arc(spiritPos.value.x + 22, floatY + 2, 6, 0, Math.PI * 2)
  ctx.fillStyle = '#FF9F9F'
  ctx.fill()
  ctx.globalAlpha = 1
  
  // 嘴巴（根据情绪变化 + 动态）
  ctx.beginPath()
  ctx.strokeStyle = '#2C3E50'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  
  const emotionValue = currentEmotion.value?.value || 5
  const mouthY = floatY + 5
  
  if (emotionValue >= 4) {
    // 开心 - 大笑
    ctx.beginPath()
    ctx.arc(spiritPos.value.x, mouthY, 12, 0.1, Math.PI - 0.1)
    ctx.stroke()
    
    // 舌头（动态）
    ctx.fillStyle = '#FF6B6B'
    ctx.beginPath()
    ctx.ellipse(spiritPos.value.x, mouthY + 6, 4, 3 + Math.sin(time * 5) * 1, 0, 0, Math.PI * 2)
    ctx.fill()
  } else if (emotionValue >= 2) {
    // 平静 - 微笑
    ctx.arc(spiritPos.value.x, mouthY, 10, 0.1, Math.PI - 0.1)
    ctx.stroke()
  } else {
    // 低落 - 撇嘴
    ctx.arc(spiritPos.value.x, mouthY + 8, 8, Math.PI + 0.2, Math.PI * 2 - 0.2)
    ctx.stroke()
  }
  
  // 周围小星星/粒子效果（动态）
  ctx.shadowBlur = 15
  for (let i = 0; i < 3; i++) {
    const angle = time * 2 + i * 2.1
    const starX = spiritPos.value.x + Math.cos(angle) * 55
    const starY = floatY + Math.sin(angle * 1.3) * 55
    
    ctx.fillStyle = mainColor
    ctx.globalAlpha = 0.4 + Math.sin(time * 3 + i) * 0.2
    ctx.beginPath()
    ctx.arc(starX, starY, 3, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  ctx.shadowBlur = 0
}

// 动画循环
let animationId = null
const animate = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  // 更新时间
  time += 0.05
  
  // 浮动效果
  floatOffset = Math.sin(time * 1.5) * 5
  
  // 呼吸效果
  breatheScale = 1 + Math.sin(time * 2) * 0.03
  
  // 眨眼（每3秒眨一次）
  eyeBlink = Math.sin(time * 0.3) > 0.9 ? 0 : 1
  
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
  drawSpirit(ctx)
  
  animationId = requestAnimationFrame(animate)
}

// 拖拽状态
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

const handleMouseDown = (e) => {
  const rect = canvasRef.value.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  
  const dist = Math.sqrt(
    Math.pow(mouseX - spiritPos.value.x, 2) + 
    Math.pow(mouseY - spiritPos.value.y, 2)
  )
  
  if (dist < 50) {
    isDragging.value = true
    dragOffset.value = {
      x: spiritPos.value.x - mouseX,
      y: spiritPos.value.y - mouseY
    }
  }
}

const handleMouseMove = (e) => {
  if (!isDragging.value) return
  
  const rect = canvasRef.value.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  
  spiritPos.value = {
    x: Math.max(50, Math.min(canvasWidth.value - 50, mouseX + dragOffset.value.x)),
    y: Math.max(50, Math.min(canvasHeight.value - 50, mouseY + dragOffset.value.y))
  }
}

const handleMouseUp = () => {
  isDragging.value = false
}

const handleCanvasClick = (e) => {
  if (isDragging.value) return
  
  const rect = canvasRef.value.getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const clickY = e.clientY - rect.top
  
  const dist = Math.sqrt(
    Math.pow(clickX - spiritPos.value.x, 2) + 
    Math.pow(clickY - spiritPos.value.y, 2)
  )
  
  if (dist < 50) {
    showEmotionPicker.value = !showEmotionPicker.value
    if (showEmotionPicker.value) {
      pickerPosition.value = {
        x: Math.max(10, Math.min(canvasWidth.value - 280, spiritPos.value.x - 120)),
        y: Math.max(10, spiritPos.value.y - 180)
      }
    }
  } else {
    showEmotionPicker.value = false
  }
}

const selectEmotion = (emotion) => {
  currentEmotion.value = emotion
  showEmotionPicker.value = false
  
  ElMessage.success(`✨ 记录成功：${emotion.emoji} ${emotion.label}`)
}

onMounted(() => {
  loadCustomEmotions()
  
  const container = canvasRef.value.parentElement
  canvasWidth.value = container.clientWidth
  canvasHeight.value = container.clientHeight
  spiritPos.value = {
    x: canvasWidth.value / 2,
    y: canvasHeight.value / 2
  }
  animate()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})
</script>

<style scoped lang="scss">
.spirit-container {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  overflow: hidden;
  position: relative;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
}

canvas:active {
  cursor: grabbing;
}

.emotion-picker {
  position: absolute;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  z-index: 100;
  min-width: 280px;
  padding: 16px;
  
  .picker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;
    
    span {
      font-weight: 600;
      color: #333;
    }
  }
  
  .emotion-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    max-height: 300px;
    overflow-y: auto;
    
    .emotion-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        transform: scale(1.05);
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
      }
      
      .emoji {
        font-size: 28px;
        margin-bottom: 4px;
      }
      
      .label {
        font-size: 12px;
        color: white;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      }
    }
  }
}

.emoji-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  
  span {
    font-size: 24px;
    padding: 6px 10px;
    background: #f5f7fa;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background: #e0e3e9;
      transform: scale(1.1);
    }
  }
}
</style>