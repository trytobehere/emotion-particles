<template>
  <div class="emotion-sprite-container">
    <canvas 
      ref="canvasRef" 
      :width="canvasWidth" 
      :height="canvasHeight"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      @click="handleClick"
    ></canvas>
    
    <!-- 精灵信息 -->
    <div class="sprite-info" v-if="currentTemplate">
      <span class="sprite-name">{{ currentTemplate.name }}</span>
      <span class="usage-count">{{ currentTemplate.usageCount }}人使用</span>
    </div>
    
    <!-- 情绪选择器 -->
    <div 
      v-if="showEmotionPicker" 
      class="emotion-picker"
      :style="{ left: pickerPosition.x + 'px', top: pickerPosition.y + 'px' }"
    >
      <div class="picker-header">
        <span>选择情绪精灵</span>
        <el-button link @click="showSpriteLibrary = true">
          <el-icon><Plus /></el-icon>
          创建新精灵
        </el-button>
      </div>
      
      <div class="template-grid">
        <div 
          v-for="template in allTemplates" 
          :key="template.id"
          class="template-item"
          :class="{ active: currentTemplate?.id === template.id }"
          :style="{ borderColor: template.color }"
          @click="selectTemplate(template)"
        >
          <span class="template-emoji">{{ template.emoji }}</span>
          <span class="template-name">{{ template.name }}</span>
          <span class="template-emotion">{{ template.emotion }}</span>
        </div>
      </div>
    </div>
    
    <!-- 精灵库对话框 -->
    <el-dialog 
      v-model="showSpriteLibrary" 
      title="精灵工坊 - 创建你的情绪精灵" 
      width="90%"
      :close-on-click-modal="false"
    >
      <div class="sprite-library">
        <!-- 步骤1：选择基础形态 -->
        <div class="step">
          <div class="step-title">1. 选择精灵形态</div>
          <div class="shape-grid">
            <div 
              v-for="shape in shapes" 
              :key="shape.id"
              class="shape-item"
              :class="{ active: newTemplate.appearance.shape === shape.id }"
              @click="newTemplate.appearance.shape = shape.id"
            >
              <div class="shape-preview" :style="{ background: newTemplate.appearance.primaryColor }">
                {{ shape.icon }}
              </div>
              <span>{{ shape.name }}</span>
            </div>
          </div>
        </div>
        
        <!-- 步骤2：选择动画效果 -->
        <div class="step">
          <div class="step-title">2. 选择动画效果</div>
          <div class="animation-grid">
            <div 
              v-for="anim in animations" 
              :key="anim.id"
              class="animation-item"
              :class="{ active: newTemplate.animation.type === anim.id }"
              @click="newTemplate.animation.type = anim.id"
            >
              <span class="anim-icon">{{ anim.icon }}</span>
              <span>{{ anim.name }}</span>
            </div>
          </div>
        </div>
        
        <!-- 步骤3：设置颜色 -->
        <div class="step">
          <div class="step-title">3. 设置颜色</div>
          <div class="color-row">
            <span>主色调</span>
            <el-color-picker v-model="newTemplate.appearance.primaryColor" />
          </div>
          <div class="color-row">
            <span>副色调</span>
            <el-color-picker v-model="newTemplate.appearance.secondaryColor" />
          </div>
        </div>
        
        <!-- 步骤4：添加配饰 -->
        <div class="step">
          <div class="step-title">4. 添加配饰</div>
          <div class="accessory-grid">
            <div 
              v-for="acc in accessories" 
              :key="acc.id"
              class="accessory-item"
              :class="{ active: newTemplate.appearance.accessories.includes(acc.id) }"
              @click="toggleAccessory(acc.id)"
            >
              <span>{{ acc.icon }}</span>
              <span>{{ acc.name }}</span>
            </div>
          </div>
        </div>
        
        <!-- 步骤5：基本信息 -->
        <div class="step">
          <div class="step-title">5. 精灵信息</div>
          <el-input 
            v-model="newTemplate.name" 
            placeholder="精灵名称，如：快乐小狗"
            size="large"
            style="margin-bottom: 12px;"
          />
          <el-input 
            v-model="newTemplate.emotion" 
            placeholder="对应情绪，如：开心"
            size="large"
            style="margin-bottom: 12px;"
          />
          <el-input 
            v-model="newTemplate.emoji" 
            placeholder="表情符号，如：😊"
            maxlength="2"
            size="large"
            style="margin-bottom: 12px;"
          />
          <div class="value-slider">
            <span>情绪值: {{ newTemplate.value }}</span>
            <el-slider v-model="newTemplate.value" :min="1" :max="5" show-stops />
          </div>
          <el-input 
            v-model="newTemplate.description" 
            type="textarea"
            placeholder="描述一下这个精灵..."
            :rows="2"
          />
        </div>
        
        <!-- 预览 -->
        <div class="preview-section">
          <div class="preview-title">预览效果</div>
          <div class="preview-canvas-wrapper">
            <canvas ref="previewCanvasRef" width="200" height="200"></canvas>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showSpriteLibrary = false">取消</el-button>
        <el-button type="primary" @click="createNewTemplate">创建精灵</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useSpriteStore } from '@/stores/spriteStore'

const spriteStore = useSpriteStore()

const canvasRef = ref(null)
const previewCanvasRef = ref(null)
const canvasWidth = ref(400)
const canvasHeight = ref(400)

// 状态
const showEmotionPicker = ref(false)
const showSpriteLibrary = ref(false)
const pickerPosition = ref({ x: 0, y: 0 })
const currentTemplate = ref(spriteStore.currentTemplate)

// 位置和拖拽
const spritePos = ref({ x: 200, y: 200 })
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

// 动画参数
let time = 0
let animationId = null

// 所有模板
const allTemplates = computed(() => spriteStore.getAllTemplates())

// 创建新模板的表单
const newTemplate = ref({
  name: '',
  emotion: '',
  emoji: '😊',
  color: '#FFD93D',
  value: 3,
  description: '',
  animation: {
    type: 'bounce',
    speed: 1.0,
    intensity: 1.0
  },
  appearance: {
    shape: 'flame',
    primaryColor: '#FFD93D',
    secondaryColor: '#FF9F3D',
    size: 1.0,
    hasFace: true,
    accessories: []
  }
})

// 形态选项
const shapes = [
  { id: 'flame', name: '火苗', icon: '🔥' },
  { id: 'droplet', name: '水滴', icon: '💧' },
  { id: 'cloud', name: '云朵', icon: '☁️' },
  { id: 'star', name: '星星', icon: '⭐' },
  { id: 'heart', name: '爱心', icon: '❤️' },
  { id: 'leaf', name: '叶子', icon: '🍃' }
]

// 动画选项
const animations = [
  { id: 'bounce', name: '弹跳', icon: '⬆️⬇️' },
  { id: 'float', name: '漂浮', icon: '🎈' },
  { id: 'spin', name: '旋转', icon: '🔄' },
  { id: 'pulse', name: '脉动', icon: '💓' },
  { id: 'shake', name: '摇摆', icon: '↔️' },
  { id: 'wave', name: '波浪', icon: '🌊' }
]

// 配饰选项
const accessories = [
  { id: 'sparkle', name: '闪光', icon: '✨' },
  { id: 'glow', name: '光晕', icon: '💫' },
  { id: 'zzz', name: '瞌睡', icon: '💤' },
  { id: 'sweat', name: '汗滴', icon: '💦' },
  { id: 'rain', name: '小雨', icon: '🌧️' },
  { id: 'crown', name: '王冠', icon: '👑' }
]

// 切换配饰
const toggleAccessory = (accId) => {
  const index = newTemplate.value.appearance.accessories.indexOf(accId)
  if (index > -1) {
    newTemplate.value.appearance.accessories.splice(index, 1)
  } else {
    newTemplate.value.appearance.accessories.push(accId)
  }
}

// 绘制精灵
const drawSprite = (ctx, template, pos, size = 1.0) => {
  const app = template.appearance
  const anim = template.animation
  
  // 计算动画偏移
  let offsetX = 0, offsetY = 0
  let scale = app.size * size
  let rotation = 0
  
  switch (anim.type) {
    case 'bounce':
      offsetY = Math.abs(Math.sin(time * anim.speed * 3)) * 15 * anim.intensity
      scale *= 1 + Math.sin(time * anim.speed * 2) * 0.1
      break
    case 'float':
      offsetY = Math.sin(time * anim.speed) * 10 * anim.intensity
      offsetX = Math.cos(time * anim.speed * 0.7) * 5 * anim.intensity
      break
    case 'spin':
      rotation = time * anim.speed * anim.intensity
      break
    case 'pulse':
      scale *= 1 + Math.sin(time * anim.speed * 2) * 0.15 * anim.intensity
      break
    case 'shake':
      offsetX = Math.sin(time * anim.speed * 5) * 8 * anim.intensity
      break
    case 'wave':
      offsetX = Math.sin(time * anim.speed) * 12 * anim.intensity
      offsetY = Math.cos(time * anim.speed * 1.3) * 6 * anim.intensity
      break
  }
  
  const x = pos.x + offsetX
  const y = pos.y + offsetY
  const baseSize = 50 * scale
  
  // 光晕
  ctx.shadowColor = app.primaryColor
  ctx.shadowBlur = 30
  
  if (app.accessories.includes('glow')) {
    ctx.shadowBlur = 50
  }
  
  // 绘制主体
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  
  // 根据形状绘制
  const gradient = ctx.createRadialGradient(-10, -10, 5, 0, 0, baseSize)
  gradient.addColorStop(0, app.primaryColor)
  gradient.addColorStop(0.6, app.secondaryColor)
  gradient.addColorStop(1, app.primaryColor + '40')
  
  ctx.fillStyle = gradient
  
  switch (app.shape) {
    case 'flame':
      drawFlame(ctx, baseSize)
      break
    case 'droplet':
      drawDroplet(ctx, baseSize)
      break
    case 'cloud':
      drawCloud(ctx, baseSize)
      break
    case 'star':
      drawStar(ctx, baseSize)
      break
    case 'heart':
      drawHeart(ctx, baseSize)
      break
    case 'leaf':
      drawLeaf(ctx, baseSize)
      break
  }
  
  // 绘制配饰
  ctx.shadowBlur = 15
  drawAccessories(ctx, app.accessories, baseSize)
  
  // 绘制脸部
  ctx.shadowBlur = 0
  if (app.hasFace) {
    drawFace(ctx, template, baseSize)
  }
  
  ctx.restore()
}

// 绘制火苗
const drawFlame = (ctx, size) => {
  ctx.beginPath()
  ctx.moveTo(0, -size * 0.8)
  ctx.quadraticCurveTo(size * 0.5, -size * 0.3, size * 0.3, size * 0.5)
  ctx.quadraticCurveTo(0, size * 0.8, 0, size * 0.8)
  ctx.quadraticCurveTo(0, size * 0.8, -size * 0.3, size * 0.5)
  ctx.quadraticCurveTo(-size * 0.5, -size * 0.3, 0, -size * 0.8)
  ctx.fill()
}

// 绘制水滴
const drawDroplet = (ctx, size) => {
  ctx.beginPath()
  ctx.moveTo(0, -size * 0.8)
  ctx.quadraticCurveTo(size * 0.5, 0, 0, size * 0.8)
  ctx.quadraticCurveTo(-size * 0.5, 0, 0, -size * 0.8)
  ctx.fill()
}

// 绘制云朵
const drawCloud = (ctx, size) => {
  ctx.beginPath()
  ctx.arc(-size * 0.25, -size * 0.1, size * 0.35, 0, Math.PI * 2)
  ctx.arc(size * 0.25, -size * 0.15, size * 0.35, 0, Math.PI * 2)
  ctx.arc(0, size * 0.1, size * 0.4, 0, Math.PI * 2)
  ctx.fill()
}

// 绘制星星
const drawStar = (ctx, size) => {
  const points = 5
  const outerRadius = size * 0.7
  const innerRadius = size * 0.35
  
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const angle = (i * Math.PI) / points - Math.PI / 2
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
}

// 绘制爱心
const drawHeart = (ctx, size) => {
  ctx.beginPath()
  ctx.moveTo(0, size * 0.3)
  ctx.bezierCurveTo(-size * 0.5, -size * 0.3, -size * 0.7, size * 0.3, 0, size * 0.7)
  ctx.bezierCurveTo(size * 0.7, size * 0.3, size * 0.5, -size * 0.3, 0, size * 0.3)
  ctx.fill()
}

// 绘制叶子
const drawLeaf = (ctx, size) => {
  ctx.beginPath()
  ctx.ellipse(0, 0, size * 0.5, size * 0.7, 0, 0, Math.PI * 2)
  ctx.fill()
}

// 绘制配饰
const drawAccessories = (ctx, accList, size) => {
  if (accList.includes('sparkle')) {
    ctx.fillStyle = '#FFD700'
    for (let i = 0; i < 3; i++) {
      const angle = time * 2 + i * 2.1
      const x = Math.cos(angle) * size * 0.9
      const y = Math.sin(angle) * size * 0.9 - size * 0.3
      ctx.beginPath()
      ctx.arc(x, y, size * 0.08, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  
  if (accList.includes('zzz')) {
    ctx.font = `${size * 0.3}px Arial`
    ctx.fillStyle = '#FFFFFF80'
    ctx.fillText('💤', size * 0.5, -size * 0.5)
  }
  
  if (accList.includes('sweat')) {
    ctx.font = `${size * 0.25}px Arial`
    ctx.fillText('💦', size * 0.4, -size * 0.3)
  }
  
  if (accList.includes('rain')) {
    ctx.fillStyle = '#87CEEB80'
    for (let i = 0; i < 5; i++) {
      const x = -size * 0.4 + i * size * 0.2
      const y = size * 0.5 + Math.sin(time * 2 + i) * size * 0.1
      ctx.beginPath()
      ctx.arc(x, y, size * 0.05, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  
  if (accList.includes('crown')) {
    ctx.font = `${size * 0.4}px Arial`
    ctx.fillText('👑', -size * 0.2, -size * 0.7)
  }
}

// 绘制脸部
const drawFace = (ctx, template, size) => {
  const eyeY = -size * 0.1
  const eyeSpacing = size * 0.2
  
  // 眼睛
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(-eyeSpacing, eyeY, size * 0.12, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(eyeSpacing, eyeY, size * 0.12, 0, Math.PI * 2)
  ctx.fill()
  
  // 瞳孔
  ctx.fillStyle = '#2C3E50'
  ctx.beginPath()
  ctx.arc(-eyeSpacing - 2, eyeY, size * 0.06, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(eyeSpacing - 2, eyeY, size * 0.06, 0, Math.PI * 2)
  ctx.fill()
  
  // 嘴巴
  ctx.beginPath()
  ctx.strokeStyle = '#D32F2F'
  ctx.lineWidth = size * 0.04
  ctx.lineCap = 'round'
  
  const mouthY = eyeY + size * 0.2
  if (template.value >= 4) {
    ctx.arc(0, mouthY, size * 0.15, 0.1, Math.PI - 0.1)
  } else if (template.value <= 2) {
    ctx.arc(0, mouthY + size * 0.1, size * 0.12, Math.PI + 0.2, Math.PI * 2 - 0.2)
  } else {
    ctx.arc(0, mouthY, size * 0.12, 0.1, Math.PI - 0.1)
  }
  ctx.stroke()
}

// 动画循环
const animate = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  time += 0.05
  
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
  
  // 绘制背景
  const gradient = ctx.createRadialGradient(
    spritePos.value.x, spritePos.value.y, 0,
    spritePos.value.x, spritePos.value.y, 150
  )
  gradient.addColorStop(0, (currentTemplate.value?.color || '#FFD93D') + '20')
  gradient.addColorStop(1, 'transparent')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)
  
  if (currentTemplate.value) {
    drawSprite(ctx, currentTemplate.value, spritePos.value)
  }
  
  animationId = requestAnimationFrame(animate)
}

// 预览动画
let previewAnimationId = null
const animatePreview = () => {
  const canvas = previewCanvasRef.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, 200, 200)
  
  const previewPos = { x: 100, y: 100 }
  drawSprite(ctx, newTemplate.value, previewPos, 0.8)
  
  previewAnimationId = requestAnimationFrame(animatePreview)
}

// 选择模板
const selectTemplate = (template) => {
  currentTemplate.value = template
  spriteStore.setCurrentTemplate(template)
  showEmotionPicker.value = false
  ElMessage.success(`已切换到 ${template.name}`)
}

// 创建新模板
const createNewTemplate = () => {
  if (!newTemplate.value.name || !newTemplate.value.emotion) {
    ElMessage.warning('请填写精灵名称和对应情绪')
    return
  }
  
  newTemplate.value.color = newTemplate.value.appearance.primaryColor
  
  const created = spriteStore.addCustomTemplate({ ...newTemplate.value })
  currentTemplate.value = created
  spriteStore.setCurrentTemplate(created)
  
  showSpriteLibrary.value = false
  showEmotionPicker.value = false
  
  // 重置表单
  newTemplate.value = {
    name: '',
    emotion: '',
    emoji: '😊',
    color: '#FFD93D',
    value: 3,
    description: '',
    animation: { type: 'bounce', speed: 1.0, intensity: 1.0 },
    appearance: {
      shape: 'flame',
      primaryColor: '#FFD93D',
      secondaryColor: '#FF9F3D',
      size: 1.0,
      hasFace: true,
      accessories: []
    }
  }
  
  ElMessage.success('新精灵创建成功！')
}

// 拖拽逻辑
const handleMouseDown = (e) => {
  const rect = canvasRef.value.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  
  const dist = Math.sqrt(
    Math.pow(mouseX - spritePos.value.x, 2) + 
    Math.pow(mouseY - spritePos.value.y, 2)
  )
  
  if (dist < 70) {
    isDragging.value = true
    dragOffset.value = {
      x: spritePos.value.x - mouseX,
      y: spritePos.value.y - mouseY
    }
  }
}

const handleMouseMove = (e) => {
  if (!isDragging.value) return
  
  const rect = canvasRef.value.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  
  spritePos.value = {
    x: Math.max(60, Math.min(canvasWidth.value - 60, mouseX + dragOffset.value.x)),
    y: Math.max(60, Math.min(canvasHeight.value - 60, mouseY + dragOffset.value.y))
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
  
  const rect = canvasRef.value.getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const clickY = e.clientY - rect.top
  
  showEmotionPicker.value = !showEmotionPicker.value
  if (showEmotionPicker.value) {
    pickerPosition.value = {
      x: Math.max(10, Math.min(canvasWidth.value - 280, clickX - 120)),
      y: Math.max(10, clickY - 250)
    }
  }
}

// 监听模板变化更新预览
watch(() => newTemplate.value, () => {
  if (showSpriteLibrary) {
    cancelAnimationFrame(previewAnimationId)
    previewAnimationId = requestAnimationFrame(animatePreview)
  }
}, { deep: true })

onMounted(() => {
  spriteStore.loadFromLocal()
  
  const container = canvasRef.value.parentElement
  canvasWidth.value = container.clientWidth
  canvasHeight.value = container.clientHeight
  spritePos.value = {
    x: canvasWidth.value / 2,
    y: canvasHeight.value / 2
  }
  
  animate()
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (previewAnimationId) cancelAnimationFrame(previewAnimationId)
})
</script>

<style scoped lang="scss">
.emotion-sprite-container {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  
  canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
    
    &:active {
      cursor: grabbing;
    }
  }
  
  .sprite-info {
    position: absolute;
    bottom: 20px;
    left: 20px;
    display: flex;
    flex-direction: column;
    color: white;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    
    .sprite-name {
      font-size: 18px;
      font-weight: 600;
    }
    
    .usage-count {
      font-size: 12px;
      opacity: 0.8;
    }
  }
  
  .emotion-picker {
    position: absolute;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    z-index: 100;
    min-width: 300px;
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
    
    .template-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      max-height: 350px;
      overflow-y: auto;
      
      .template-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px 8px;
        border-radius: 16px;
        cursor: pointer;
        transition: all 0.3s;
        border: 2px solid transparent;
        background: #f5f7fa;
        
        &.active {
          border-width: 3px;
          background: #fff;
          transform: scale(1.02);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        
        &:hover {
          background: #fff;
        }
        
        .template-emoji {
          font-size: 32px;
          margin-bottom: 4px;
        }
        
        .template-name {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }
        
        .template-emotion {
          font-size: 11px;
          color: #999;
          margin-top: 2px;
        }
      }
    }
  }
}

// 精灵工坊样式
.sprite-library {
  max-height: 60vh;
  overflow-y: auto;
  padding: 10px;
  
  .step {
    margin-bottom: 24px;
    
    .step-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #333;
    }
  }
  
  .shape-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    
    .shape-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s;
      border: 2px solid transparent;
      
      &.active {
        border-color: #667eea;
        background: rgba(102, 126, 234, 0.1);
      }
      
      .shape-preview {
        width: 50px;
        height: 50px;
        border-radius: 25px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        margin-bottom: 8px;
      }
      
      span {
        font-size: 13px;
      }
    }
  }
  
  .animation-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    
    .animation-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s;
      border: 2px solid transparent;
      
      &.active {
        border-color: #667eea;
        background: rgba(102, 126, 234, 0.1);
      }
      
      .anim-icon {
        font-size: 24px;
        margin-bottom: 6px;
      }
      
      span:last-child {
        font-size: 13px;
      }
    }
  }
  
  .color-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
  }
  
  .accessory-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    
    .accessory-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s;
      border: 2px solid transparent;
      
      &.active {
        border-color: #667eea;
        background: rgba(102, 126, 234, 0.1);
      }
      
      span:first-child {
        font-size: 24px;
        margin-bottom: 6px;
      }
      
      span:last-child {
        font-size: 13px;
      }
    }
  }
  
  .value-slider {
    padding: 10px 0;
    
    span {
      display: block;
      margin-bottom: 10px;
    }
  }
  
  .preview-section {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #eee;
    
    .preview-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    
    .preview-canvas-wrapper {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 20px;
      display: flex;
      justify-content: center;
      padding: 20px;
      
      canvas {
        width: 150px;
        height: 150px;
      }
    }
  }
}
</style>