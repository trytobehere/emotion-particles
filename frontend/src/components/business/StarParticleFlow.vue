<template>
  <div class="star-particle-container">
    <!-- Three.js 容器 -->
    <div ref="canvasContainerRef" id="canvas-container"></div>
    
    <!-- 摄像头小窗 -->
    <div id="webcam-container">
      <video id="webcam" autoplay playsinline></video>
    </div>
    
    <!-- 状态提示 -->
    <div id="ui-overlay">
    <div class="status" id="gesture-status">
      星空交互实验室加载中...
    </div>
    <div class="instructions">
      <div class="instruction-item">✊✊ 双手握合: 超级宇宙星球</div>
      <div class="instruction-item">✌️ V字手势: 璀璨火箭</div>
      <div class="instruction-item">☝️ 食指: 粒子画笔</div>
      <div class="instruction-item">✋ 手指开合: 调整星空漫游</div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as THREE from 'three'

const router = useRouter()

const emit = defineEmits(['openTreehole'])

const props = defineProps({
  particles: {
    type: Array,
    default: () => []
  },
  emotionStats: {
    type: Object,
    default: () => ({})
  },
  treeholes: {
    type: Array,
    default: () => []
  }
})

const canvasContainerRef = ref(null)

// ==================== 核心常量 ====================
const PARTICLE_COUNT = 16000
const STATIC_BACKGROUND_COUNT = 6000

// ==================== Three.js 全局变量 ====================
let scene, camera, renderer
let particleGeometry, particleSystem
let particles = []
let currentMode = 'STARFIELD'
let currentSpread = 1.0
let targetPlanetPos = new THREE.Vector3(0, 50, 0)
let currentPlanetPos = new THREE.Vector3(0, 50, 0)

// 形状数据
let starPositions = []
let num1Positions = []
let rocketPositions = []
let num3Positions = []
let planetPositions = []

// 树洞粒子系统
let treeholeSprites = []
let treeholeSpriteSystem = null

// 画笔轨迹 - 使用 TubeGeometry 实现粗线条
let trailTube = null
let trailPoints = []
const MAX_TRAIL_POINTS = 100
let trailTubeMaterial = null
let trailTubeGeometry = null

let animationId = null
let hands = null
let cameraUtils = null

// 树洞ID映射（用于点击）
let treeholeIdMap = new Map()

// 鼠标交互
let raycaster = null
let mouse = null
let mouseWorldPos = new THREE.Vector3()

// 暂停计时器
let pauseTimers = []

// 手势防抖动
let gestureFrameCount = 0
let lastGesture = 'NONE'
const GESTURE_THRESHOLD = 5

// ==================== 情绪颜色映射 ====================
const emotionColorMap = {
  '开心': { r: 1.0, g: 0.9, b: 0.0 },
  '平静': { r: 0.0, g: 0.6, b: 1.0 },
  '愤怒': { r: 1.0, g: 0.0, b: 0.0 },
  '悲伤': { r: 0.7, g: 0.2, b: 1.0 },
  '焦虑': { r: 1.0, g: 0.2, b: 0.6 },
  '疲惫': { r: 0.3, g: 0.3, b: 0.3 }
}

// ==================== 根据情绪统计分配颜色 ====================
function assignColorsByStats(particleCount, stats) {
  const colors = new Float32Array(particleCount * 3)
  let index = 0
  
  if (Object.keys(stats).length === 0) {
    for (let i = 0; i < particleCount; i++) {
      colors[i * 3] = 0.5 + Math.random() * 0.5
      colors[i * 3 + 1] = 0.7 + Math.random() * 0.3
      colors[i * 3 + 2] = 0.9 + Math.random() * 0.1
    }
    return colors
  }
  
  let mainEmotion = '平静'
  let maxPercentage = 0
  for (const [emotion, percentage] of Object.entries(stats)) {
    if (percentage > maxPercentage) {
      maxPercentage = percentage
      mainEmotion = emotion
    }
  }
  
  const mainColor = emotionColorMap[mainEmotion] || { r: 0.4, g: 0.7, b: 1.0 }
  
  for (let i = 0; i < particleCount; i++) {
    if (i < particleCount * 0.6) {
      colors[index * 3] = Math.max(0, Math.min(1, mainColor.r * 1.2 + (Math.random() - 0.5) * 0.05))
      colors[index * 3 + 1] = Math.max(0, Math.min(1, mainColor.g * 1.2 + (Math.random() - 0.5) * 0.05))
      colors[index * 3 + 2] = Math.max(0, Math.min(1, mainColor.b * 1.2 + (Math.random() - 0.5) * 0.05))
    } else {
      const emotions = Object.keys(stats)
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)]
      const color = emotionColorMap[randomEmotion] || { r: 0.5, g: 0.5, b: 0.5 }
      colors[index * 3] = Math.max(0, Math.min(1, color.r * 1.2 + (Math.random() - 0.5) * 0.08))
      colors[index * 3 + 1] = Math.max(0, Math.min(1, color.g * 1.2 + (Math.random() - 0.5) * 0.08))
      colors[index * 3 + 2] = Math.max(0, Math.min(1, color.b * 1.2 + (Math.random() - 0.5) * 0.08))
    }
    index++
  }
  
  return colors
}

// ==================== 生成形状数据（OK手势星球缩小版） ====================
function generateMathematicalShapes() {
  const INTERACTIVE_COUNT = PARTICLE_COUNT - STATIC_BACKGROUND_COUNT

  starPositions = []
  num1Positions = []
  rocketPositions = []
  num3Positions = []
  planetPositions = []

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const radius = 220 + Math.random() * 350
    const u = Math.random()
    const v = Math.random()
    const theta = u * Math.PI * 2
    const phi = Math.acos(2 * v - 1)

    const sX = radius * Math.sin(phi) * Math.cos(theta)
    const sY = radius * Math.sin(phi) * Math.sin(theta) + 50
    const sZ = radius * Math.cos(phi)

    starPositions.push({ x: sX, y: sY, z: sZ })

    if (i < STATIC_BACKGROUND_COUNT) {
      num1Positions.push({ x: sX, y: sY, z: sZ })
      rocketPositions.push({ x: sX, y: sY, z: sZ })
      num3Positions.push({ x: sX, y: sY, z: sZ })
      planetPositions.push({ x: sX, y: sY, z: sZ })
    } else {
      const idx = i - STATIC_BACKGROUND_COUNT
      
      const PLANET_CORE_RATIO = 0.35
      const NEBULA_RATIO = 0.25
      const RING_RATIO = 0.20
      const OUTER_STAR_RATIO = 0.20

      // ===== 1. 巨型主星球（缩小） =====
      if (idx < INTERACTIVE_COUNT * PLANET_CORE_RATIO) {
        const p = idx / (INTERACTIVE_COUNT * PLANET_CORE_RATIO)
        const pPhi = Math.acos(-1 + 2 * p)
        const pTheta = Math.sqrt(INTERACTIVE_COUNT * PLANET_CORE_RATIO * Math.PI) * pPhi
        const pRadius = 240 + (Math.random() - 0.5) * 35 
        planetPositions.push({
          x: pRadius * Math.cos(pTheta) * Math.sin(pPhi),
          y: pRadius * Math.sin(pTheta) * Math.sin(pPhi) + 50,
          z: pRadius * Math.cos(pPhi)
        })
      }
      // ===== 2. 外围蓝紫星云（缩小） =====
      else if (idx < INTERACTIVE_COUNT * (PLANET_CORE_RATIO + NEBULA_RATIO)) {
        const angle = Math.random() * Math.PI * 2
        const radius = 320 + Math.random() * 90  
        planetPositions.push({
          x: Math.cos(angle) * radius + (Math.random() - 0.5) * 60,
          y: (Math.random() - 0.5) * 90 + 50,
          z: Math.sin(angle) * radius + (Math.random() - 0.5) * 60
        })
      }
      // ===== 3. 多层金色行星环（缩小） =====
      else if (idx < INTERACTIVE_COUNT * (PLANET_CORE_RATIO + NEBULA_RATIO + RING_RATIO)) {
        const ringLayer = Math.floor(Math.random() * 4)
        let baseRadius
        if (ringLayer === 0) baseRadius = 520
        else if (ringLayer === 1) baseRadius = 325
        else if (ringLayer === 2) baseRadius = 410
        else baseRadius = 490
        const ringAngle = Math.random() * Math.PI * 2
        const ringRadius = baseRadius + (Math.random() - 0.5) * 40
        planetPositions.push({
          x: Math.cos(ringAngle) * ringRadius,
          y: (Math.random() - 0.5) * 20 + 50,
          z: Math.sin(ringAngle) * ringRadius
        })
      }
      // ===== 4. 全屏宇宙背景粒子 =====
      else {
        const radius = 1200 + Math.random() * 2200
        const theta = Math.random() * Math.PI * 2
        const phi = Math.random() * Math.PI
        planetPositions.push({
          x: radius * Math.sin(phi) * Math.cos(theta),
          y: radius * Math.sin(phi) * Math.sin(theta) + 50,
          z: radius * Math.cos(phi)
        })
      }

      const seg1 = Math.floor(INTERACTIVE_COUNT * 0.8)
      if (idx < seg1) {
        num1Positions.push({
          x: (Math.random() - 0.5) * 15,
          y: -120 + (idx / seg1) * 300 + 50,
          z: (Math.random() - 0.5) * 35
        })
      } else {
        const t = (idx - seg1) / (INTERACTIVE_COUNT - seg1)
        num1Positions.push({
          x: -50 * (1 - t) + (Math.random() - 0.5) * 12,
          y: 180 - t * 35 + 50,
          z: (Math.random() - 0.5) * 35
        })
      }

      if (idx < INTERACTIVE_COUNT * 0.4) {
        const t = idx / (INTERACTIVE_COUNT * 0.4)
        const hY = -80 + t * 180 + 50
        const rAng = Math.random() * Math.PI * 2
        const rRad = 55 + (Math.random() - 0.5) * 12
        rocketPositions.push({
          x: Math.cos(rAng) * rRad,
          y: hY,
          z: Math.sin(rAng) * rRad
        })
      } else if (idx < INTERACTIVE_COUNT * 0.65) {
        const t = (idx - INTERACTIVE_COUNT * 0.4) / (INTERACTIVE_COUNT * 0.25)
        const hY = 100 + t * 70 + 50
        const rRad = 55 * (1.0 - t) + (Math.random() - 0.5) * 10
        const rAng = Math.random() * Math.PI * 2
        rocketPositions.push({
          x: Math.cos(rAng) * rRad,
          y: hY,
          z: Math.sin(rAng) * rRad
        })
      } else if (idx < INTERACTIVE_COUNT * 0.85) {
        const t = (idx - INTERACTIVE_COUNT * 0.65) / (INTERACTIVE_COUNT * 0.2)
        const side = (idx % 2 === 0) ? 1 : -1
        rocketPositions.push({
          x: side * (55 + t * 60) + (Math.random() - 0.5) * 12,
          y: -80 + t * 60 + 50 + (Math.random() - 0.5) * 12,
          z: (Math.random() - 0.5) * 25
        })
      } else {
        const t = (idx - INTERACTIVE_COUNT * 0.85) / (INTERACTIVE_COUNT * 0.15)
        const spreadRadius = t * 75
        const rAng = Math.random() * Math.PI * 2
        rocketPositions.push({
          x: Math.cos(rAng) * spreadRadius + (Math.random() - 0.5) * 15,
          y: -85 - t * 110 + 50,
          z: Math.sin(rAng) * spreadRadius + (Math.random() - 0.5) * 15
        })
      }

      if (idx < INTERACTIVE_COUNT * 0.5) {
        const ang = Math.PI * 0.5 - (idx / (INTERACTIVE_COUNT * 0.5)) * Math.PI * 1.35
        num3Positions.push({
          x: Math.cos(ang) * 75 + (Math.random() - 0.5) * 14,
          y: 65 + Math.sin(ang) * 75 + 50,
          z: (Math.random() - 0.5) * 35
        })
      } else {
        const ang = Math.PI * 0.5 + ((idx - INTERACTIVE_COUNT * 0.5) / (INTERACTIVE_COUNT * 0.5)) * Math.PI * 1.35
        num3Positions.push({
          x: Math.cos(ang) * 80 + (Math.random() - 0.5) * 14,
          y: -65 + Math.sin(ang) * 80 + 50,
          z: (Math.random() - 0.5) * 35
        })
      }
    }
  }
}

// ==================== 创建树洞粒子（缩小版） ====================
function createTreeholeSprites(treeholes) {
  if (!scene) {
    console.warn('场景未初始化，暂不创建树洞粒子')
    return
  }
  
  if (treeholeSpriteSystem) {
    scene.remove(treeholeSpriteSystem)
    treeholeSpriteSystem = null
  }
  
  if (!treeholes || treeholes.length === 0) return
  
  const spriteGroup = new THREE.Group()
  treeholeSprites = []
  treeholeIdMap.clear()
  pauseTimers = []
  
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  
  treeholes.forEach((treehole, index) => {
    const emotion = treehole.tagName || '平静'
    const color = emotionColorMap[emotion] || { r: 0.5, g: 0.5, b: 0.5 }
    
    const r = Math.round(color.r * 255)
    const g = Math.round(color.g * 255)
    const b = Math.round(color.b * 255)
    
    const rgbaColor = `rgba(${r}, ${g}, ${b}, 1)`
    
    ctx.clearRect(0, 0, 128, 128)
    
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    gradient.addColorStop(0, '#FFFFFF')
    gradient.addColorStop(0.3, rgbaColor)
    gradient.addColorStop(1, 'transparent')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(64, 64, 64, 0, Math.PI * 2)
    ctx.fill()
    
    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9 + Math.random() * 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false
    })
    
    const sprite = new THREE.Sprite(material)
    
    const x = (Math.random() - 0.5) * 1000
    const y = (Math.random() - 0.5) * 600 + 50
    const z = (Math.random() - 0.5) * 300
    
    sprite.position.set(x, y, z)
    sprite.scale.set(30 + Math.random() * 15, 30 + Math.random() * 15, 1)  // ✅ 缩小
    
    sprite.userData = {
      treeholeId: treehole.id,
      emotion: emotion,
      baseOpacity: 0.9 + Math.random() * 0.1,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 2.0,
        (Math.random() - 0.5) * 2.0,
        (Math.random() - 0.5) * 1.0
      ),
      isPaused: false,
      pauseTimer: 0
    }
    
    spriteGroup.add(sprite)
    treeholeSprites.push(sprite)
    treeholeIdMap.set(sprite.uuid, treehole.id)
    pauseTimers.push(0)
  })
  
  treeholeSpriteSystem = spriteGroup
  scene.add(treeholeSpriteSystem)
}

// ==================== 更新树洞粒子 ====================
function updateTreeholeSprites(time) {
  if (!treeholeSpriteSystem) return
  
  if (mouse) {
    const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5)
    vector.unproject(camera)
    const dir = vector.sub(camera.position).normalize()
    const distance = -camera.position.z / dir.z
    mouseWorldPos = camera.position.clone().add(dir.multiplyScalar(distance))
  }
  
  treeholeSpriteSystem.children.forEach((sprite, index) => {
    const data = sprite.userData
    
    if (mouse) {
      const dx = sprite.position.x - mouseWorldPos.x
      const dy = sprite.position.y - mouseWorldPos.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      if (dist < 200) {
        data.isPaused = true
        data.pauseTimer = 2.0
      }
    }
    
    if (data.isPaused) {
      data.pauseTimer -= 0.016
      if (data.pauseTimer <= 0) {
        data.isPaused = false
      }
      return
    }
    
    if (Math.random() < 0.01) {
      data.velocity.set(
        (Math.random() - 0.5) * 2.0,
        (Math.random() - 0.5) * 2.0,
        (Math.random() - 0.5) * 1.0
      )
    }
    
    sprite.position.x += data.velocity.x
    sprite.position.y += data.velocity.y
    sprite.position.z += data.velocity.z
    
    const limitX = 500
    const limitY = 350
    const limitZ = 250
    
    if (sprite.position.x > limitX || sprite.position.x < -limitX) {
      data.velocity.x *= -1
      sprite.position.x = Math.max(-limitX, Math.min(limitX, sprite.position.x))
    }
    if (sprite.position.y > limitY || sprite.position.y < -limitY) {
      data.velocity.y *= -1
      sprite.position.y = Math.max(-limitY, Math.min(limitY, sprite.position.y))
    }
    if (sprite.position.z > limitZ || sprite.position.z < -limitZ) {
      data.velocity.z *= -1
      sprite.position.z = Math.max(-limitZ, Math.min(limitZ, sprite.position.z))
    }
  })
}

// ==================== 画笔轨迹系统（使用 TubeGeometry 实现粗线条） ====================
function createTrailTube() {
  // 移除旧的轨迹
  if (trailTube) {
    scene.remove(trailTube)
    trailTube = null
  }
  if (trailTubeGeometry) {
    trailTubeGeometry.dispose()
    trailTubeGeometry = null
  }
  if (trailTubeMaterial) {
    trailTubeMaterial.dispose()
    trailTubeMaterial = null
  }
  
  if (trailPoints.length < 3) return
  
  // 创建曲线路径
  const curve = new THREE.CatmullRomCurve3(
    trailPoints.map(p => new THREE.Vector3(p.x, p.y, p.z))
  )
  
  // 创建管状几何体（实现粗线条）
  const tubeGeometry = new THREE.TubeGeometry(curve, trailPoints.length * 2, 4, 8, false)
  
  // 创建材质 - 使用渐变颜色
  const colors = []
  const positions = tubeGeometry.attributes.position.array
  
  for (let i = 0; i < positions.length; i += 3) {
    const y = positions[i + 1]
    const t = (y + 400) / 800
    const color = new THREE.Color(0.4, 0.8, 1.0)
    colors.push(color.r * (1 - t * 0.7))
    colors.push(color.g * (1 - t * 0.7))
    colors.push(color.b * (1 - t * 0.7))
  }
  
  tubeGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  
  trailTubeMaterial = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  
  trailTube = new THREE.Mesh(tubeGeometry, trailTubeMaterial)
  scene.add(trailTube)
}

function drawTrailPoint(x, y) {
  trailPoints.push({ x, y, z: 0 })
  
  if (trailPoints.length > MAX_TRAIL_POINTS) {
    trailPoints.shift()
  }
  
  createTrailTube()
}

function clearTrail() {
  trailPoints = []
  if (trailTube) {
    scene.remove(trailTube)
    trailTube = null
  }
  if (trailTubeGeometry) {
    trailTubeGeometry.dispose()
    trailTubeGeometry = null
  }
  if (trailTubeMaterial) {
    trailTubeMaterial.dispose()
    trailTubeMaterial = null
  }
}

// ==================== 初始化 Three.js ====================
function initThree() {
  const container = canvasContainerRef.value
  if (!container) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x051030)
  scene.fog = new THREE.FogExp2(0x051030, 0.0008)

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2500)
  camera.position.z = 400  // 视角 400
  camera.position.y = 50

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.appendChild(renderer.domElement)

  generateMathematicalShapes()

  particleGeometry = new THREE.BufferGeometry()

  const positions = new Float32Array(PARTICLE_COUNT * 3)
  const colors = new Float32Array(PARTICLE_COUNT * 3)
  const seeds = new Float32Array(PARTICLE_COUNT)

  const INTERACTIVE_COUNT = PARTICLE_COUNT - STATIC_BACKGROUND_COUNT

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3] = starPositions[i].x
    positions[i * 3 + 1] = starPositions[i].y
    positions[i * 3 + 2] = starPositions[i].z
    seeds[i] = Math.random()
    particles.push({ speed: 0.04 + Math.random() * 0.05 })
  }

  const colorData = assignColorsByStats(PARTICLE_COUNT, props.emotionStats)
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    colors[i * 3] = colorData[i * 3]
    colors[i * 3 + 1] = colorData[i * 3 + 1]
    colors[i * 3 + 2] = colorData[i * 3 + 2]
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  particleGeometry.setAttribute('randomSeed', new THREE.BufferAttribute(seeds, 1))

  const vertexShader = `
    attribute vec3 color;
    attribute float randomSeed;

    varying vec3 vColor;
    varying float vSeed;

    uniform float uTime;

    void main() {
        vColor = color;
        vSeed = randomSeed;

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

        gl_PointSize = (11.0 + sin(uTime * 5.0 + randomSeed * 15.0) * 3.0) * (300.0 / -mvPosition.z);

        gl_Position = projectionMatrix * mvPosition;
    }
  `

  const fragmentShader = `
    varying vec3 vColor;
    varying float vSeed;

    uniform float uTime;

    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);

        float dist = length(uv);

        if (dist > 0.5) discard;

        float noise = hash(gl_PointCoord + vec2(vSeed + fract(uTime * 0.1)));

        vec3 finalColor = mix(vColor, vec3(1.0), noise * 0.15);

        float alpha = smoothstep(0.5, 0.15, dist) * 0.95;

        gl_FragColor = vec4(finalColor, alpha);
    }
  `

  const material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
      uTime: { value: 0 }
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })

  particleSystem = new THREE.Points(particleGeometry, material)
  scene.add(particleSystem)

  createTreeholeSprites(props.treeholes)

  initInteraction()

  window.addEventListener('resize', onWindowResize)

  animate()
}

// ==================== 鼠标交互 ====================
function initInteraction() {
  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()
  
  const container = canvasContainerRef.value
  container.addEventListener('mousemove', onMouseMove)
  container.addEventListener('click', onClick)
}

function onMouseMove(event) {
  const rect = canvasContainerRef.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
}

function onClick(event) {
  if (!treeholeSpriteSystem || !raycaster || !mouse) return
  
  const rect = canvasContainerRef.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  
  raycaster.setFromCamera(mouse, camera)
  
  const intersects = raycaster.intersectObjects(treeholeSpriteSystem.children)
  
  if (intersects.length > 0) {
    const sprite = intersects[0].object
    const treeholeId = treeholeIdMap.get(sprite.uuid)
    if (treeholeId) {
      emit('openTreehole', treeholeId)
    }
  }
}

// ==================== 窗口自适应 ====================
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

// ==================== 动画循环 ====================
function animate() {
  requestAnimationFrame(animate)

  const positions = particleGeometry.attributes.position.array
  const time = performance.now() * 0.001

  particleSystem.material.uniforms.uTime.value = time

  if (currentMode === 'PLANET') {
    currentPlanetPos.lerp(targetPlanetPos, 0.1)
    particleSystem.rotation.y += 0.01
    particleSystem.rotation.x = 0.28
  } else if (currentMode === 'ROCKET') {
    currentPlanetPos.set(0, 50, 0)
    particleSystem.rotation.y += 0.015
    particleSystem.rotation.x = 0.1
  } else {
    currentPlanetPos.set(0, 50, 0)
    particleSystem.rotation.y += 0.0015
    particleSystem.rotation.x += 0.0003
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    let target
    if (currentMode === 'NUM1') target = num1Positions[i]
    else if (currentMode === 'ROCKET') target = rocketPositions[i]
    else if (currentMode === 'NUM3') target = num3Positions[i]
    else if (currentMode === 'PLANET') target = planetPositions[i]
    else target = starPositions[i]

    let tx = target.x * currentSpread
    let ty = target.y * currentSpread
    let tz = target.z * currentSpread

    if (currentMode === 'PLANET' && i >= STATIC_BACKGROUND_COUNT) {
      tx += currentPlanetPos.x
      ty += (currentPlanetPos.y - 50)
    }

    positions[i * 3] += (tx - positions[i * 3]) * particles[i].speed
    positions[i * 3 + 1] += (ty - positions[i * 3 + 1]) * particles[i].speed
    positions[i * 3 + 2] += (tz - positions[i * 3 + 2]) * particles[i].speed
  }

  particleGeometry.attributes.position.needsUpdate = true

  updateTreeholeSprites(time)

  // 轨迹渐变消失（非画笔模式时）
  if (currentMode !== 'DRAW' && trailTube) {
    trailTubeMaterial.opacity -= 0.003
    if (trailTubeMaterial.opacity <= 0) {
      clearTrail()
    }
  }

  renderer.render(scene, camera)
}

// ==================== 手势识别（双手握合版） ====================
function isVGesture(landmarks) {
  const indexTip = landmarks[8]
  const indexPip = landmarks[6]
  const middleTip = landmarks[12]
  const middlePip = landmarks[10]
  const ringTip = landmarks[16]
  const pinkyTip = landmarks[20]
  
  const indexUp = indexTip.y < indexPip.y
  const middleUp = middleTip.y < middlePip.y
  const ringDown = ringTip.y > landmarks[14].y
  const pinkyDown = pinkyTip.y > landmarks[18].y
  
  const indexVec = new THREE.Vector2(indexTip.x - indexPip.x, indexTip.y - indexPip.y)
  const middleVec = new THREE.Vector2(middleTip.x - middlePip.x, middleTip.y - middlePip.y)
  const angle = indexVec.angleTo(middleVec)
  
  return indexUp && middleUp && ringDown && pinkyDown && angle > 0.3 && angle < 1.5
}

function isHandOpen(landmarks) {
  const indexTip = landmarks[8]
  const indexPip = landmarks[6]
  const middleTip = landmarks[12]
  const middlePip = landmarks[10]
  const ringTip = landmarks[16]
  const pinkyTip = landmarks[20]
  
  const indexUp = indexTip.y < indexPip.y
  const middleUp = middleTip.y < middlePip.y
  const ringUp = ringTip.y < landmarks[14].y
  const pinkyUp = pinkyTip.y < landmarks[18].y
  
  const indexVec = new THREE.Vector2(indexTip.x - indexPip.x, indexTip.y - indexPip.y)
  const middleVec = new THREE.Vector2(middleTip.x - middlePip.x, middleTip.y - middlePip.y)
  const angle = indexVec.angleTo(middleVec)
  
  return indexUp && middleUp && ringUp && pinkyUp && angle > 0.8
}

// ✅ 检测双手握合
function isDoubleFist(landmarks1, landmarks2) {
  const isFist = (lm) => {
    const indexUp = lm[8].y < lm[6].y
    const middleUp = lm[12].y < lm[10].y
    const ringUp = lm[16].y < lm[14].y
    const pinkyUp = lm[20].y < lm[18].y
    return !indexUp && !middleUp && !ringUp && !pinkyUp
  }
  
  return landmarks1 && landmarks2 && isFist(landmarks1) && isFist(landmarks2)
}

function initHandGesture() {
  const videoElement = document.getElementById('webcam')
  const statusElement = document.getElementById('gesture-status')
  
  if (typeof window.Hands === 'undefined') {
    console.warn('MediaPipe Hands 加载失败，降级为无手势模式')
    statusElement.innerText = "手势识别未加载，仅显示星空"
    return
  }
  
  try {
    hands = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    })

    hands.setOptions({
      maxNumHands: 2,  // ✅ 改为支持双手
      modelComplexity: 1,
      minDetectionConfidence: 0.75,
      minTrackingConfidence: 0.75
    })

    hands.onResults(function onHandResults(results) {
      let currentGesture = 'NONE'
      let displayMsg = ""

      if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        currentGesture = 'NONE'
        displayMsg = "纯净浅蓝星空运行中..."
      } else {
        // ✅ 检测双手握合
        const isDoubleFistDetected = results.multiHandLandmarks.length === 2 &&
                                    isDoubleFist(results.multiHandLandmarks[0], results.multiHandLandmarks[1])
        
        const landmarks = results.multiHandLandmarks[0]
        const wrist = landmarks[0]
        const middleTip = landmarks[12]

        const handSize = Math.sqrt(
          Math.pow(middleTip.x - wrist.x, 2) +
          Math.pow(middleTip.y - wrist.y, 2)
        )

        const isIndexUp = landmarks[8].y < landmarks[6].y
        const isMiddleUp = landmarks[12].y < landmarks[10].y
        const isRingUp = landmarks[16].y < landmarks[14].y
        const isPinkyUp = landmarks[20].y < landmarks[18].y

        // ✅ 检测顺序：双手握合 → 手掌张开 → V字 → 食指画笔 → 其他
        if (isDoubleFistDetected) {
          currentGesture = 'DOUBLE_FIST'
          displayMsg = "检测到双手握合：超级宇宙星球启动！"
        } else if (isHandOpen(landmarks)) {
          currentGesture = 'SPREAD'
          displayMsg = "手掌张开：调整星空漫游系数"
        } else if (isVGesture(landmarks)) {
          currentGesture = 'V'
          displayMsg = "检测到 V 字手势：凝聚璀璨立体火箭！"
        } else if (isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
          currentGesture = 'DRAW'
          displayMsg = "检测到食指：粒子画笔模式启动！"
        } else {
          currentGesture = 'SPREAD'
          displayMsg = "手指开合调整星空漫游系数"
        }
      }

      // 防抖动逻辑
      if (currentGesture === lastGesture) {
        gestureFrameCount++
      } else {
        gestureFrameCount = 0
        lastGesture = currentGesture
      }

      // 执行手势切换
      if (gestureFrameCount >= GESTURE_THRESHOLD) {
        if (currentGesture === 'DOUBLE_FIST') {
          if (currentMode === 'DRAW') {
            clearTrail()
          }
          currentMode = 'PLANET'
          // ✅ 使用双手位置的平均值控制星球移动
          if (results.multiHandLandmarks && results.multiHandLandmarks.length === 2) {
            const leftPalm = results.multiHandLandmarks[0][9]
            const rightPalm = results.multiHandLandmarks[1][9]
            const avgX = (leftPalm.x + rightPalm.x) / 2
            const avgY = (leftPalm.y + rightPalm.y) / 2
            targetPlanetPos.x = (0.5 - avgX) * 400
            targetPlanetPos.y = (0.5 - avgY) * 300 + 50
          }
        } else if (currentGesture === 'DRAW') {
          currentMode = 'DRAW'
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0]
            const indexTip = landmarks[8]
            const fingerX = (0.5 - indexTip.x) * 1200
            const fingerY = (0.5 - indexTip.y) * 800 + 50
            drawTrailPoint(fingerX, fingerY)
          }
        } else if (currentGesture === 'V') {
          if (currentMode === 'DRAW') {
            clearTrail()
          }
          currentMode = 'ROCKET'
        } else if (currentGesture === 'SPREAD') {
          if (currentMode === 'DRAW') {
            clearTrail()
          }
          currentMode = 'STARFIELD'
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0]
            const thumbToPinky = Math.sqrt(
              Math.pow(landmarks[4].x - landmarks[20].x, 2) +
              Math.pow(landmarks[4].y - landmarks[20].y, 2)
            )
            const spreadFactor = THREE.MathUtils.mapLinear(thumbToPinky, 0.1, 0.4, 0.3, 2.5)
            currentSpread += (THREE.MathUtils.clamp(spreadFactor, 0.3, 2.5) - currentSpread) * 0.15
          }
        } else {
          // NONE
          if (currentMode === 'DRAW') {
            clearTrail()
          }
          currentMode = 'STARFIELD'
          currentSpread += (1.0 - currentSpread) * 0.1
        }
      }

      // ✅ 画笔模式下强制背景粒子稀疏
      if (currentMode === 'DRAW') {
        currentSpread = 2.5
      } else if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        // 其他模式：正常手指控制
        const landmarks = results.multiHandLandmarks[0]
        const wrist = landmarks[0]
        const middleTip = landmarks[12]
        const handSize = Math.sqrt(
          Math.pow(middleTip.x - wrist.x, 2) +
          Math.pow(middleTip.y - wrist.y, 2)
        )
        let targetSpread = THREE.MathUtils.mapLinear(handSize, 0.23, 0.52, 0.3, 2.5)
        currentSpread += (
          THREE.MathUtils.clamp(targetSpread, 0.3, 2.5) - currentSpread
        ) * 0.15
      }

      statusElement.innerText = displayMsg
    })

    cameraUtils = new window.Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement })
      },
      width: 640,
      height: 480
    })

    cameraUtils.start().catch(() => {
      // 摄像头启动失败，静默处理
    })
  } catch (error) {
    console.error('手势识别初始化失败:', error)
    statusElement.innerText = "手势识别初始化失败"
  }
}

// ==================== 监听数据变化 ====================
watch(() => props.emotionStats, (newStats) => {
  if (particleGeometry && Object.keys(newStats).length > 0) {
    const colors = assignColorsByStats(PARTICLE_COUNT, newStats)
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  }
}, { deep: true })

watch(() => props.treeholes, (newTreeholes) => {
  createTreeholeSprites(newTreeholes)
}, { deep: true })

// ==================== 生命周期 ====================
onMounted(async () => {
  try {
    const handsScript = document.createElement('script')
    handsScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'
    document.head.appendChild(handsScript)
    
    const cameraScript = document.createElement('script')
    cameraScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js'
    document.head.appendChild(cameraScript)
    
    await Promise.all([
      new Promise((resolve) => { handsScript.onload = resolve }),
      new Promise((resolve) => { cameraScript.onload = resolve })
    ])
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    initThree()
    initHandGesture()
  } catch (error) {
    console.error('初始化失败:', error)
    initThree()
  }
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (renderer) {
    renderer.dispose()
    renderer.domElement.remove()
  }
  if (cameraUtils) {
    cameraUtils.stop()
  }
  if (hands) {
    hands.close()
  }
  if (trailTube) {
    scene.remove(trailTube)
    trailTube = null
  }
  if (trailTubeGeometry) {
    trailTubeGeometry.dispose()
    trailTubeGeometry = null
  }
  if (trailTubeMaterial) {
    trailTubeMaterial.dispose()
    trailTubeMaterial = null
  }
  window.removeEventListener('resize', onWindowResize)
})
</script>

<style scoped>
.star-particle-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

#canvas-container {
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: 1;
}

#webcam-container {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 180px;
  height: 135px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(0, 243, 255, 0.4);
  z-index: 10;
  transform: scaleX(-1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7);
}

#webcam-container video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

#ui-overlay {
  position: absolute;
  bottom: 40px;
  left: 40px;  /* 从 center 改为 left */
  transform: none;  /* 去掉水平居中 */
  color: #fff;
  text-align: left;  /* 左对齐 */
  z-index: 10;
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

#ui-overlay .status {
  font-size: 18px;
  letter-spacing: 1px;
  font-weight: 500;
  color: #00f3ff;
  text-shadow: 0 0 10px rgba(0, 243, 255, 0.6);
  margin-bottom: 12px;
}

#ui-overlay .instructions {
  font-size: 13px;
  opacity: 0.8;
  color: #ffffff;
  letter-spacing: 0.5px;
  line-height: 1.6;
}

#ui-overlay .instruction-item {
  margin-bottom: 2px;
}
</style>