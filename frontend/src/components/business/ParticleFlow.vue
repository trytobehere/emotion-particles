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
    
    <!-- 粒子悬停提示 -->
    <div v-if="hoveredParticle" class="particle-tooltip" :style="tooltipStyle">
      <div class="tooltip-content">
        <div class="emotion-color" :style="{ background: hoveredParticle.color }"></div>
        <div class="tooltip-text">{{ hoveredParticle.contentPreview }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  particles: {
    type: Array,
    default: () => []
  }
})

const router = useRouter()
const canvasRef = ref(null)
const particles = ref([])
const hoveredParticle = ref(null)
const tooltipStyle = ref({})

// 配置
const PARTICLE_COUNT_LIMIT = 500
const CONNECTION_DISTANCE = 120
const MOUSE_RADIUS = 100

// 模拟在线人数 (实际可以改为从后端获取)
const onlineCount = ref(156)
const mainEmotion = ref('开心')

// 粒子类
class Particle {
  constructor(data, canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    
    // 从后端数据初始化
    this.x = Math.random() * canvasWidth
    this.y = Math.random() * canvasHeight
    this.color = data.color || '#FFD93D'
    this.size = data.size || 8
    this.speed = data.speed || 0.5
    this.treeholeId = data.treeholeId || null
    this.contentPreview = data.contentPreview || ''
    this.type = data.type || 'mood'  // "treehole" 或 "mood"
    
    // ✅ 统一运动参数：所有粒子都运动
    this.vx = (Math.random() - 0.5) * this.speed
    this.vy = (Math.random() - 0.5) * this.speed - this.speed * 0.3 // 向上漂移
    
    // 树洞粒子稍大一点，更醒目
    if (this.type === 'treehole') {
      this.size = this.size * 1.2
    }
    
    // 交互状态
    this.isHovered = false
    this.glowIntensity = Math.random() * 20 + 15
    this.baseSize = this.size
    this.opacity = 0.6 + Math.random() * 0.4
  }
  
  update(mouseX, mouseY) {
    // ✅ 所有粒子都运动
    // 基础移动
    this.x += this.vx
    this.y += this.vy
    
    // 边界反弹 (带阻尼)
    if (this.x < 0 || this.x > this.canvasWidth) {
      this.vx *= -0.8
      this.x = Math.max(0, Math.min(this.canvasWidth, this.x))
    }
    if (this.y < 0 || this.y > this.canvasHeight) {
      this.vy *= -0.8
      this.y = Math.max(0, Math.min(this.canvasHeight, this.y))
    }
    
    // 速度限制
    const maxSpeed = 2.5
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy)
    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed
      this.vy = (this.vy / speed) * maxSpeed
    }
    
    // 缓慢随机漂移
    this.vx += (Math.random() - 0.5) * 0.02
    this.vy += (Math.random() - 0.5) * 0.02
    
    // 鼠标交互 - 排斥 + 悬停检测
    if (mouseX !== undefined && mouseY !== undefined) {
      const dx = this.x - mouseX
      const dy = this.y - mouseY
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      // 悬停检测
      this.isHovered = dist < this.size * 3
      
      // ✅ 树洞粒子：鼠标靠近时减速停下
      if (this.type === 'treehole' && dist < MOUSE_RADIUS * 1.5) {
        // 减速系数：距离越近，速度越慢
        const slowdown = Math.min(1, dist / (MOUSE_RADIUS * 1.5))
        this.vx *= slowdown * 0.95
        this.vy *= slowdown * 0.95
      }
      
      // 排斥效果 (只有情绪粒子被排斥，树洞星点固定)
      if (this.type !== 'treehole' && dist < MOUSE_RADIUS) {
        const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS
        this.vx += (dx / dist) * force * 0.3
        this.vy += (dy / dist) * force * 0.3
      }
    }
  }
  
  draw(ctx) {
    // 悬停时放大
    const currentSize = this.isHovered ? this.size * 1.8 : this.size
    
    // 🎯 树洞星点：绘制带有外圈的标记
    if (this.type === 'treehole') {
      // 绘制外圈 (光晕)
      const glowSize = currentSize * 3
      const glowGradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, glowSize
      )
      glowGradient.addColorStop(0, this.color + '40')
      glowGradient.addColorStop(0.5, this.color + '15')
      glowGradient.addColorStop(1, 'transparent')
      
      ctx.beginPath()
      ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2)
      ctx.fillStyle = glowGradient
      ctx.fill()
      
      // 绘制外圈环
      ctx.beginPath()
      ctx.arc(this.x, this.y, currentSize * 1.3, 0, Math.PI * 2)
      ctx.strokeStyle = this.color + '80'
      ctx.lineWidth = 2
      ctx.stroke()
    }
    
    // 绘制光晕 (动态闪烁)
    const glowSize = currentSize * 2.5
    const glowGradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, glowSize
    )
    glowGradient.addColorStop(0, this.color + '60')
    glowGradient.addColorStop(0.5, this.color + '20')
    glowGradient.addColorStop(1, 'transparent')
    
    ctx.beginPath()
    ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2)
    ctx.fillStyle = glowGradient
    ctx.fill()
    
    // 绘制星点主体
    ctx.shadowColor = this.color
    ctx.shadowBlur = this.isHovered ? 40 : this.glowIntensity
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    
    // 渐变填充
    const gradient = ctx.createRadialGradient(
      this.x - currentSize * 0.3, this.y - currentSize * 0.3, 0,
      this.x, this.y, currentSize
    )
    gradient.addColorStop(0, '#FFFFFF')
    gradient.addColorStop(0.3, this.color)
    gradient.addColorStop(1, this.color + '80')
    
    ctx.beginPath()
    ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.globalAlpha = this.opacity
    ctx.fill()
    
    // 高光
    ctx.shadowBlur = 0
    ctx.globalAlpha = 0.8
    ctx.beginPath()
    ctx.arc(this.x - currentSize * 0.25, this.y - currentSize * 0.25, currentSize * 0.3, 0, Math.PI * 2)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()
    
    // 重置
    ctx.globalAlpha = 1
    ctx.shadowBlur = 0
  }
}

// 初始化粒子
const initParticles = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  
  canvas.width = width
  canvas.height = height
  
  // 如果没有数据，生成模拟数据用于演示
  let data = props.particles
  if (!data || data.length === 0) {
    data = generateMockData(50)
  }
  
  // 限制粒子数量
  if (data.length > PARTICLE_COUNT_LIMIT) {
    data = data.slice(0, PARTICLE_COUNT_LIMIT)
  }
  
  particles.value = data.map(item => new Particle(item, width, height))
}

// 生成模拟数据 (用于演示，实际应使用后端数据)
const generateMockData = (count) => {
  const colors = ['#FFD93D', '#6BCB77', '#FF6B6B', '#A78BFA', '#FF9F9F', '#6BCB77']
  const emotions = ['开心', '平静', '兴奋', '低落', '焦虑', '疲惫']
  const mockData = []
  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)]
    const emotion = emotions[Math.floor(Math.random() * emotions.length)]
    // 前10个模拟树洞粒子，后40个模拟情绪粒子
    const type = i < 10 ? 'treehole' : 'mood'
    mockData.push({
      color: color,
      size: 5 + Math.random() * 15,
      speed: 0.2 + Math.random() * 1.5,
      treeholeId: type === 'treehole' ? i + 1 : null,
      contentPreview: type === 'treehole' ? `模拟树洞 #${i+1}` : `${emotion} ${Math.floor(Math.random() * 5) + 1}人`,
      type: type
    })
  }
  return mockData
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
        const opacity = (1 - dist / CONNECTION_DISTANCE) * 0.15
        
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }
  }
}

// 鼠标交互
const mousePos = ref(null)

const handleMouseMove = (e) => {
  const rect = canvasRef.value.getBoundingClientRect()
  mousePos.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
  
  // 更新悬停粒子
  const mx = mousePos.value.x
  const my = mousePos.value.y
  let found = null
  
  particles.value.forEach(p => {
    if (p.isHovered) {
      found = p
    }
  })
  
  if (found) {
    hoveredParticle.value = found
    tooltipStyle.value = {
      left: found.x + 20 + 'px',
      top: found.y - 20 + 'px'
    }
  } else {
    hoveredParticle.value = null
  }
}

const handleMouseLeave = () => {
  mousePos.value = null
  hoveredParticle.value = null
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
    if (dist < minDist && p.treeholeId) {
      minDist = dist
      nearest = p
    }
  })
  
  if (nearest) {
    // 跳转到树洞详情
    router.push('/treeholes/' + nearest.treeholeId)
  }
}

// 动画循环
let animationId = null
const animate = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // 绘制背景
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
  gradient.addColorStop(0, '#0a0a1a')
  gradient.addColorStop(0.5, '#1a1a3e')
  gradient.addColorStop(1, '#0f0f2a')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // 绘制星空背景 (小点)
  for (let i = 0; i < 50; i++) {
    const x = (i * 137.5) % canvas.width
    const y = (i * 97.3) % canvas.height
    const size = 0.5 + (i % 3) * 0.5
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${0.1 + (i % 5) * 0.05})`
    ctx.fill()
  }
  
  // 更新和绘制粒子
  particles.value.forEach(p => {
    p.update(mousePos.value?.x, mousePos.value?.y)
    p.draw(ctx)
  })
  
  // 绘制连接线
  drawConnections(ctx)
  
  animationId = requestAnimationFrame(animate)
}

// 窗口大小调整
const handleResize = () => {
  initParticles()
}

// 监听 props 变化
watch(() => props.particles, (newVal) => {
  if (newVal && newVal.length > 0) {
    initParticles()
  }
}, { deep: true })

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
  canvasRef.value.removeEventListener('mousemove', handleMouseMove)
  canvasRef.value.removeEventListener('mouseleave', handleMouseLeave)
  canvasRef.value.removeEventListener('click', handleClick)
})
</script>

<style scoped lang="scss">
.particle-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  cursor: default;
  
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
    padding: 12px 16px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    pointer-events: none;
    z-index: 20;
    max-width: 220px;
    animation: fadeIn 0.2s ease;
    
    .tooltip-content {
      display: flex;
      align-items: center;
      gap: 10px;
      
      .emotion-color {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      
      .tooltip-text {
        font-size: 13px;
        color: #333;
        line-height: 1.4;
      }
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>