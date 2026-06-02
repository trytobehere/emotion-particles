<template>
  <canvas ref="canvasRef" :width="width" :height="height"></canvas>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  width: { type: Number, default: 280 },
  height: { type: Number, default: 340 },
  color: { type: String, default: '#4A9EFF' },
  emotionId: { type: Number, default: 2 },
  isActive: { type: Boolean, default: true },
  followMode: { type: String, default: 'container' }
})

const canvasRef = ref(null)
let ctx = null
let animationId = null
let time = 0
let canvasElement = null

// 水滴位置
const dropX = ref(props.width / 2)
const dropY = ref(props.height / 2)
const dropVX = ref(0)
const dropVY = ref(0)

// 跳动状态
let isJumping = false
let jumpProgress = 0
const JUMP_DURATION = 40

// 呼吸动画参数
const breathPhase = ref(0)

// 水滴尺寸
const DROP_WIDTH = 42
const DROP_HEIGHT = 54

// 涟漪效果
let activeRipples = []

class WaterRippleEffect {
  constructor(x, y, radius, intensity) {
    this.x = x
    this.y = y
    this.radius = radius
    this.maxRadius = radius + 38 * intensity
    this.intensity = intensity
    this.progress = 0
    this.duration = 0.9
    this.opacityVal = 0.55 * intensity
  }
  
  update(deltaSec) {
    this.progress += deltaSec / this.duration
    return this.progress < 1
  }
  
  draw(ctx) {
    const t = this.progress
    const currentR = this.radius + (this.maxRadius - this.radius) * t
    const alpha = this.opacityVal * (1 - t * 0.7)
    ctx.beginPath()
    ctx.arc(this.x, this.y, currentR, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(255, 250, 235, ${alpha * 0.7})`
    ctx.lineWidth = 1.8 * (1 - t * 0.55)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(this.x, this.y, currentR * 0.55, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(200, 235, 255, ${alpha * 0.18})`
    ctx.fill()
  }
}

// 绘制精致水滴
const drawRefinedDroplet = (ctx, x, y, color, time, scale = 1.0) => {
  const r = parseInt(color.slice(1,3), 16) || 74
  const g = parseInt(color.slice(3,5), 16) || 158
  const b = parseInt(color.slice(5,7), 16) || 255
  
  const breath = 1 + Math.sin(time * 0.03 + breathPhase.value) * 0.04
  
  let jumpScaleX = 1
  let jumpScaleY = 1
  let jumpOffsetY = 0
  
  if (isJumping) {
    const progress = jumpProgress / JUMP_DURATION
    if (progress < 0.15) {
      const t = progress / 0.15
      jumpScaleX = 1 + t * 0.25
      jumpScaleY = 1 - t * 0.25
      jumpOffsetY = t * 4
    } else if (progress < 0.35) {
      const t = (progress - 0.15) / 0.2
      jumpScaleX = 1.25 - t * 0.43
      jumpScaleY = 0.75 + t * 0.5
      jumpOffsetY = 4 - t * 20
    } else if (progress < 0.55) {
      const t = (progress - 0.35) / 0.2
      jumpScaleX = 0.82 + t * 0.3
      jumpScaleY = 1.25 - t * 0.37
      jumpOffsetY = -16 + t * 18
    } else if (progress < 0.7) {
      const t = (progress - 0.55) / 0.15
      jumpScaleX = 1.12 - t * 0.19
      jumpScaleY = 0.88 + t * 0.17
      jumpOffsetY = 2 - t * 4
    } else if (progress < 0.85) {
      const t = (progress - 0.7) / 0.15
      jumpScaleX = 0.93 + t * 0.06
      jumpScaleY = 1.05 - t * 0.04
      jumpOffsetY = -2 + t * 2
    } else {
      const t = (progress - 0.85) / 0.15
      jumpScaleX = 0.99 + t * 0.01
      jumpScaleY = 1.01 - t * 0.01
      jumpOffsetY = 0
    }
  }
  
  const finalScaleX = scale * breath * jumpScaleX
  const finalScaleY = scale * breath * jumpScaleY
  const finalOffsetY = jumpOffsetY
  
  ctx.save()
  ctx.translate(x, y + finalOffsetY)
  ctx.scale(finalScaleX, finalScaleY)
  
  ctx.beginPath()
  ctx.moveTo(0, -DROP_HEIGHT * 0.7)
  ctx.bezierCurveTo(
    DROP_WIDTH * 0.5, -DROP_HEIGHT * 0.3,
    DROP_WIDTH * 0.7, DROP_HEIGHT * 0.1,
    DROP_WIDTH * 0.7, DROP_HEIGHT * 0.4
  )
  ctx.bezierCurveTo(
    DROP_WIDTH * 0.7, DROP_HEIGHT * 0.8,
    DROP_WIDTH * 0.3, DROP_HEIGHT,
    0, DROP_HEIGHT
  )
  ctx.bezierCurveTo(
    -DROP_WIDTH * 0.3, DROP_HEIGHT,
    -DROP_WIDTH * 0.7, DROP_HEIGHT * 0.8,
    -DROP_WIDTH * 0.7, DROP_HEIGHT * 0.4
  )
  ctx.bezierCurveTo(
    -DROP_WIDTH * 0.7, DROP_HEIGHT * 0.1,
    -DROP_WIDTH * 0.5, -DROP_HEIGHT * 0.3,
    0, -DROP_HEIGHT * 0.7
  )
  ctx.closePath()
  
  // 通透光泽渐变
  const grad = ctx.createLinearGradient(0, -DROP_HEIGHT * 0.7, 0, DROP_HEIGHT)
  grad.addColorStop(0, `rgba(255, 255, 255, 0.9)`)
  grad.addColorStop(0.2, `rgba(${Math.min(r + 100, 255)}, ${Math.min(g + 100, 255)}, ${Math.min(b + 100, 255)}, 0.9)`)
  grad.addColorStop(0.4, `rgba(${Math.min(r + 60, 255)}, ${Math.min(g + 60, 255)}, ${Math.min(b + 60, 255)}, 0.95)`)
  grad.addColorStop(0.6, `rgba(${r + 20}, ${g + 20}, ${b + 20}, 0.9)`)
  grad.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, 0.85)`)
  grad.addColorStop(1, `rgba(${Math.max(r - 30, 0)}, ${Math.max(g - 30, 0)}, ${Math.max(b - 30, 0)}, 0.6)`)
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.moveTo(0, -DROP_HEIGHT * 0.7)
  ctx.bezierCurveTo(
    DROP_WIDTH * 0.5, -DROP_HEIGHT * 0.3,
    DROP_WIDTH * 0.7, DROP_HEIGHT * 0.1,
    DROP_WIDTH * 0.7, DROP_HEIGHT * 0.4
  )
  ctx.bezierCurveTo(
    DROP_WIDTH * 0.7, DROP_HEIGHT * 0.8,
    DROP_WIDTH * 0.3, DROP_HEIGHT,
    0, DROP_HEIGHT
  )
  ctx.bezierCurveTo(
    -DROP_WIDTH * 0.3, DROP_HEIGHT,
    -DROP_WIDTH * 0.7, DROP_HEIGHT * 0.8,
    -DROP_WIDTH * 0.7, DROP_HEIGHT * 0.4
  )
  ctx.bezierCurveTo(
    -DROP_WIDTH * 0.7, DROP_HEIGHT * 0.1,
    -DROP_WIDTH * 0.5, -DROP_HEIGHT * 0.3,
    0, -DROP_HEIGHT * 0.7
  )
  ctx.closePath()
  ctx.fill()
  
  // 内层高光
  const innerGrad = ctx.createRadialGradient(
    -DROP_WIDTH * 0.15, -DROP_HEIGHT * 0.2, DROP_WIDTH * 0.05,
    -DROP_WIDTH * 0.15, -DROP_HEIGHT * 0.2, DROP_WIDTH * 0.4
  )
  innerGrad.addColorStop(0, `rgba(255, 255, 255, 0.35)`)
  innerGrad.addColorStop(0.5, `rgba(255, 255, 255, 0.1)`)
  innerGrad.addColorStop(1, `rgba(255, 255, 255, 0)`)
  ctx.fillStyle = innerGrad
  ctx.beginPath()
  ctx.moveTo(0, -DROP_HEIGHT * 0.7)
  ctx.bezierCurveTo(
    DROP_WIDTH * 0.5, -DROP_HEIGHT * 0.3,
    DROP_WIDTH * 0.7, DROP_HEIGHT * 0.1,
    DROP_WIDTH * 0.7, DROP_HEIGHT * 0.4
  )
  ctx.bezierCurveTo(
    DROP_WIDTH * 0.7, DROP_HEIGHT * 0.8,
    DROP_WIDTH * 0.3, DROP_HEIGHT,
    0, DROP_HEIGHT
  )
  ctx.bezierCurveTo(
    -DROP_WIDTH * 0.3, DROP_HEIGHT,
    -DROP_WIDTH * 0.7, DROP_HEIGHT * 0.8,
    -DROP_WIDTH * 0.7, DROP_HEIGHT * 0.4
  )
  ctx.bezierCurveTo(
    -DROP_WIDTH * 0.7, DROP_HEIGHT * 0.1,
    -DROP_WIDTH * 0.5, -DROP_HEIGHT * 0.3,
    0, -DROP_HEIGHT * 0.7
  )
  ctx.closePath()
  ctx.fill()
  
  // 精致边缘线
  ctx.strokeStyle = `rgba(${Math.min(r + 40, 255)}, ${Math.min(g + 40, 255)}, ${Math.min(b + 40, 255)}, 0.15)`
  ctx.lineWidth = 0.6
  ctx.beginPath()
  ctx.moveTo(0, -DROP_HEIGHT * 0.7)
  ctx.bezierCurveTo(
    DROP_WIDTH * 0.5, -DROP_HEIGHT * 0.3,
    DROP_WIDTH * 0.7, DROP_HEIGHT * 0.1,
    DROP_WIDTH * 0.7, DROP_HEIGHT * 0.4
  )
  ctx.bezierCurveTo(
    DROP_WIDTH * 0.7, DROP_HEIGHT * 0.8,
    DROP_WIDTH * 0.3, DROP_HEIGHT,
    0, DROP_HEIGHT
  )
  ctx.bezierCurveTo(
    -DROP_WIDTH * 0.3, DROP_HEIGHT,
    -DROP_WIDTH * 0.7, DROP_HEIGHT * 0.8,
    -DROP_WIDTH * 0.7, DROP_HEIGHT * 0.4
  )
  ctx.bezierCurveTo(
    -DROP_WIDTH * 0.7, DROP_HEIGHT * 0.1,
    -DROP_WIDTH * 0.5, -DROP_HEIGHT * 0.3,
    0, -DROP_HEIGHT * 0.7
  )
  ctx.closePath()
  ctx.stroke()
  
  // 主高光
  const hx = -DROP_WIDTH * 0.32
  const hy = -DROP_HEIGHT * 0.32
  const hr = DROP_WIDTH * 0.22
  const hGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr)
  hGrad.addColorStop(0, `rgba(255, 255, 255, 0.8)`)
  hGrad.addColorStop(0.4, `rgba(255, 255, 255, 0.3)`)
  hGrad.addColorStop(1, `rgba(255, 255, 255, 0)`)
  ctx.fillStyle = hGrad
  ctx.beginPath()
  ctx.arc(hx, hy, hr, 0, Math.PI * 2)
  ctx.fill()
  
  // 第二高光
  const hx2 = DROP_WIDTH * 0.2
  const hy2 = DROP_HEIGHT * 0.2
  const hr2 = DROP_WIDTH * 0.05
  ctx.fillStyle = `rgba(255, 255, 255, 0.25)`
  ctx.beginPath()
  ctx.arc(hx2, hy2, hr2, 0, Math.PI * 2)
  ctx.fill()
  
  // 底部反光
  const lx = DROP_WIDTH * 0.1
  const ly = DROP_HEIGHT * 0.45
  const lr = DROP_WIDTH * 0.15
  const lGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr)
  lGrad.addColorStop(0, `rgba(255, 255, 255, 0.08)`)
  lGrad.addColorStop(1, `rgba(255, 255, 255, 0)`)
  ctx.fillStyle = lGrad
  ctx.beginPath()
  ctx.arc(lx, ly, lr, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.restore()
}

// 涟漪效果
const emitRipple = (x, y, intensity = 1.0) => {
  const bottomY = y + DROP_HEIGHT * 0.4
  const ripple1 = new WaterRippleEffect(x, bottomY, 3, intensity)
  activeRipples.push(ripple1)
  setTimeout(() => {
    const ripple2 = new WaterRippleEffect(x, bottomY, 11, intensity * 0.68)
    activeRipples.push(ripple2)
  }, 55)
  setTimeout(() => {
    const ripple3 = new WaterRippleEffect(x, bottomY, 20, intensity * 0.45)
    activeRipples.push(ripple3)
  }, 120)
}

// 点击跳动
const jump = () => {
  if (isJumping) return
  
  isJumping = true
  jumpProgress = 0
  
  if (props.followMode === 'full') {
    // 全屏模式：随机方向移动
    const angle = Math.random() * Math.PI * 2
    const force = 3 + Math.random() * 4
    dropVX.value = Math.cos(angle) * force
    dropVY.value = Math.sin(angle) * force - 2
    
    emitRipple(dropX.value, dropY.value, 1.0)
  } else {
    // 容器模式：原地跳动
    emitRipple(dropX.value, dropY.value, 1.0)
  }
}

// 创建CSS背景粒子（方案二：创建时清理）
const createParticles = () => {
  const container = canvasElement.parentElement
  if (!container) return
  
  // ✅ 清理旧粒子
  const oldParticles = container.querySelectorAll('.water-particle-css, .sparkle-particle-css')
  oldParticles.forEach(p => p.remove())
  
  const area = props.width * props.height
  const baseArea = 280 * 340
  const ratio = Math.min(1, area / baseArea)
  
  const waterCount = Math.floor(140 * ratio)
  for (let i = 0; i < waterCount; i++) {
    const dot = document.createElement('div')
    dot.className = 'water-particle-css'
    const size = 1.5 + Math.random() * 3.5
    dot.style.width = size + 'px'
    dot.style.height = size + 'px'
    dot.style.position = 'absolute'
    dot.style.left = (5 + Math.random() * 90) + '%'
    dot.style.top = (5 + Math.random() * 85) + '%'
    dot.style.borderRadius = '50%'
    dot.style.background = `radial-gradient(circle, rgba(${parseInt(props.color.slice(1,3), 16) || 74}, ${parseInt(props.color.slice(3,5), 16) || 158}, ${parseInt(props.color.slice(5,7), 16) || 255}, 0.3), rgba(180, 215, 245, 0.05))`
    dot.style.boxShadow = `0 0 6px rgba(${parseInt(props.color.slice(1,3), 16) || 74}, ${parseInt(props.color.slice(3,5), 16) || 158}, ${parseInt(props.color.slice(5,7), 16) || 255}, 0.05)`
    dot.style.animation = `particleFloat ${5 + Math.random() * 5}s ease-in-out infinite`
    dot.style.animationDelay = (Math.random() * 5) + 's'
    dot.style.pointerEvents = 'none'
    container.appendChild(dot)
  }
  
  const sparkleCount = Math.floor(240 * ratio)
  for (let i = 0; i < sparkleCount; i++) {
    const dot = document.createElement('div')
    dot.className = 'sparkle-particle-css'
    const size = 0.8 + Math.random() * 2
    dot.style.width = size + 'px'
    dot.style.height = size + 'px'
    dot.style.position = 'absolute'
    dot.style.left = (5 + Math.random() * 90) + '%'
    dot.style.top = (5 + Math.random() * 85) + '%'
    dot.style.borderRadius = '50%'
    dot.style.background = `radial-gradient(circle, rgba(255, 255, 255, 0.8), rgba(200, 235, 255, 0.3))`
    dot.style.boxShadow = `0 0 4px rgba(255, 255, 255, 0.2)`
    dot.style.animation = `sparkleFloat ${3 + Math.random() * 4}s ease-in-out infinite`
    dot.style.animationDelay = (Math.random() * 4) + 's'
    dot.style.pointerEvents = 'none'
    container.appendChild(dot)
  }
}

const render = () => {
  if (!ctx || !props.isActive) {
    animationId = requestAnimationFrame(render)
    return
  }
  
  time += 0.05
  breathPhase.value += 0.03
  
  if (isJumping) {
    jumpProgress++
    if (jumpProgress >= JUMP_DURATION) {
      isJumping = false
      jumpProgress = 0
    }
  }
  
  if (props.followMode === 'full') {
    dropX.value += dropVX.value
    dropY.value += dropVY.value
    
    const margin = 40
    if (dropX.value < margin) {
      dropX.value = margin
      dropVX.value = -dropVX.value * 0.85
    } else if (dropX.value > props.width - margin) {
      dropX.value = props.width - margin
      dropVX.value = -dropVX.value * 0.85
    }
    if (dropY.value < margin) {
      dropY.value = margin
      dropVY.value = -dropVY.value * 0.85
    } else if (dropY.value > props.height - margin) {
      dropY.value = props.height - margin
      dropVY.value = -dropVY.value * 0.85
    }
    
    dropVX.value *= 0.995
    dropVY.value *= 0.995
  } else {
    dropX.value = props.width / 2
    dropY.value = props.height / 2
  }
  
  ctx.clearRect(0, 0, props.width, props.height)
  
  const r = parseInt(props.color.slice(1,3), 16) || 74
  const g = parseInt(props.color.slice(3,5), 16) || 158
  const b = parseInt(props.color.slice(5,7), 16) || 255
  const auraGrad = ctx.createRadialGradient(dropX.value, dropY.value, 10, dropX.value, dropY.value, 90)
  auraGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.05)`)
  auraGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
  ctx.fillStyle = auraGrad
  ctx.beginPath()
  ctx.arc(dropX.value, dropY.value, 90, 0, Math.PI * 2)
  ctx.fill()
  
  activeRipples.forEach((ripple, index) => {
    const alive = ripple.update(0.033)
    if (alive) {
      ripple.draw(ctx)
    } else {
      activeRipples.splice(index, 1)
    }
  })
  
  drawRefinedDroplet(ctx, dropX.value, dropY.value, props.color, time)
  
  const refGrad = ctx.createRadialGradient(dropX.value, dropY.value + 35, 5, dropX.value, dropY.value + 35, 50)
  refGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.15)`)
  refGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
  ctx.fillStyle = refGrad
  ctx.beginPath()
  ctx.arc(dropX.value, dropY.value + 35, 50, 0, Math.PI * 2)
  ctx.fill()
  
  animationId = requestAnimationFrame(render)
}

// 监听容器大小变化
watch(() => props.width, () => {
  if (canvasElement) {
    createParticles()
  }
})

watch(() => props.height, () => {
  if (canvasElement) {
    createParticles()
  }
})

onMounted(() => {
  canvasElement = canvasRef.value
  ctx = canvasElement.getContext('2d')
  
  dropX.value = props.width / 2
  dropY.value = props.height / 2
  
  createParticles()
  
  canvasElement.addEventListener('click', jump)
  
  render()
})

onBeforeUnmount(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  if (canvasElement) {
    canvasElement.removeEventListener('click', jump)
    canvasElement = null
  }
  
  // ✅ 方案一：在组件卸载时清理粒子
  const container = canvasRef.value?.parentElement
  if (container) {
    const particles = container.querySelectorAll('.water-particle-css, .sparkle-particle-css')
    particles.forEach(p => p.remove())
  }
})
</script>

<style>
.water-particle-css {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.sparkle-particle-css {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

@keyframes particleFloat {
  0%, 100% { transform: translateY(0px) scale(1); opacity: 0.15; }
  30% { transform: translateY(-15px) scale(1.1); opacity: 0.4; }
  70% { transform: translateY(-35px) scale(1.15); opacity: 0.25; }
}

@keyframes sparkleFloat {
  0% { opacity: 0; transform: scale(0.5) translateY(0px); }
  25% { opacity: 1; transform: scale(1.2) translateY(-5px); }
  70% { opacity: 0.6; transform: scale(0.8) translateY(-2px); }
  100% { opacity: 0; transform: scale(0.3) translateY(3px); }
}
</style>