<template>
  <canvas ref="canvasRef" :width="width" :height="height"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  width: { type: Number, default: 280 },
  height: { type: Number, default: 340 },
  color: { type: String, default: '#4A9EFF' },
  emotionId: { type: Number, default: 2 },
  isActive: { type: Boolean, default: true },
  followMode: { type: String, default: 'container' }, // 'container' | 'full'
})

const canvasRef = ref(null)
let animationId = null
let ctx = null

// 鼠标位置
const mousePos = ref({ x: props.width / 2, y: props.height / 2 })
const targetPos = ref({ x: props.width / 2, y: props.height / 2 })

// 精灵具体实现由子类覆盖
const setupCanvas = () => {
  if (!canvasRef.value) return
  ctx = canvasRef.value.getContext('2d')
}

const startAnimation = () => {
  if (animationId) cancelAnimationFrame(animationId)
  animate()
}

const animate = () => {
  if (!ctx || !props.isActive) {
    animationId = requestAnimationFrame(animate)
    return
  }
  
  // 清空画布
  ctx.clearRect(0, 0, props.width, props.height)
  
  // 子类实现绘制逻辑
  draw(ctx)
  
  animationId = requestAnimationFrame(animate)
}

// 子类需要实现的方法
const draw = (ctx) => {
  // 由子类覆盖
}

// 鼠标事件处理
const handleMouseMove = (e) => {
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return
  
  const scaleX = props.width / rect.width
  const scaleY = props.height / rect.height
  
  let clientX, clientY
  if (e.touches) {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else {
    clientX = e.clientX
    clientY = e.clientY
  }
  
  if (props.followMode === 'container') {
    targetPos.value = {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  } else {
    // 全屏跟随，映射到画布坐标
    const fullWidth = window.innerWidth
    const fullHeight = window.innerHeight
    targetPos.value = {
      x: (clientX / fullWidth) * props.width,
      y: (clientY / fullHeight) * props.height
    }
  }
}

// 平滑插值
const lerp = (start, end, t) => start + (end - start) * t

// 暴露方法给子类
defineExpose({
  canvasRef,
  ctx,
  mousePos,
  targetPos,
  lerp,
  handleMouseMove,
  setupCanvas,
  startAnimation
})

onMounted(() => {
  setupCanvas()
  startAnimation()
  
  // 绑定鼠标事件
  const canvas = canvasRef.value
  if (canvas) {
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('touchmove', handleMouseMove, { passive: false })
    canvas.addEventListener('touchstart', handleMouseMove, { passive: false })
  }
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  const canvas = canvasRef.value
  if (canvas) {
    canvas.removeEventListener('mousemove', handleMouseMove)
    canvas.removeEventListener('touchmove', handleMouseMove)
    canvas.removeEventListener('touchstart', handleMouseMove)
  }
})

watch(() => props.color, () => {
  // 颜色变化时触发重新绘制
})

watch(() => props.isActive, (active) => {
  if (active) {
    startAnimation()
  } else if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
})
</script>