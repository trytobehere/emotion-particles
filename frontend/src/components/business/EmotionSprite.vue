<template>
  <div class="emotion-sprite-container">
    <StarBackground :color="currentColor" :isActive="true" />
    
    <!-- 容器 - 可拖动位置 -->
    <div 
      class="center-wrapper" 
      :style="{
        left: containerPos.x + '%',
        top: containerPos.y + '%',
        width: containerSize + 'px',
        height: containerSize + 'px'
      }"
      @mousedown="startDrag"
      @touchstart="startDrag"
      v-if="!isFullScreen"
    >
      <SpiritContainer 
        :size="containerSize" 
        :color="currentColor"
        :currentEmotion="currentEmotion"
        :shape="currentSpirit === 'piano' ? 'rectangle' : 'circle'"
      >
        <component 
          :is="currentSpiritComponent"
          :key="containerSize"
          :width="containerSize"
          :height="containerSize"
          :color="currentColor"
          :emotionId="currentEmotion?.emotionTagId || 2"
          :isActive="true"
          :followMode="followMode"
        />
      </SpiritContainer>
    </div>
    
    <!-- 全屏模式 -->
    <div 
      v-else
      class="fullscreen-wrapper"
    >
      <SpiritContainer 
        :size="containerSize" 
        :color="currentColor"
        :currentEmotion="currentEmotion"
        shape="fullscreen"
      >
        <component 
          :is="currentSpiritComponent"
          :key="'fullscreen'"
          :width="screenWidth"
          :height="screenHeight"
          :color="currentColor"
          :emotionId="currentEmotion?.emotionTagId || 2"
          :isActive="true"
          :followMode="followMode"
        />
      </SpiritContainer>
    </div>
    
    <!-- 控制面板 - 右下角浮动 -->
    <div class="floating-controls">
      <!-- 切换按钮 -->
      <button class="toggle-btn" @click="togglePanel">
        <span v-if="panelOpen">✕</span>
        <span v-else>⚙</span>
      </button>
      
      <!-- 控制面板内容 -->
      <div class="control-panel" v-show="panelOpen">
        <div class="panel-content">
          <div class="spirit-selector">
            <div 
              v-for="spirit in spiritList" 
              :key="spirit.id"
              class="spirit-item"
              :class="{ active: currentSpirit === spirit.id }"
              @click="selectSpirit(spirit.id)"
            >
              <span class="icon">{{ spirit.icon }}</span>
              <span class="name">{{ spirit.name }}</span>
              <span class="emotion">{{ spirit.emotion }}</span>
            </div>
          </div>
          
          <div class="controls-row">
            <div class="size-control">
              <label>大小</label>
              <el-slider 
                v-model="containerSize" 
                :min="100" 
                :max="sliderMax" 
                :step="10"
                style="width: 100px"
              />
            </div>
            
            <div class="color-control">
              <label>颜色</label>
              <el-color-picker v-model="currentColor" size="small" />
            </div>
            
            <div class="follow-control">
              <label>跟随</label>
              <el-radio-group v-model="followMode" size="small">
                <el-radio-button value="container">容器</el-radio-button>
                <el-radio-button value="full">全屏</el-radio-button>
              </el-radio-group>
            </div>
            
            <el-button size="small" @click="toggleFullScreen">
              {{ isFullScreen ? '退出全屏' : '全屏' }}
            </el-button>
            
            <el-button size="small" @click="resetToDefault">重置</el-button>
          </div>
          
          <div class="emotion-custom" v-if="currentEmotion">
            <label>修改情绪：</label>
            <el-select v-model="customEmotionId" placeholder="选择情绪" size="small" @change="updateEmotion">
              <el-option
                v-for="tag in emotionTags"
                :key="tag.id"
                :label="tag.emoji + ' ' + tag.name"
                :value="tag.id"
              />
            </el-select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import StarBackground from '../spirits/StarBackground.vue'
import SpiritContainer from '../spirits/SpiritContainer.vue'
import FireSpirit from '../spirits/FireSpirit.vue'
import WaterSpirit from '../spirits/WaterSpirit.vue'
import BubbleSpirit from '../spirits/BubbleSpirit.vue'
import PianoSpirit from '../spirits/PianoSpirit.vue'
import PlaneSpirit from '../spirits/PlaneSpirit.vue'
import SparkleSpirit from '../spirits/SparkleSpirit.vue'
import { useSpiritStore } from '@/stores/spiritStore'
import request from '@/utils/request'

const spiritStore = useSpiritStore()

// 精灵配置
const spiritList = [
  { id: 'fire', name: '火焰', emotion: '愤怒', icon: '🔥', color: '#FF6B35', emotionTagId: 9 },
  { id: 'water', name: '水滴', emotion: '平静', icon: '💧', color: '#4A9EFF', emotionTagId: 2 },
  { id: 'piano', name: '钢琴', emotion: '激情', icon: '🎹', color: '#FFD700', emotionTagId: 10 },
  { id: 'bubble', name: '气泡', emotion: '悲伤', icon: '🫧', color: '#9B59B6', emotionTagId: 6 },
  { id: 'plane', name: '纸飞机', emotion: '懊恼', icon: '✈️', color: '#5D8A9C', emotionTagId: 11 },
  { id: 'sparkle', name: '烟花', emotion: '开心', icon: '🎆', color: '#FF6B6B', emotionTagId: 1 }
]

const currentSpirit = ref('water')
const currentColor = ref('#4A9EFF')
const followMode = ref('container')
const customEmotionId = ref(null)
const customEmotionName = ref('') // ✅ 新增：存储情绪名称

// 容器状态
const containerSize = ref(280)
const containerPos = ref({ x: 50, y: 50 })

// 屏幕尺寸
const screenWidth = ref(window.innerWidth)
const screenHeight = ref(window.innerHeight)

// 滑块最大值
const sliderMax = computed(() => {
  return Math.min(screenWidth.value, screenHeight.value)
})

// 最大尺寸 - 允许全屏
const maxSize = computed(() => {
  return Math.min(screenWidth.value, screenHeight.value) * 1.0
})

// 是否全屏
const isFullScreen = computed(() => {
  return containerSize.value >= Math.min(screenWidth.value, screenHeight.value) * 0.95
})

// 情绪标签列表（从后端获取）
const emotionTags = ref([])

// 面板开关状态
const panelOpen = ref(true)

// 拖拽状态
const isDragging = ref(false)
let dragStartX = 0
let dragStartY = 0
let dragStartPos = { x: 50, y: 50 }

// 当前精灵组件
const currentSpiritComponent = computed(() => {
  const map = {
    fire: FireSpirit,
    water: WaterSpirit,
    bubble: BubbleSpirit,
    piano: PianoSpirit,
    plane: PlaneSpirit,
    sparkle: SparkleSpirit
  }
  return map[currentSpirit.value] || WaterSpirit
})

// 当前情绪信息 - 优先使用存储的情绪名称
const currentEmotion = computed(() => {
  const config = spiritList.find(s => s.id === currentSpirit.value)
  if (!config) return null
  
  // ✅ 优先使用存储的情绪名称
  if (customEmotionName.value) {
    return {
      ...config,
      emotion: customEmotionName.value,
      emotionTagId: customEmotionId.value || config.emotionTagId
    }
  }
  
  return config
})

// 切换面板
const togglePanel = () => {
  panelOpen.value = !panelOpen.value
}

// 获取情绪标签列表
const fetchEmotionTags = async () => {
  try {
    const res = await request.get('/emotion-tags')
    if (res.code === 200) {
      emotionTags.value = res.data.filter(tag => 
        isNaN(parseInt(tag.name)) && tag.isActive === 1
      )
    }
  } catch (error) {
    console.error('获取情绪标签失败:', error)
  }
}

// 选择精灵 - 保留每个精灵的自定义情绪
const selectSpirit = async (id) => {
  currentSpirit.value = id
  const config = spiritList.find(s => s.id === id)
  if (config) {
    // ✅ 不要重置颜色，而是从 localStorage 恢复
    const savedColor = localStorage.getItem(`spiritColor_${id}`)
    if (savedColor) {
      currentColor.value = savedColor
    } else {
      currentColor.value = config.color
    }
    
    // 恢复自定义情绪
    const savedEmotion = localStorage.getItem(`customEmotion_${id}`)
    if (savedEmotion) {
      customEmotionId.value = parseInt(savedEmotion)
      customEmotionName.value = localStorage.getItem(`customEmotionName_${id}`) || ''
      config.emotionTagId = customEmotionId.value
      config.emotion = customEmotionName.value || config.emotion
    } else {
      customEmotionId.value = config.emotionTagId
      customEmotionName.value = config.emotion
    }
  }
  saveToLocal()
  await saveToBackend()
  await loadFromBackend()
}

// 更新情绪 - 为当前精灵保存自定义情绪
const updateEmotion = async (newTagId) => {
  console.log('updateEmotion 被调用，newTagId:', newTagId)
  console.log('当前颜色:', currentColor.value)
  
  if (!newTagId) return
  
  const config = spiritList.find(s => s.id === currentSpirit.value)
  if (config) {
    config.emotionTagId = newTagId
    const tag = emotionTags.value.find(t => t.id === newTagId)
    if (tag) {
      config.emotion = tag.name
      customEmotionName.value = tag.name
    }
    customEmotionId.value = newTagId
    
    // ✅ 保存当前颜色（不是默认颜色）
    const currentColorToSave = currentColor.value
    localStorage.setItem(`spiritColor_${currentSpirit.value}`, currentColorToSave)
    
    // 保存情绪
    localStorage.setItem(`customEmotion_${currentSpirit.value}`, newTagId.toString())
    localStorage.setItem(`customEmotionName_${currentSpirit.value}`, customEmotionName.value)
    
    await saveToBackend()
    await loadFromBackend()
  }
}

// 重置颜色
const resetToDefault = () => {
  const config = spiritList.find(s => s.id === currentSpirit.value)
  if (config) {
    currentColor.value = config.color
  }
}

// 全屏切换
const toggleFullScreen = () => {
  if (isFullScreen.value) {
    // 退出全屏
    containerSize.value = Math.min(screenWidth.value, screenHeight.value) * 0.8
  } else {
    // 进入全屏
    containerSize.value = Math.min(screenWidth.value, screenHeight.value)
  }
}

// 拖拽逻辑
const startDrag = (e) => {
  isDragging.value = true
  const rect = e.currentTarget.getBoundingClientRect()
  dragStartX = e.clientX || e.touches[0].clientX
  dragStartY = e.clientY || e.touches[0].clientY
  dragStartPos = { ...containerPos.value }
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', endDrag)
  document.addEventListener('touchmove', onDrag, { passive: false })
  document.addEventListener('touchend', endDrag)
}

const onDrag = (e) => {
  if (!isDragging.value) return
  e.preventDefault()
  
  const clientX = e.clientX || e.touches[0].clientX
  const clientY = e.clientY || e.touches[0].clientY
  
  const deltaX = (clientX - dragStartX) / window.innerWidth * 100
  const deltaY = (clientY - dragStartY) / window.innerHeight * 100
  
  // ✅ 添加这一行：计算容器一半尺寸的百分比
  const halfSize = (containerSize.value / 2) / Math.min(screenWidth.value, screenHeight.value) * 100
  
  containerPos.value = {
    x: Math.max(0, Math.min(100, dragStartPos.x + deltaX)),
    y: Math.max(halfSize, Math.min(100 - halfSize, dragStartPos.y + deltaY))
  }
}

const endDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', endDrag)
  saveToLocal()
}

// 本地存储
const saveToLocal = () => {
  localStorage.setItem('spiritContainerSize', containerSize.value.toString())
  localStorage.setItem('spiritContainerPos', JSON.stringify(containerPos.value))
  localStorage.setItem('spiritCurrent', currentSpirit.value)
  localStorage.setItem('spiritColor', currentColor.value)
  localStorage.setItem('spiritFollowMode', followMode.value)
}

const loadFromLocal = () => {
  const size = localStorage.getItem('spiritContainerSize')
  const pos = localStorage.getItem('spiritContainerPos')
  const spirit = localStorage.getItem('spiritCurrent')
  const color = localStorage.getItem('spiritColor')
  const mode = localStorage.getItem('spiritFollowMode')
  
  if (size) containerSize.value = parseInt(size)
  if (pos) containerPos.value = JSON.parse(pos)
  if (spirit) currentSpirit.value = spirit
  if (color) currentColor.value = color
  if (mode) followMode.value = mode
}

// 后端存储
const saveToBackend = async () => {
  try {
    const config = spiritList.find(s => s.id === currentSpirit.value)
    await spiritStore.updateSpiritState({
      spiritType: currentSpirit.value,
      spiritColor: currentColor.value,
      followMode: followMode.value,
      currentTagId: config?.emotionTagId || 2
    })
  } catch (error) {
    console.error('保存精灵状态失败:', error)
  }
}

const loadFromBackend = async () => {
  try {
    const state = await spiritStore.getSpiritState()
    if (state) {
      currentSpirit.value = state.spiritType || 'water'
      // ✅ 优先使用后端保存的颜色
      if (state.spiritColor) {
        currentColor.value = state.spiritColor
      } else {
        // 如果后端没有颜色，从 localStorage 恢复
        const savedColor = localStorage.getItem(`spiritColor_${currentSpirit.value}`)
        if (savedColor) {
          currentColor.value = savedColor
        }
      }
      followMode.value = state.followMode || 'container'
      
      if (state.currentTagId) {
        customEmotionId.value = state.currentTagId
        customEmotionName.value = localStorage.getItem(`customEmotionName_${currentSpirit.value}`) || ''
        
        const config = spiritList.find(s => s.id === currentSpirit.value)
        if (config) {
          config.emotionTagId = state.currentTagId
          if (customEmotionName.value) {
            config.emotion = customEmotionName.value
          }
        }
        
        localStorage.setItem(`customEmotion_${currentSpirit.value}`, state.currentTagId.toString())
        if (customEmotionName.value) {
          localStorage.setItem(`customEmotionName_${currentSpirit.value}`, customEmotionName.value)
        }
      }
    }
  } catch (error) {
    console.error('加载精灵状态失败:', error)
  }
}

// 监听变化自动保存
watch(containerSize, saveToLocal)
watch(containerPos, saveToLocal, { deep: true })
watch(currentSpirit, () => { saveToLocal(); saveToBackend() })
watch(currentColor, () => { saveToLocal(); saveToBackend() })
watch(followMode, () => { saveToLocal(); saveToBackend() })

// 窗口大小变化处理
const handleResize = () => {
  screenWidth.value = window.innerWidth
  screenHeight.value = window.innerHeight
}

let refreshTimer = null

// 监听颜色变化，独立保存
watch(currentColor, (newColor, oldColor) => {
  if (newColor !== oldColor && currentSpirit.value) {
    localStorage.setItem(`spiritColor_${currentSpirit.value}`, newColor)
    saveToBackend()
  }
})

onMounted(() => {
  loadFromLocal()
  fetchEmotionTags()
  
  // ✅ 先加载情绪标签，再加载后端状态
  watch(emotionTags, async (newVal) => {
    if (newVal.length > 0) {
      await loadFromBackend()
    }
  }, { once: true })
  
  window.addEventListener('resize', handleResize)
  
  refreshTimer = setInterval(() => {
    loadFromBackend()
  }, 30000)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style scoped>
.emotion-sprite-container {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: #0b1117;
}

.center-wrapper {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 1;
  cursor: grab;
  touch-action: none;
}

.center-wrapper:active {
  cursor: grabbing;
}

.fullscreen-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1;
}

/* 右下角浮动控制面板 */
.floating-controls {
  position: fixed;
  right: 20px;
  bottom: 80px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

/* 切换按钮 */
.toggle-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  color: white;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.05);
}

/* 控制面板内容 */
.control-panel {
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  max-width: 500px;
  min-width: 280px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.spirit-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.spirit-item {
  padding: 6px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 48px;
}

.spirit-item.active {
  border-color: v-bind(currentColor);
  background: rgba(255, 255, 255, 0.1);
}

.spirit-item .icon { font-size: 18px; }
.spirit-item .name { font-size: 10px; color: rgba(255, 255, 255, 0.7); }
.spirit-item .emotion { font-size: 8px; color: rgba(255, 255, 255, 0.4); }

.controls-row {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.size-control, .color-control, .follow-control {
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.emotion-custom {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  width: 100%;           /* 让父容器占满可用宽度 */
  flex-wrap: wrap;       /* 小屏幕时自动换行 */
}

/* 下拉框占满剩余空间 */
.emotion-custom .el-select {
  flex: 1;
  min-width: 120px;      /* 最小宽度 */
}

@media (max-width: 600px) {
  .control-panel {
    max-width: 90vw;
    min-width: auto;
    padding: 12px;
  }
}
</style>