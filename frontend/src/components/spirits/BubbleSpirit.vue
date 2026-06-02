<template>
  <div class="bubble-container">
    <canvas ref="canvasRef" :width="width" :height="height"></canvas>
    
    <!-- 底部文字输入框 -->
    <div class="text-input-wrapper">
      <div class="text-input-box">
        <input 
          type="text" 
          v-model="userText" 
          placeholder="输入文字，生成气泡..." 
          @keyup.enter="emitTextBubble"
        />
        <button @click="emitTextBubble" :style="buttonStyle">发送</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'

const props = defineProps({
  width: { type: Number, default: 280 },
  height: { type: Number, default: 340 },
  color: { type: String, default: '#9B59B6' },
  emotionId: { type: Number, default: 6 },
  isActive: { type: Boolean, default: true },
  followMode: { type: String, default: 'container' }
})

const canvasRef = ref(null)
let ctx = null
let animationId = null
let time = 0
let canvasElement = null

// 普通气泡
let bubbles = []

// 文字气泡
let textBubbles = []

// 用户输入的文字
const userText = ref('')

// 按钮样式（跟随当前精灵颜色）
const buttonStyle = computed(() => {
  const r = parseInt(props.color.slice(1,3), 16) || 155
  const g = parseInt(props.color.slice(3,5), 16) || 89
  const b = parseInt(props.color.slice(5,7), 16) || 182
  return {
    background: `linear-gradient(135deg, rgb(${r}, ${g}, ${b}), rgb(${r - 30}, ${g - 30}, ${b - 30}))`
  }
})

// 根据容器大小计算气泡数量
const bubbleCount = computed(() => {
  const area = props.width * props.height
  const baseArea = 280 * 340
  
  if (props.followMode === 'full') {
    return Math.floor(area / 10000) + 8
  }
  
  const ratio = Math.min(1, area / baseArea)
  return Math.floor(ratio * 8) + 3
})

// ---------- 颜色工具函数 ----------
function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return { h, s, l }
}

function hslToRgb(h, s, l) {
  let r, g, b
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
}

// ---------- 普通气泡类 ----------
class Bubble {
  constructor() {
    this.reset()
  }

  reset() {
    // 随机大小：3-22px
    this.r = 3 + Math.random() * 19
    
    // 出现位置：底部随机
    this.x = Math.random() * props.width
    this.y = props.height + 10 + Math.random() * 40
    
    // 随机速度：0.2-0.8px/帧
    this.speed = 0.2 + Math.random() * 0.6
    
    // 随机水平速度：-0.8 到 0.8
    this.vx = (Math.random() - 0.5) * 1.6
    this.vy = -this.speed
    
    // 左右飘动幅度
    this.wobble = 0.2 + Math.random() * 0.5
    this.wobbleSpeed = 0.01 + Math.random() * 0.03
    this.phase = Math.random() * Math.PI * 2
    
    // 透明度：0.5-0.9
    this.alpha = 0.5 + Math.random() * 0.4
    
    // 高光偏移
    this.hlOffX = (Math.random() - 0.5) * 0.3
    this.hlOffY = (Math.random() - 0.5) * 0.3 - 0.2
    
    // 生命周期：400-800帧，降低消失频率
    this.life = 400 + Math.random() * 400
    this.maxLife = this.life
    this.alive = true
    
    // 颜色变化
    this.hueShift = (Math.random() - 0.5) * 60
    this.satShift = (Math.random() - 0.5) * 0.3
    this.lightShift = (Math.random() - 0.5) * 0.2
  }

  update() {
    if (!this.alive) return
    
    this.y += this.vy
    this.x += Math.sin(this.phase + time * this.wobbleSpeed) * this.wobble
    this.vx += (Math.random() - 0.5) * 0.02
    this.vx = Math.max(-0.8, Math.min(0.8, this.vx))
    
    if (this.x < this.r) this.x = this.r
    if (this.x > props.width - this.r) this.x = props.width - this.r
    
    const breath = Math.sin(time * 0.02 + this.phase) * 0.05
    this.r *= (1 + breath * 0.2)
    
    this.life--
    if (this.y < -this.r * 2 || this.life <= 0) {
      this.reset()
      this.y = props.height + Math.random() * 50
    }
  }

  draw(ctx, mainColor) {
    if (!this.alive) return
    
    const ratio = Math.min(1, this.life / this.maxLife)
    const alpha = this.alpha * (0.7 + 0.3 * ratio)
    
    let r = parseInt(mainColor.slice(1,3), 16) || 155
    let g = parseInt(mainColor.slice(3,5), 16) || 89
    let b = parseInt(mainColor.slice(5,7), 16) || 182
    
    const hsl = rgbToHsl(r, g, b)
    const hue = (hsl.h + this.hueShift / 360) % 1
    const sat = Math.max(0.2, Math.min(0.9, hsl.s + this.satShift))
    const lig = Math.max(0.2, Math.min(0.8, hsl.l + this.lightShift))
    const rgb = hslToRgb(hue, sat, lig)
    r = rgb.r
    g = rgb.g
    b = rgb.b
    
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.25})`
    ctx.fill()

    const grad = ctx.createRadialGradient(
      this.x - this.r * 0.3, this.y - this.r * 0.3, this.r * 0.1,
      this.x, this.y, this.r
    )
    grad.addColorStop(0, `rgba(${r + 60}, ${g + 60}, ${b + 60}, ${alpha * 0.7})`)
    grad.addColorStop(0.3, `rgba(${r + 30}, ${g + 30}, ${b + 30}, ${alpha * 0.5})`)
    grad.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`)
    grad.addColorStop(0.9, `rgba(${r - 30}, ${g - 30}, ${b - 30}, ${alpha * 0.15})`)
    grad.addColorStop(1, `rgba(${r - 60}, ${g - 60}, ${b - 60}, ${alpha * 0.05})`)
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
    ctx.fill()

    const edgeHue = (hue + 0.2) % 1
    const edgeRgb = hslToRgb(edgeHue, 0.8, 0.7)
    ctx.strokeStyle = `rgba(${edgeRgb.r}, ${edgeRgb.g}, ${edgeRgb.b}, ${alpha * 0.35})`
    ctx.lineWidth = 1.0
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
    ctx.stroke()

    const hx = this.x - this.r * (0.35 + this.hlOffX * 0.1)
    const hy = this.y - this.r * (0.35 + this.hlOffY * 0.1)
    const hr = this.r * 0.25
    const hGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr)
    hGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.85})`)
    hGrad.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 0.35})`)
    hGrad.addColorStop(1, `rgba(255, 255, 255, 0)`)
    ctx.fillStyle = hGrad
    ctx.beginPath()
    ctx.arc(hx, hy, hr, 0, Math.PI * 2)
    ctx.fill()

    const hx2 = this.x + this.r * 0.2
    const hy2 = this.y + this.r * 0.25
    const hr2 = this.r * 0.06
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.3})`
    ctx.beginPath()
    ctx.arc(hx2, hy2, hr2, 0, Math.PI * 2)
    ctx.fill()

    const lx = this.x + this.r * 0.1
    const ly = this.y + this.r * 0.4
    const lr = this.r * 0.2
    const lGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr)
    lGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.15})`)
    lGrad.addColorStop(1, `rgba(255, 255, 255, 0)`)
    ctx.fillStyle = lGrad
    ctx.beginPath()
    ctx.arc(lx, ly, lr, 0, Math.PI * 2)
    ctx.fill()
  }
  
  // 碰撞检测
  collidesWith(other) {
    if (!this.alive || !other.alive) return false
    const dx = this.x - other.x
    const dy = this.y - other.y
    const dist = Math.sqrt(dx*dx + dy*dy)
    return dist < this.r + other.r
  }
}

// ---------- 文字气泡类 ----------
class TextBubble {
  constructor(text, x, y, mainColor) {
    this.text = text
    this.x = x
    this.y = y
    this.mainColor = mainColor
    this.width = 0
    this.height = 0
    this.alpha = 0
    this.targetAlpha = 1
    this.fadeSpeed = 0.03
    this.life = 500 + Math.random() * 300
    this.maxLife = this.life
    this.alive = true
    this.phase = Math.random() * Math.PI * 2
    this.speed = 0.2 + Math.random() * 0.5
    this.vx = (Math.random() - 0.5) * 0.6
    this.vy = -this.speed
  }

  update() {
    if (!this.alive) return
    
    if (this.alpha < this.targetAlpha) {
      this.alpha += this.fadeSpeed
      if (this.alpha > this.targetAlpha) this.alpha = this.targetAlpha
    }
    
    this.y += this.vy
    this.x += Math.sin(this.phase + time * 0.005) * 0.2
    
    this.life--
    if (this.life <= 0) {
      this.targetAlpha = 0
      this.alpha -= this.fadeSpeed
      if (this.alpha <= 0) {
        this.alive = false
      }
    }
  }

  draw(ctx) {
    if (!this.alive || this.alpha <= 0) return
    
    ctx.save()
    ctx.globalAlpha = this.alpha
    
    // 计算文字尺寸，气泡大小刚好覆盖文字
    ctx.font = '14px system-ui, sans-serif'
    const metrics = ctx.measureText(this.text)
    this.width = metrics.width + 16
    this.height = 28
    
    const r = parseInt(this.mainColor.slice(1,3), 16) || 155
    const g = parseInt(this.mainColor.slice(3,5), 16) || 89
    const b = parseInt(this.mainColor.slice(5,7), 16) || 182
    
    // 透明背景，融合主颜色
    const bgColor = `rgba(${r}, ${g}, ${b}, 0.2)`
    const borderColor = `rgba(${r + 40}, ${g + 40}, ${b + 40}, 0.3)`
    const textColor = `rgba(${r + 80}, ${g + 80}, ${b + 80}, 0.9)`
    
    const x = this.x - this.width / 2
    const y = this.y - this.height / 2
    const radius = 8
    
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + this.width - radius, y)
    ctx.quadraticCurveTo(x + this.width, y, x + this.width, y + radius)
    ctx.lineTo(x + this.width, y + this.height - radius)
    ctx.quadraticCurveTo(x + this.width, y + this.height, x + this.width - radius, y + this.height)
    ctx.lineTo(x + radius, y + this.height)
    ctx.quadraticCurveTo(x, y + this.height, x, y + this.height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
    
    ctx.fillStyle = bgColor
    ctx.fill()
    
    ctx.strokeStyle = borderColor
    ctx.lineWidth = 1
    ctx.stroke()
    
    ctx.shadowColor = 'rgba(0,0,0,0.05)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 2
    ctx.fill()
    ctx.shadowBlur = 0
    
    ctx.fillStyle = textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '14px system-ui, sans-serif'
    ctx.fillText(this.text, this.x, this.y)
    
    ctx.restore()
  }
  
  // 检测与普通气泡的碰撞（反弹）
  collidesWithBubble(bubble) {
    if (!this.alive || !bubble.alive) return false
    const dx = this.x - bubble.x
    const dy = this.y - bubble.y
    const dist = Math.sqrt(dx*dx + dy*dy)
    return dist < this.width / 2 + bubble.r
  }
}

// 添加文字气泡
const addTextBubble = (text, x, y) => {
  if (!text || text.trim() === '') return
  const bubble = new TextBubble(text.trim(), x, y, props.color)
  textBubbles.push(bubble)
}

// 用户输入文字并生成气泡
const emitTextBubble = () => {
  if (!userText.value || userText.value.trim() === '') return
  
  const x = props.width / 2 + (Math.random() - 0.5) * 60
  const y = props.height - 20
  addTextBubble(userText.value, x, y)
  userText.value = ''
}

// 初始化普通气泡
const initBubbles = () => {
  bubbles = []
  const count = bubbleCount.value
  for (let i = 0; i < count; i++) {
    const b = new Bubble()
    b.life = Math.floor(Math.random() * b.maxLife)
    b.y = props.height - Math.random() * props.height * 0.8
    bubbles.push(b)
  }
}

// 点击气泡消失
const pokeBubbles = (e) => {
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
  
  const clickX = (clientX - rect.left) * scaleX
  const clickY = (clientY - rect.top) * scaleY
  
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i]
    if (!b.alive) continue
    const dx = clickX - b.x
    const dy = clickY - b.y
    const dist = Math.sqrt(dx*dx + dy*dy)
    if (dist < b.r + 10) {
      b.alive = false
      break
    }
  }
  
  for (let i = textBubbles.length - 1; i >= 0; i--) {
    const tb = textBubbles[i]
    if (!tb.alive) continue
    const dx = clickX - tb.x
    const dy = clickY - tb.y
    const dist = Math.sqrt(dx*dx + dy*dy)
    if (dist < tb.width / 2 + 10) {
      tb.alive = false
      break
    }
  }
}

const render = () => {
  if (!ctx || !props.isActive) {
    animationId = requestAnimationFrame(render)
    return
  }

  time += 0.05
  
  ctx.clearRect(0, 0, props.width, props.height)
  
  // 更新和绘制普通气泡
  for (let i = 0; i < bubbles.length; i++) {
    const b = bubbles[i]
    if (!b.alive) continue
    b.update()
    b.draw(ctx, props.color)
    
    for (let j = i + 1; j < bubbles.length; j++) {
      const other = bubbles[j]
      if (!other.alive) continue
      if (b.collidesWith(other)) {
        b.alive = false
        other.alive = false
        break
      }
    }
  }
  
  // 普通气泡与文字气泡的碰撞（普通气泡消失，文字气泡反弹）
  for (let i = 0; i < bubbles.length; i++) {
    const b = bubbles[i]
    if (!b.alive) continue
    
    for (let j = 0; j < textBubbles.length; j++) {
      const tb = textBubbles[j]
      if (!tb.alive) continue
      if (tb.collidesWithBubble(b)) {
        // 普通气泡消失
        b.alive = false
        // 文字气泡反弹
        const angle = Math.atan2(b.y - tb.y, b.x - tb.x)
        tb.vx = Math.cos(angle) * 1.5
        tb.vy = -Math.sin(angle) * 1.5 - 0.5
        break
      }
    }
  }
  
  // 移除死亡的气泡并补充
  bubbles = bubbles.filter(b => b.alive)
  while (bubbles.length < bubbleCount.value) {
    const b = new Bubble()
    b.life = Math.floor(Math.random() * b.maxLife)
    b.y = props.height - Math.random() * props.height * 0.8
    bubbles.push(b)
  }
  
  // 更新和绘制文字气泡
  textBubbles.forEach(tb => {
    tb.update()
    tb.draw(ctx)
  })
  textBubbles = textBubbles.filter(tb => tb.alive)

  animationId = requestAnimationFrame(render)
}

// 监听容器大小变化
watch(() => props.width, () => {
  initBubbles()
})

watch(() => props.height, () => {
  initBubbles()
})

watch(() => props.followMode, () => {
  initBubbles()
})

onMounted(() => {
  canvasElement = canvasRef.value
  ctx = canvasElement.getContext('2d')
  initBubbles()
  render()
  
  canvasElement.addEventListener('click', pokeBubbles)
})

onBeforeUnmount(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  if (canvasElement) {
    canvasElement.removeEventListener('click', pokeBubbles)
    canvasElement = null
  }
})
</script>

<style scoped>
.bubble-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.text-input-wrapper {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  width: 80%;
  max-width: 300px;
}

.text-input-box {
  display: flex;
  gap: 8px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 6px 6px 6px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.text-input-box input {
  flex: 1;
  background: transparent;
  border: none;
  color: white;
  font-size: 14px;
  outline: none;
  padding: 6px 0;
}

.text-input-box input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.text-input-box button {
  border: none;
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.text-input-box button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}
</style>