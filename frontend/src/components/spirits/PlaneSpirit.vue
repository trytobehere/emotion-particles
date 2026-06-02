<template>
  <canvas ref="canvasRef" :width="width" :height="height"></canvas>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  width: { type: Number, default: 280 },
  height: { type: Number, default: 340 },
  color: { type: String, default: '#5D8A9C' },
  emotionId: { type: Number, default: 11 },
  isActive: { type: Boolean, default: true },
  followMode: { type: String, default: 'container' }
})

const canvasRef = ref(null)
let ctx = null
let animationId = null
let canvasElement = null

// 鼠标位置
const targetX = ref(props.width / 2)
const targetY = ref(props.height / 2)
const followX = ref(props.width / 2)
const followY = ref(props.height / 2)

// 拖尾路径
const trailPoints = []
const maxTrail = 22
const trailLength = 110

// 纸飞机参数
const bodyLength = 36
const wingSpan = 26

const handleMouseMove = (e) => {
  if (props.followMode === 'full') {
    const clientX = e.clientX || e.touches?.[0]?.clientX
    const clientY = e.clientY || e.touches?.[0]?.clientY
    if (clientX !== undefined) {
      targetX.value = (clientX / window.innerWidth) * props.width
      targetY.value = (clientY / window.innerHeight) * props.height
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
    
    // 计算鼠标在 canvas 内的位置
    let rawX = (clientX - rect.left) * scaleX
    let rawY = (clientY - rect.top) * scaleY
    
    // 边界保护（与原始 HTML 一致，留出 20px 边距）
    rawX = Math.min(Math.max(rawX, 20), canvasElement.width - 20)
    rawY = Math.min(Math.max(rawY, 20), canvasElement.height - 20)
    
    targetX.value = rawX
    targetY.value = rawY
  }
}

const drawPlane = (ctx, posX, posY, angle) => {
  const r = parseInt(props.color.slice(1,3), 16) || 93
  const g = parseInt(props.color.slice(3,5), 16) || 138
  const b = parseInt(props.color.slice(5,7), 16) || 156
  
  const tailX = posX - Math.cos(angle) * (bodyLength * 0.35)
  const tailY = posY - Math.sin(angle) * (bodyLength * 0.35)
  trailPoints.push({ x: tailX, y: tailY })
  if (trailPoints.length > maxTrail) {
    trailPoints.shift()
  }
  
  if (trailPoints.length >= 4) {
    ctx.beginPath()
    ctx.setLineDash([7, 9])
    ctx.lineDashOffset = -performance.now() / 40
    
    let totalLen = 0
    const points = []
    for (let i = trailPoints.length - 1; i >= 0; i--) {
      const p = trailPoints[i]
      if (points.length === 0) {
        points.push(p)
      } else {
        const last = points[points.length - 1]
        const dx = p.x - last.x
        const dy = p.y - last.y
        const dist = Math.hypot(dx, dy)
        if (totalLen + dist < trailLength) {
          points.push(p)
          totalLen += dist
        } else {
          const frac = (trailLength - totalLen) / dist
          points.push({ x: last.x + dx * frac, y: last.y + dy * frac })
          break
        }
      }
    }
    
    if (points.length >= 2) {
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y)
      }
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.5)`
      ctx.lineWidth = 2.0
      ctx.stroke()
    }
    ctx.setLineDash([])
  }
  
  ctx.save()
  ctx.translate(posX, posY)
  ctx.rotate(angle)
  
  ctx.beginPath()
  ctx.moveTo(bodyLength * 0.7, 0)
  ctx.lineTo(-bodyLength * 0.3, -wingSpan * 0.9)
  ctx.lineTo(-bodyLength * 0.3, wingSpan * 0.9)
  ctx.closePath()
  
  const grad = ctx.createLinearGradient(-10, -10, 10, 10)
  grad.addColorStop(0, `rgba(${r + 40}, ${g + 40}, ${b + 40}, 0.9)`)
  grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.7)`)
  grad.addColorStop(1, `rgba(${r - 20}, ${g - 20}, ${b - 20}, 0.5)`)
  ctx.fillStyle = grad
  ctx.fill()
  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.5)`
  ctx.lineWidth = 1.2
  ctx.stroke()
  
  ctx.beginPath()
  ctx.moveTo(-bodyLength * 0.2, -wingSpan * 0.2)
  ctx.lineTo(-bodyLength * 0.4, -wingSpan * 0.5)
  ctx.lineTo(-bodyLength * 0.4, -wingSpan * 0.1)
  ctx.closePath()
  ctx.fillStyle = `rgba(${r + 20}, ${g + 20}, ${b + 20}, 0.5)`
  ctx.fill()
  ctx.stroke()
  
  ctx.beginPath()
  ctx.moveTo(-bodyLength * 0.2, wingSpan * 0.2)
  ctx.lineTo(-bodyLength * 0.4, wingSpan * 0.5)
  ctx.lineTo(-bodyLength * 0.4, wingSpan * 0.1)
  ctx.closePath()
  ctx.fillStyle = `rgba(${r + 20}, ${g + 20}, ${b + 20}, 0.5)`
  ctx.fill()
  ctx.stroke()
  
  ctx.beginPath()
  ctx.moveTo(bodyLength * 0.4, 0)
  ctx.lineTo(bodyLength * 0.1, -wingSpan * 0.4)
  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`
  ctx.lineWidth = 0.9
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(bodyLength * 0.4, 0)
  ctx.lineTo(bodyLength * 0.1, wingSpan * 0.4)
  ctx.stroke()
  
  ctx.restore()
}

const render = () => {
  if (!ctx || !props.isActive) {
    animationId = requestAnimationFrame(render)
    return
  }
  
  // ✅ 高灵敏度跟随
  const speed = 0.25
  followX.value += (targetX.value - followX.value) * speed
  followY.value += (targetY.value - followY.value) * speed
  
  const dx = targetX.value - followX.value
  const dy = targetY.value - followY.value
  let angle = Math.atan2(dy, dx)
  if (Math.hypot(dx, dy) < 0.5) {
    angle = render.lastAngle || 0.2
  }
  render.lastAngle = angle
  
  ctx.clearRect(0, 0, props.width, props.height)
  
  const grad = ctx.createRadialGradient(
    props.width / 2, props.height / 2, 50,
    props.width / 2, props.height / 2, props.width / 2
  )
  const r = parseInt(props.color.slice(1,3), 16) || 93
  const g = parseInt(props.color.slice(3,5), 16) || 138
  const b = parseInt(props.color.slice(5,7), 16) || 156
  grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.05)`)
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, props.width, props.height)
  
  drawPlane(ctx, followX.value, followY.value, angle)
  
  animationId = requestAnimationFrame(render)
}
render.lastAngle = 0.2

onMounted(() => {
  canvasElement = canvasRef.value
  ctx = canvasElement.getContext('2d')
  
  if (!canvasElement) return
  
  // ✅ 在 canvas 上监听鼠标事件
  canvasElement.addEventListener('mousemove', handleMouseMove)
  canvasElement.addEventListener('touchmove', handleMouseMove, { passive: false })
  canvasElement.addEventListener('touchstart', handleMouseMove, { passive: false })
  
  // ✅ 鼠标移出容器时回到中心
  canvasElement.addEventListener('mouseleave', () => {
    targetX.value = props.width / 2
    targetY.value = props.height / 2
  })
  
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
    canvasElement.removeEventListener('mouseleave', () => {
      targetX.value = props.width / 2
      targetY.value = props.height / 2
    })
    canvasElement = null
  }
})
</script>