<template>
  <canvas ref="canvasRef" :width="width" :height="height"></canvas>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  width: { type: Number, default: window.innerWidth },
  height: { type: Number, default: window.innerHeight },
  color: { type: String, default: '#4A9EFF' },
  isActive: { type: Boolean, default: true }
})

const canvasRef = ref(null)
let stars = []
let animationId = null
let ctx = null
let canvasElement = null

class Star {
  constructor(w, h) {
    this.w = w
    this.h = h
    this.reset()
  }
  
  reset() {
    this.x = Math.random() * this.w
    this.y = Math.random() * this.h * 0.9 + this.h * 0.05
    this.r = 0.6 + Math.random() * 2.2
    this.vx = (Math.random() - 0.5) * 0.3
    this.vy = -(0.2 + Math.random() * 0.7)
    this.twinkleSpeed = 0.02 + Math.random() * 0.06
    this.twinklePhase = Math.random() * Math.PI * 2
    this.baseAlpha = 0.4 + Math.random() * 0.6
    this.life = 200 + Math.random() * 300
    this.maxLife = this.life
    this.highlightOffset = 0.2 + Math.random() * 0.3
  }
  
  update() {
    this.x += this.vx
    this.y += this.vy
    this.life--
    this.vx += Math.sin(this.life * 0.02 + this.y * 0.005) * 0.002
    this.twinklePhase += this.twinkleSpeed
    this.r *= 0.9995
    
    if (this.life <= 0 || this.y < -20 || this.r < 0.3) {
      this.reset()
    }
    if (this.x < -20 || this.x > this.w + 20) {
      this.reset()
    }
  }
  
  draw(ctx, mainColor) {
    const twinkle = 0.6 + 0.4 * Math.sin(this.twinklePhase)
    const ratio = Math.max(0.2, this.life / this.maxLife)
    const alpha = this.baseAlpha * ratio * twinkle
    
    if (alpha < 0.02) return
    
    // 使用主颜色
    let r, g, b
    if (mainColor === '#FFD700') {
      r = 255
      g = 215
      b = 0
    } else {
      r = parseInt(mainColor.slice(1,3), 16) || 74
      g = parseInt(mainColor.slice(3,5), 16) || 158
      b = parseInt(mainColor.slice(5,7), 16) || 255
    }
    
    // 发光光晕
    const glowRadius = this.r * 2.8
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowRadius)
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.25})`)
    grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${alpha * 0.08})`)
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2)
    ctx.fill()
    
    // 核心
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.r * 0.9, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.9})`
    ctx.fill()
    
    // 高光
    const hx = this.x - this.r * this.highlightOffset * 0.6
    const hy = this.y - this.r * this.highlightOffset * 0.7
    ctx.beginPath()
    ctx.arc(hx, hy, this.r * 0.25, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`
    ctx.fill()
    
    // 星芒
    if (this.r > 1.8 && alpha > 0.3) {
      const len = this.r * 1.2
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.1})`
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(this.x - len, this.y)
      ctx.lineTo(this.x + len, this.y)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(this.x, this.y - len)
      ctx.lineTo(this.x, this.y + len)
      ctx.stroke()
    }
  }
}

const initStars = (count = 320) => {
  stars = []
  for (let i = 0; i < count; i++) {
    const s = new Star(props.width, props.height)
    s.life = Math.floor(Math.random() * s.maxLife)
    stars.push(s)
  }
}

const render = () => {
  if (!ctx || !props.isActive) {
    animationId = requestAnimationFrame(render)
    return
  }
  
  ctx.fillStyle = 'rgba(11, 17, 23, 0.15)'
  ctx.fillRect(0, 0, props.width, props.height)
  
  let r, g, b
  if (props.color === '#FFD700') {
    r = 255
    g = 215
    b = 0
  } else {
    r = parseInt(props.color.slice(1,3), 16) || 74
    g = parseInt(props.color.slice(3,5), 16) || 158
    b = parseInt(props.color.slice(5,7), 16) || 255
  }
  
  // 底部光晕
  const grad = ctx.createRadialGradient(
    props.width / 2, props.height * 0.85, 20,
    props.width / 2, props.height * 0.80, props.height * 0.5
  )
  grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.03)`)
  grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.01)`)
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(props.width / 2, props.height * 0.80, props.height * 0.5, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.globalCompositeOperation = 'lighter'
  stars.forEach(s => {
    s.update()
    s.draw(ctx, props.color)
  })
  ctx.globalCompositeOperation = 'source-over'
  
  animationId = requestAnimationFrame(render)
}

onMounted(() => {
  canvasElement = canvasRef.value
  ctx = canvasElement.getContext('2d')
  initStars()
  render()
})

onBeforeUnmount(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
})

watch(() => props.color, () => {
  // 颜色变化自动应用
})

watch(() => props.width, () => {
  initStars()
})

watch(() => props.height, () => {
  initStars()
})
</script>

<style scoped>
canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  pointer-events: none;
}
</style>