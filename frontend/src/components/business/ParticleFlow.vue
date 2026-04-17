<template>
  <div class="particle-container">
    <canvas ref="canvasRef" class="particle-canvas"></canvas>
    
    <!-- 悬浮信息卡片 -->
    <div class="info-overlay">
      <div class="online-count">
        <span class="dot"></span>
        <span>{{ onlineCount }} 人在线</span>
      </div>
      <div class="emotion-summary">
        <span>今日主情绪</span>
        <span class="main-emotion">{{ mainEmotion }}</span>
      </div>
    </div>
    
    <!-- 点击粒子提示 -->
    <div v-if="selectedParticle" class="particle-tooltip" :style="tooltipStyle">
      <div class="emotion-icon">{{ selectedParticle.emoji }}</div>
      <div class="emotion-name">{{ selectedParticle.emotion }}</div>
      <div class="user-info">匿名用户 · {{ selectedParticle.time }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const canvasRef = ref(null)
const particles = ref([])
const selectedParticle = ref(null)
const tooltipStyle = ref({})

// 配置
const PARTICLE_COUNT = 200
const CONNECTION_DISTANCE = 120

// 情绪颜色映射
const emotionColors = {
  '😊 开心': '#FFD93D',
  '😌 平静': '#6BCB77',
  '😫 疲惫': '#9B9B9B',
  '😰 焦虑': '#FF9F9F',
  '🤩 兴奋': '#FF6B6B',
  '😔 低落': '#A78BFA'
}

// 模拟在线人数
const onlineCount = ref(156)
const mainEmotion = ref('😊 开心')

// 粒子类
class Particle {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.reset()
  }
  
  reset() {
    this.x = Math.random() * this.canvasWidth
    this.y = Math.random() * this.canvasHeight
    this.vx = (Math.random() - 0.5) * 0.8
    this.vy = (Math.random() - 0.5) * 0.8
    this.size = Math.random() * 6 + 4
    
    // 随机情绪
    const emotions = Object.keys(emotionColors)
    this.emotion = emotions[Math.floor(Math.random() * emotions.length)]
    this.emoji = this.emotion.split(' ')[0]
    this.color = emotionColors[this.emotion]
    
    // 时间标签
    const times = ['刚刚', '5分钟前', '10分钟前', '30分钟前', '1小时前']
    this.time = times[Math.floor(Math.random() * times.length)]
    
    this.opacity = Math.random() * 0.5 + 0.3
    this.glowIntensity = Math.random() * 20 + 10
  }
  
  update(mouseX, mouseY) {
    // 基础移动
    this.x += this.vx
    this.y += this.vy
    
    // 边界反弹（带阻尼）
    if (this.x < 0 || this.x > this.canvasWidth) {
      this.vx *= -0.8
      this.x = Math.max(0, Math.min(this.canvasWidth, this.x))
    }
    if (this.y < 0 || this.y > this.canvasHeight) {
      this.vy *= -0.8
      this.y = Math.max(0, Math.min(this.canvasHeight, this.y))
    }
    
    // 鼠标交互 - 排斥效果
    if (mouseX && mouseY) {
      const dx = this.x - mouseX
      const dy = this.y - mouseY
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      if (dist < 100) {
        const force = (100 - dist) / 100
        this.vx += (dx / dist) * force * 0.5
        this.vy += (dy / dist) * force * 0.5
      }
    }
    
    // 速度限制
    const maxSpeed = 2
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy)
    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed
      this.vy = (this.vy / speed) * maxSpeed
    }
    
    // 缓慢随机漂移
    this.vx += (Math.random() - 0.5) * 0.02
    this.vy += (Math.random() - 0.5) * 0.02
  }
  
  draw(ctx) {
    // 绘制光晕
    ctx.shadowColor = this.color
    ctx.shadowBlur = this.glowIntensity
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    
    // 绘制粒子
    const gradient = ctx.createRadialGradient(
      this.x - 2, this.y - 2, 0,
      this.x, this.y, this.size
    )
    gradient.addColorStop(0, this.color)
    gradient.addColorStop(0.7, this.color + '80')
    gradient.addColorStop(1, this.color + '20')
    
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.globalAlpha = this.opacity
    ctx.fill()
    
    // 重置阴影
    ctx.shadowBlur = 0
    ctx.globalAlpha = 1
    
    // 绘制表情符号
    ctx.font = `${this.size + 8}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'white'
    ctx.shadowColor = this.color
    ctx.shadowBlur = 10
    ctx.fillText(this.emoji, this.x, this.y - 1)
    ctx.shadowBlur = 0
  }
}

// 初始化粒子
const initParticles = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const width = window.innerWidth
  const height = window.innerHeight
  
  canvas.width = width
  canvas.height = height
  
  particles.value = []
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.value.push(new Particle(width, height))
  }
}

// 绘制连接线
const drawConnections = (ctx) => {
  const particleArray = particles.value
  
  for (let i = 0; i < particleArray.length; i++) {
    for (let j = i + 1; j < particleArray.length; j++) {
      const p1 = particleArray[i]
      const p2 = particleArray[j]
      
      const dx = p1.x - p2.x
      const dy = p1.y - p2.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      if (dist < CONNECTION_DISTANCE) {
        // 连接线透明度基于距离
        const opacity = (1 - dist / CONNECTION_DISTANCE) * 0.3
        
        // 渐变色连接线
        const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y)
        gradient.addColorStop(0, p1.color + '40')
        gradient.addColorStop(1, p2.color + '40')
        
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.strokeStyle = gradient
        ctx.lineWidth = 1
        ctx.globalAlpha = opacity
        ctx.stroke()
      }
    }
  }
  ctx.globalAlpha = 1
}

// 鼠标交互
const mousePos = ref(null)

const handleMouseMove = (e) => {
  const rect = canvasRef.value.getBoundingClientRect()
  mousePos.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
}

const handleMouseLeave = () => {
  mousePos.value = null
  selectedParticle.value = null
}

const handleClick = (e) => {
  const rect = canvasRef.value.getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const clickY = e.clientY - rect.top
  
  // 查找最近的粒子
  let minDist = 30
  let nearest = null
  
  particles.value.forEach(p => {
    const dist = Math.sqrt(
      Math.pow(clickX - p.x, 2) + 
      Math.pow(clickY - p.y, 2)
    )
    if (dist < minDist) {
      minDist = dist
      nearest = p
    }
  })
  
  if (nearest) {
    selectedParticle.value = nearest
    tooltipStyle.value = {
      left: nearest.x + 20 + 'px',
      top: nearest.y - 40 + 'px'
    }
  } else {
    selectedParticle.value = null
  }
}

// 动画循环
let animationId = null
const animate = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // 绘制背景渐变
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
  gradient.addColorStop(0, '#0a0a1a')
  gradient.addColorStop(0.5, '#1a1a3e')
  gradient.addColorStop(1, '#0f0f2a')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // 更新和绘制粒子
  particles.value.forEach(p => {
    p.update(mousePos.value?.x, mousePos.value?.y)
    p.draw(ctx)
  })
  
  // 绘制连接线
  drawConnections(ctx)
  
  // 更新在线人数（模拟变化）
  if (Math.random() < 0.01) {
    onlineCount.value = 150 + Math.floor(Math.random() * 30)
  }
  
  animationId = requestAnimationFrame(animate)
}

// 窗口大小调整
const handleResize = () => {
  initParticles()
}

onMounted(() => {
  initParticles()
  animate()
  
  window.addEventListener('resize', handleResize)
  canvasRef.value.addEventListener('mousemove', handleMouseMove)
  canvasRef.value.addEventListener('mouseleave', handleMouseLeave)
  canvasRef.value.addEventListener('click', handleClick)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
.particle-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  cursor: pointer;
  
  .particle-canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
  
  .info-overlay {
    position: absolute;
    top: 20px;
    left: 20px;
    right: 20px;
    display: flex;
    justify-content: space-between;
    pointer-events: none;
    z-index: 10;
    
    .online-count {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(10px);
      border-radius: 30px;
      color: white;
      font-size: 14px;
      
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #6BCB77;
        animation: pulse 2s infinite;
      }
    }
    
    .emotion-summary {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      padding: 8px 16px;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(10px);
      border-radius: 30px;
      color: white;
      font-size: 12px;
      
      .main-emotion {
        font-size: 18px;
        font-weight: 600;
        margin-top: 2px;
      }
    }
  }
  
  .particle-tooltip {
    position: absolute;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    padding: 16px;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    pointer-events: none;
    z-index: 20;
    min-width: 140px;
    animation: fadeIn 0.3s;
    
    .emotion-icon {
      font-size: 36px;
      text-align: center;
      margin-bottom: 8px;
    }
    
    .emotion-name {
      font-size: 16px;
      font-weight: 600;
      text-align: center;
      color: #333;
      margin-bottom: 4px;
    }
    
    .user-info {
      font-size: 12px;
      text-align: center;
      color: #999;
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>