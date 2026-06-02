<template>
  <canvas ref="canvasRef" :width="width" :height="height"></canvas>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'

const props = defineProps({
  width: { type: Number, default: 280 },
  height: { type: Number, default: 340 },
  color: { type: String, default: '#FFD700' },
  emotionId: { type: Number, default: 10 },
  isActive: { type: Boolean, default: true },
  followMode: { type: String, default: 'container' }
})

const canvasRef = ref(null)
let ctx = null
let animationId = null
let time = 0
let audioCtx = null
let canvasElement = null

// ✅ 动态琴键数量：根据容器宽度计算
// 每个琴键最小宽度为 20px，最大为 40px
const MIN_KEY_WIDTH = 20
const MAX_KEY_WIDTH = 40
const keyCount = computed(() => {
  // 计算能容纳的最大键数
  const maxKeys = Math.floor(props.width / MIN_KEY_WIDTH)
  // 限制最多26个键，最少7个键
  return Math.min(26, Math.max(7, maxKeys))
})

// ✅ 动态琴键宽度：所有琴键宽度之和小于容器宽度
const keyWidth = computed(() => {
  const count = keyCount.value
  // 计算每个琴键的宽度，使所有琴键宽度之和等于容器宽度的95%
  const totalWidth = props.width * 0.95
  return Math.min(MAX_KEY_WIDTH, Math.max(MIN_KEY_WIDTH, totalWidth / count))
})

// 键盘映射 - A-Z
const keyCodeMap = computed(() => {
  const map = {}
  const keyCodes = []
  for (let i = 0; i < 26; i++) {
    keyCodes.push(65 + i)
  }
  for (let i = 0; i < Math.min(keyCount.value, keyCodes.length); i++) {
    map[keyCodes[i]] = i
  }
  return map
})

// 音符频率
const noteFrequencies = computed(() => {
  const baseFreq = 261.63
  const freqs = []
  for (let i = 0; i < keyCount.value; i++) {
    freqs.push(baseFreq * Math.pow(2, i / 12))
  }
  return freqs
})

// 琴键参数
const keys = ref([])

// 音符粒子
let noteParticles = []

class NoteParticle {
  constructor(x, y, color) {
    this.x = x
    this.y = y
    this.vx = (Math.random() - 0.5) * 4
    this.vy = -Math.random() * 6 - 2
    this.radius = 2 + Math.random() * 3
    this.life = 40 + Math.random() * 20
    this.maxLife = this.life
    this.color = color
  }
  
  update() {
    this.x += this.vx
    this.y += this.vy
    this.vy -= 0.05
    this.life--
    this.radius *= 0.98
  }
  
  draw(ctx) {
    const ratio = this.life / this.maxLife
    const alpha = ratio * 0.8
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fillStyle = this.color.replace('1)', alpha + ')')
    ctx.fill()
  }
}

const initKeys = () => {
  const count = keyCount.value
  const width = keyWidth.value
  const totalWidth = count * width
  const startX = (props.width - totalWidth) / 2
  
  // ✅ 根据容器高度动态调整琴键位置
  // 容器越大，琴键越靠上，避免被边框遮挡
  const baseY = props.height - 60
  const adjustment = Math.max(0, (props.height - 340) * 0.1) // 容器每增加10px，琴键上移1px
  const yPos = baseY - adjustment
  
  const newKeys = []
  for (let i = 0; i < count; i++) {
    newKeys.push({
      x: startX + i * width,
      y: yPos,
      width: width,
      height: 60,
      isPressed: false,
      pressTime: 0,
      note: noteFrequencies.value[i % noteFrequencies.value.length]
    })
  }
  keys.value = newKeys
}

const playNote = (frequency) => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  const oscillator = audioCtx.createOscillator()
  const gainNode = audioCtx.createGain()
  oscillator.connect(gainNode)
  gainNode.connect(audioCtx.destination)
  oscillator.frequency.value = frequency
  oscillator.type = 'sine'
  gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2)
  oscillator.start()
  oscillator.stop(audioCtx.currentTime + 0.3)
}

const pressKey = (index) => {
  if (index < 0 || index >= keys.value.length) return
  const key = keys.value[index]
  key.isPressed = true
  key.pressTime = time
  playNote(key.note)
  
  const r = parseInt(props.color.slice(1,3), 16) || 255
  const g = parseInt(props.color.slice(3,5), 16) || 215
  const b = parseInt(props.color.slice(5,7), 16) || 0
  
  for (let i = 0; i < 10; i++) {
    const variation = 10 + Math.random() * 20
    noteParticles.push(new NoteParticle(
      key.x + key.width / 2 + (Math.random() - 0.5) * 15,
      key.y - 10 + (Math.random() - 0.5) * 10,
      `rgba(${Math.min(r + variation, 255)}, ${Math.min(g + variation * 0.5, 255)}, ${Math.min(b + variation * 0.3, 255)}, 1)`
    ))
  }
}

const handleKeyDown = (e) => {
  const index = keyCodeMap.value[e.keyCode]
  if (index !== undefined) {
    pressKey(index)
  }
}

const render = () => {
  if (!ctx || !props.isActive) {
    animationId = requestAnimationFrame(render)
    return
  }
  
  time += 0.05
  ctx.clearRect(0, 0, props.width, props.height)
  
  const r = parseInt(props.color.slice(1,3), 16) || 255
  const g = parseInt(props.color.slice(3,5), 16) || 215
  const b = parseInt(props.color.slice(5,7), 16) || 0
  
  const bgGrad = ctx.createRadialGradient(
    props.width / 2, props.height / 2, 20,
    props.width / 2, props.height / 2, props.width / 2
  )
  bgGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.08)`)
  bgGrad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.04)`)
  bgGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, props.width, props.height)
  
  // 绘制琴键
  keys.value.forEach((key, index) => {
    const isPressed = key.isPressed && (time - key.pressTime) < 10
    ctx.fillStyle = isPressed ? `rgba(${r}, ${g}, ${b}, 0.8)` : `rgba(${r * 0.6}, ${g * 0.6}, ${b * 0.6}, 0.3)`
    ctx.fillRect(key.x, key.y, key.width - 1, key.height) // 琴键高度固定60px
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`
    ctx.lineWidth = 1
    ctx.strokeRect(key.x, key.y, key.width - 1, key.height)
    ctx.fillStyle = `rgba(255, 255, 255, 0.3)`
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`♫`, key.x + key.width / 2, key.y + 30)
    if (isPressed && (time - key.pressTime) > 8) {
      key.isPressed = false
    }
  })

  noteParticles.forEach(p => {
    p.update()
    p.draw(ctx)
  })
  noteParticles = noteParticles.filter(p => p.life > 0)
  
  animationId = requestAnimationFrame(render)
}

// 使用 watch 监听宽度变化，重新初始化琴键
let resizeTimeout = null
watch(() => props.width, () => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
  resizeTimeout = setTimeout(() => {
    initKeys()
    resizeTimeout = null
  }, 50)
})

onMounted(() => {
  canvasElement = canvasRef.value
  ctx = canvasElement.getContext('2d')
  initKeys()
  render()
  
  document.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  if (audioCtx) {
    audioCtx.close()
    audioCtx = null
  }
  document.removeEventListener('keydown', handleKeyDown)
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
})
</script>