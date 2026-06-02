<template>
  <canvas ref="canvasRef" :width="width" :height="height"></canvas>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  width: { type: Number, default: 280 },
  height: { type: Number, default: 340 },
  color: { type: String, default: '#FF6B35' },
  emotionId: { type: Number, default: 9 },
  isActive: { type: Boolean, default: true },
  followMode: { type: String, default: 'container' }
})

const canvasRef = ref(null)
let ctx = null
let animationId = null
let particles = []
let time = 0
let canvasElement = null

// 火焰大小状态
let flameSize = 1.0 // 1.0 = 小火, 2.0 = 大火
let targetFlameSize = 1.0
let isBursting = false
let burstProgress = 0
const BURST_DURATION = 30

const center = { x: props.width / 2, y: props.height * 0.72 }

class CombineFlame {
  constructor(type) {
    this.type = type // 'core' | 'spark'
    this.reset()
  }

  reset() {
    const r = parseInt(props.color.slice(1,3), 16) || 255
    const g = parseInt(props.color.slice(3,5), 16) || 107
    const b = parseInt(props.color.slice(5,7), 16) || 53

    if (this.type === 'core') {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * 8 * flameSize
      this.x = center.x + Math.cos(angle) * radius
      this.y = center.y + Math.sin(angle) * radius
      this.size = (Math.random() * 4.5 + 3) * flameSize
      this.vx = (Math.random() - 0.5) * 0.5 * flameSize
      this.vy = -(Math.random() * 0.6 + 0.5) * flameSize
      this.maxLife = (Math.random() * 18 + 20) * flameSize
      const colorIntensity = 0.7 + Math.random() * 0.3
      this.baseColor = `rgba(${Math.min(r * colorIntensity, 255)}, ${Math.min(g * colorIntensity * 0.7, 255)}, ${Math.min(b * colorIntensity * 0.5, 255)}, `
    } else {
      this.x = center.x + (Math.random() - 0.5) * 25 * flameSize
      this.y = center.y + (Math.random() - 0.5) * 10 * flameSize
      this.size = (Math.random() * 2.2 + 0.8) * flameSize
      this.vx = (Math.random() - 0.5) * 2.8 * flameSize
      this.vy = -(Math.random() * 2.5 + 1.0) * flameSize
      this.maxLife = (Math.random() * 35 + 20) * flameSize
      const colorIntensity = 0.6 + Math.random() * 0.4
      this.baseColor = `rgba(${Math.min(r * colorIntensity, 255)}, ${Math.min(g * colorIntensity * 0.6, 255)}, ${Math.min(b * colorIntensity * 0.4, 255)}, `
    }

    this.life = this.maxLife
  }

  update() {
    this.x += this.vx
    this.y += this.vy
    this.life--

    if (this.type === 'core') {
      this.vx += (center.x - this.x) * 0.015
      this.size *= 0.97
    } else {
      this.vx += Math.sin(this.life * 0.1) * 0.12
    }

    if (this.life <= 0) this.reset()
  }

  draw() {
    const ratio = this.life / this.maxLife
    const alpha = this.type === 'core' ? ratio * 0.45 : ratio * 0.55
    ctx.fillStyle = this.baseColor + alpha + ')'
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
  }
}

const initParticles = () => {
  particles = []
  for (let i = 0; i < 40; i++) particles.push(new CombineFlame('core'))
  for (let i = 0; i < 100; i++) particles.push(new CombineFlame('spark'))
}

// 点击爆发 - 变成大火
const pokeFlame = () => {
  if (isBursting) return
  isBursting = true
  burstProgress = 0
  targetFlameSize = 2.0
}

const render = () => {
  if (!ctx || !props.isActive) {
    animationId = requestAnimationFrame(render)
    return
  }
  
  time += 0.05
  
  // 更新爆发状态 - 平滑过渡到目标大小
  if (isBursting) {
    burstProgress++
    // 平滑插值到目标大小
    const progress = Math.min(burstProgress / BURST_DURATION, 1)
    // 使用缓动函数：先快后慢
    const easeProgress = 1 - Math.pow(1 - progress, 2)
    flameSize = 1.0 + (targetFlameSize - 1.0) * easeProgress
    
    if (burstProgress >= BURST_DURATION) {
      // 恢复为小火
      targetFlameSize = 1.0
      // 再花一段时间恢复
      setTimeout(() => {
        isBursting = false
        flameSize = 1.0
        burstProgress = 0
      }, 500)
    }
  }
  
  // 如果不在爆发状态，确保火焰大小为1.0
  if (!isBursting && flameSize > 1.0) {
    flameSize *= 0.95
    if (flameSize < 1.01) flameSize = 1.0
  }
  
  ctx.fillStyle = 'rgba(15, 18, 22, 0.25)'
  ctx.fillRect(0, 0, props.width, props.height)
  
  const r = parseInt(props.color.slice(1,3), 16) || 255
  const g = parseInt(props.color.slice(3,5), 16) || 107
  const b = parseInt(props.color.slice(5,7), 16) || 53
  
  // 底部辉光 - 随火焰大小变化
  const glowRadius = 70 
  const glowIntensity = 0.15
  
  const glow = ctx.createRadialGradient(center.x, center.y, 5, center.x, center.y - 15, glowRadius)
  glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${glowIntensity})`)
  glow.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${glowIntensity * 0.3})`)
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(center.x, center.y - 10, glowRadius, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.globalCompositeOperation = 'lighter'
  particles.forEach(p => {
    p.update()
    p.draw()
  })
  ctx.globalCompositeOperation = 'source-over'
  
  animationId = requestAnimationFrame(render)
}

onMounted(() => {
  canvasElement = canvasRef.value
  ctx = canvasElement.getContext('2d')
  initParticles()
  render()
  
  canvasElement.addEventListener('click', pokeFlame)
})

onBeforeUnmount(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  if (canvasElement) {
    canvasElement.removeEventListener('click', pokeFlame)
    canvasElement = null
  }
})
</script>