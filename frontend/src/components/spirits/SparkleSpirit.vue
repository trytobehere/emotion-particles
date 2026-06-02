<template>
  <canvas ref="canvasRef" :width="width" :height="height"></canvas>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  width: { type: Number, default: 280 },
  height: { type: Number, default: 340 },
  color: { type: String, default: '#FF6B6B' },
  emotionId: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  followMode: { type: String, default: 'container' }
})

const canvasRef = ref(null)
let ctx = null
let animationId = null
let canvasElement = null

let sparkles = []
const centerX = ref(props.width / 2)
const centerY = ref(props.height / 2)

class SparkleParticle {
  constructor(x, y, color) {
    this.x = x
    this.y = y
    const angle = Math.random() * Math.PI * 2
    const speed = 1 + Math.random() * 4
    this.vx = Math.cos(angle) * speed
    this.vy = Math.sin(angle) * speed
    this.radius = 1 + Math.random() * 3
    this.life = 20 + Math.random() * 30
    this.maxLife = this.life
    this.color = color
    this.gravity = 0.05 + Math.random() * 0.05
  }
  
  update() {
    this.x += this.vx
    this.y += this.vy
    this.vy += this.gravity
    this.vx *= 0.98
    this.life--
    this.radius *= 0.98
  }
  
  draw(ctx) {
    const ratio = this.life / this.maxLife
    const alpha = ratio * 0.9
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fillStyle = this.color.replace('1)', alpha + ')')
    ctx.fill()
    ctx.shadowColor = this.color.replace('1)', alpha * 0.5 + ')')
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius * 1.5, 0, Math.PI * 2)
    ctx.fillStyle = this.color.replace('1)', alpha * 0.3 + ')')
    ctx.fill()
    ctx.shadowBlur = 0
  }
}

const mouseX = ref(props.width / 2)
const mouseY = ref(props.height / 2)
let lastBurstTime = 0

const handleMouseMove = (e) => {
  if (props.followMode === 'full') {
    const clientX = e.clientX || e.touches?.[0]?.clientX
    const clientY = e.clientY || e.touches?.[0]?.clientY
    if (clientX !== undefined) {
      mouseX.value = (clientX / window.innerWidth) * props.width
      mouseY.value = (clientY / window.innerHeight) * props.height
    }
  } else {
    // ✅ 复刻原始 HTML 的实现
    const rect = canvasElement.getBoundingClientRect()
    const scaleX = canvasElement.width / rect.width
    const scaleY = canvasElement.height / rect.height
    
    let clientX, clientY
    if (e.touches) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
      e.preventDefault()
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    
    let rawX = (clientX - rect.left) * scaleX
    let rawY = (clientY - rect.top) * scaleY
    
    rawX = Math.min(Math.max(rawX, 20), canvasElement.width - 20)
    rawY = Math.min(Math.max(rawY, 20), canvasElement.height - 20)
    
    mouseX.value = rawX
    mouseY.value = rawY
  }
}

const burst = (x, y, color, count = 30) => {
  const r = parseInt(color.slice(1,3), 16) || 255
  const g = parseInt(color.slice(3,5), 16) || 107
  const b = parseInt(color.slice(5,7), 16) || 107
  
  const colors = []
  for (let i = 0; i < 5; i++) {
    const variation = 30 + Math.random() * 40
    colors.push(`rgba(${Math.min(r + variation, 255)}, ${Math.min(g + variation * 0.5, 255)}, ${Math.min(b + variation * 0.3, 255)}, 1)`)
  }
  
  for (let i = 0; i < count; i++) {
    const colorIndex = Math.floor(Math.random() * colors.length)
    sparkles.push(new SparkleParticle(x, y, colors[colorIndex]))
  }
}

const render = () => {
  if (!ctx || !props.isActive) {
    animationId = requestAnimationFrame(render)
    return
  }
  
  ctx.fillStyle = 'rgba(11, 17, 23, 0.1)'
  ctx.fillRect(0, 0, props.width, props.height)
  
  const now = Date.now()
  if (now - lastBurstTime > 800 + Math.random() * 1500) {
    lastBurstTime = now
    const x = mouseX.value + (Math.random() - 0.5) * 60
    const y = mouseY.value + (Math.random() - 0.5) * 40
    burst(x, y, props.color, 20 + Math.random() * 15)
  }
  
  sparkles.forEach(p => {
    p.update()
    p.draw(ctx)
  })
  sparkles = sparkles.filter(p => p.life > 0)
  
  const grad = ctx.createRadialGradient(mouseX.value, mouseY.value, 5, mouseX.value, mouseY.value, 60)
  const r = parseInt(props.color.slice(1,3), 16) || 255
  const g = parseInt(props.color.slice(3,5), 16) || 107
  const b = parseInt(props.color.slice(5,7), 16) || 107
  grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.05)`)
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(mouseX.value, mouseY.value, 60, 0, Math.PI * 2)
  ctx.fill()
  
  animationId = requestAnimationFrame(render)
}

onMounted(() => {
  canvasElement = canvasRef.value
  ctx = canvasElement.getContext('2d')
  
  if (!canvasElement) return
  
  // ✅ 在 canvas 上监听鼠标事件
  canvasElement.addEventListener('mousemove', handleMouseMove)
  canvasElement.addEventListener('touchmove', handleMouseMove, { passive: false })
  canvasElement.addEventListener('touchstart', handleMouseMove, { passive: false })
  
  setTimeout(() => {
    burst(centerX.value, centerY.value, props.color, 40)
  }, 200)
  
  render()
})

onBeforeUnmount(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  if (canvasElement) {
    canvasElement.removeEventListener('mousemove', handleMouseMove)
    canvasElement.removeEventListener('touchmove', handleMouseMove)
    canvasElement.removeEventListener('touchstart', handleMouseMove)
    canvasElement = null
  }
})
</script>