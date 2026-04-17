<template>
  <div class="sprite-container">
    <!-- 显示的精灵图片（支持GIF/PNG/精灵图） -->
    <img 
      ref="spriteImageRef"
      :src="currentSpriteUrl" 
      :style="spriteStyle"
      class="sprite-image"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      @click="handleClick"
      draggable="false"
    />
    
    <!-- 情绪选择器 -->
    <div 
      v-if="showEmotionPicker" 
      class="emotion-picker"
      :style="{ left: pickerPosition.x + 'px', top: pickerPosition.y + 'px' }"
    >
      <div class="picker-header">
        <span>选择情绪</span>
        <el-button link @click="showCustomEmotion = true">
          <el-icon><Plus /></el-icon>
          自定义
        </el-button>
      </div>
      
      <div class="emotion-grid">
        <div 
          v-for="emotion in allEmotions" 
          :key="emotion.id"
          class="emotion-item"
          :style="{ background: emotion.color }"
          @click="selectEmotion(emotion)"
        >
          <span class="emoji">{{ emotion.emoji }}</span>
          <span class="label">{{ emotion.label }}</span>
        </div>
      </div>
    </div>
    
    <!-- 当前情绪显示 -->
    <div v-if="currentEmotion" class="current-emotion-badge" :style="{ background: currentEmotion.color }">
      <span>{{ currentEmotion.emoji }}</span>
    </div>
    
    <!-- 自定义情绪对话框 -->
    <el-dialog v-model="showCustomEmotion" title="创建情绪" width="85%">
      <el-form :model="customEmotion" label-width="80px">
        <el-form-item label="表情符号">
          <el-input v-model="customEmotion.emoji" placeholder="如: 😊" maxlength="2" />
          <div class="emoji-suggestions">
            <span 
              v-for="emo in emojiSuggestions" 
              :key="emo"
              @click="customEmotion.emoji = emo"
            >{{ emo }}</span>
          </div>
        </el-form-item>
        <el-form-item label="情绪名称">
          <el-input v-model="customEmotion.label" placeholder="如: 期待" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="customEmotion.color" show-alpha />
        </el-form-item>
        <el-form-item label="情绪值">
          <el-slider v-model="customEmotion.value" :min="1" :max="5" show-stops />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCustomEmotion = false">取消</el-button>
        <el-button type="primary" @click="saveCustomEmotion">创建</el-button>
      </template>
    </el-dialog>
    
    <!-- 更换精灵对话框 -->
    <el-dialog v-model="showSpriteSelector" title="选择精灵" width="90%">
      <div class="sprite-selector">
        <div class="selector-tabs">
          <el-radio-group v-model="spriteType" size="small">
            <el-radio-button value="preset">预设精灵</el-radio-button>
            <el-radio-button value="url">图片链接</el-radio-button>
            <el-radio-button value="upload">本地上传</el-radio-button>
          </el-radio-group>
        </div>
        
        <!-- 预设精灵 -->
        <div v-if="spriteType === 'preset'" class="preset-grid">
          <div 
            v-for="sprite in presetSprites" 
            :key="sprite.id"
            class="preset-item"
            :class="{ active: currentSpriteId === sprite.id }"
            @click="selectPresetSprite(sprite)"
          >
            <img :src="sprite.url" :alt="sprite.name" />
            <span>{{ sprite.name }}</span>
          </div>
        </div>
        
        <!-- 图片链接 -->
        <div v-if="spriteType === 'url'" class="url-input">
          <el-input 
            v-model="spriteUrlInput" 
            placeholder="输入图片/GIF链接"
            size="large"
          />
          <div class="preview" v-if="spriteUrlInput">
            <img :src="spriteUrlInput" @error="handleImageError" />
          </div>
          <el-button type="primary" @click="applyUrlSprite" :disabled="!spriteUrlInput">
            应用
          </el-button>
        </div>
        
        <!-- 本地上传 -->
        <div v-if="spriteType === 'upload'" class="upload-area">
          <el-upload
            class="upload"
            drag
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleFileChange"
            accept="image/*"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              拖拽或<em>点击上传</em>
            </div>
          </el-upload>
          <div class="preview" v-if="uploadedImage">
            <img :src="uploadedImage" />
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showSpriteSelector = false">关闭</el-button>
      </template>
    </el-dialog>
    
    <!-- 右下角设置按钮 -->
    <div class="sprite-settings" @click="showSpriteSelector = true">
      <el-icon><Setting /></el-icon>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Setting, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 精灵图片相关
const spriteImageRef = ref(null)
const spritePos = ref({ x: 200, y: 200 })
const spriteStyle = computed(() => ({
  left: spritePos.value.x + 'px',
  top: spritePos.value.y + 'px',
  transform: 'translate(-50%, -50%)'
}))

// 预设精灵（可以换成你自己喜欢的图片）
const presetSprites = ref([
  { 
    id: 'cat', 
    name: '小猫', 
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Lucy&backgroundColor=FFD93D'
  },
  { 
    id: 'dog', 
    name: '小狗', 
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Max&backgroundColor=6BCB77'
  },
  { 
    id: 'bear', 
    name: '小熊', 
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Bella&backgroundColor=FF9F9F'
  },
  { 
    id: 'fox', 
    name: '狐狸', 
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Charlie&backgroundColor=FF6B6B'
  },
  { 
    id: 'rabbit', 
    name: '兔子', 
    url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=Jasmine&backgroundColor=A78BFA'
  },
  { 
    id: 'panda', 
    name: '熊猫', 
    url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=Oscar&backgroundColor=9B9B9B'
  }
])

const currentSpriteId = ref('cat')
const currentSpriteUrl = ref(presetSprites.value[0].url)
const showSpriteSelector = ref(false)
const spriteType = ref('preset')
const spriteUrlInput = ref('')
const uploadedImage = ref('')

// 情绪相关
const showEmotionPicker = ref(false)
const pickerPosition = ref({ x: 0, y: 0 })
const showCustomEmotion = ref(false)
const currentEmotion = ref(null)

// 拖拽相关
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const containerRect = ref(null)

// 预设情绪
const presetEmotions = [
  { id: 1, label: '开心', emoji: '😊', color: '#FFD93D', value: 5 },
  { id: 2, label: '平静', emoji: '😌', color: '#6BCB77', value: 3 },
  { id: 3, label: '疲惫', emoji: '😫', color: '#9B9B9B', value: 2 },
  { id: 4, label: '焦虑', emoji: '😰', color: '#FF9F9F', value: 1 },
  { id: 5, label: '兴奋', emoji: '🤩', color: '#FF6B6B', value: 5 },
  { id: 6, label: '低落', emoji: '😔', color: '#A78BFA', value: 1 }
]

const customEmotions = ref([])
const allEmotions = computed(() => [...presetEmotions, ...customEmotions.value])

const emojiSuggestions = ['😊', '😄', '😍', '🥰', '😎', '🤔', '😴', '🥺', '😤', '😱', '🤗', '🫠', '🥳', '😇', '🤯']

const customEmotion = ref({
  emoji: '😊',
  label: '',
  color: '#667eea',
  value: 3
})

// 加载保存的数据
const loadSavedData = () => {
  // 加载自定义情绪
  const savedEmotions = localStorage.getItem('customEmotions')
  if (savedEmotions) {
    try {
      customEmotions.value = JSON.parse(savedEmotions)
    } catch (e) {}
  }
  
  // 加载保存的精灵
  const savedSprite = localStorage.getItem('currentSprite')
  if (savedSprite) {
    try {
      const sprite = JSON.parse(savedSprite)
      currentSpriteUrl.value = sprite.url
      currentSpriteId.value = sprite.id
    } catch (e) {}
  }
}

// 保存自定义情绪
const saveCustomEmotion = () => {
  if (!customEmotion.value.label.trim()) {
    ElMessage.warning('请输入情绪名称')
    return
  }
  
  const newEmotion = {
    id: Date.now(),
    ...customEmotion.value
  }
  
  customEmotions.value.push(newEmotion)
  localStorage.setItem('customEmotions', JSON.stringify(customEmotions.value))
  
  showCustomEmotion.value = false
  customEmotion.value = { emoji: '😊', label: '', color: '#667eea', value: 3 }
  ElMessage.success('新情绪已创建')
}

// 选择预设精灵
const selectPresetSprite = (sprite) => {
  currentSpriteId.value = sprite.id
  currentSpriteUrl.value = sprite.url
  localStorage.setItem('currentSprite', JSON.stringify(sprite))
  ElMessage.success(`已切换为${sprite.name}`)
}

// 应用链接精灵
const applyUrlSprite = () => {
  if (!spriteUrlInput.value.trim()) return
  
  currentSpriteUrl.value = spriteUrlInput.value
  currentSpriteId.value = 'custom'
  localStorage.setItem('currentSprite', JSON.stringify({ 
    id: 'custom', 
    url: spriteUrlInput.value 
  }))
  ElMessage.success('精灵已更换')
  spriteUrlInput.value = ''
}

// 处理图片错误
const handleImageError = () => {
  ElMessage.error('图片加载失败，请检查链接')
}

// 处理文件上传
const handleFileChange = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    uploadedImage.value = e.target.result
    currentSpriteUrl.value = e.target.result
    currentSpriteId.value = 'uploaded'
    localStorage.setItem('currentSprite', JSON.stringify({ 
      id: 'uploaded', 
      url: e.target.result 
    }))
    ElMessage.success('精灵已更换')
  }
  reader.readAsDataURL(file.raw)
}

// 选择情绪
const selectEmotion = (emotion) => {
  currentEmotion.value = emotion
  showEmotionPicker.value = false
  
  // 可以在这里添加动画效果
  if (spriteImageRef.value) {
    spriteImageRef.value.style.animation = 'bounce 0.5s ease'
    setTimeout(() => {
      spriteImageRef.value.style.animation = ''
    }, 500)
  }
  
  ElMessage.success(`✨ 记录成功：${emotion.emoji} ${emotion.label}`)
}

// 拖拽逻辑
const handleMouseDown = (e) => {
  const img = spriteImageRef.value
  const rect = img.getBoundingClientRect()
  const parentRect = img.parentElement.getBoundingClientRect()
  
  containerRect.value = parentRect
  
  const mouseX = e.clientX - parentRect.left
  const mouseY = e.clientY - parentRect.top
  
  isDragging.value = true
  dragOffset.value = {
    x: mouseX - spritePos.value.x,
    y: mouseY - spritePos.value.y
  }
  
  e.preventDefault()
}

const handleMouseMove = (e) => {
  if (!isDragging.value || !containerRect.value) return
  
  const mouseX = e.clientX - containerRect.value.left
  const mouseY = e.clientY - containerRect.value.top
  
  const imgWidth = spriteImageRef.value?.offsetWidth || 100
  const imgHeight = spriteImageRef.value?.offsetHeight || 100
  
  spritePos.value = {
    x: Math.max(imgWidth / 2, Math.min(containerRect.value.width - imgWidth / 2, mouseX - dragOffset.value.x)),
    y: Math.max(imgHeight / 2, Math.min(containerRect.value.height - imgHeight / 2, mouseY - dragOffset.value.y))
  }
}

const handleMouseUp = () => {
  isDragging.value = false
}

const handleClick = (e) => {
  if (isDragging.value) {
    isDragging.value = false
    return
  }
  
  const rect = spriteImageRef.value.getBoundingClientRect()
  const parentRect = spriteImageRef.value.parentElement.getBoundingClientRect()
  
  const clickX = e.clientX - parentRect.left
  const clickY = e.clientY - parentRect.top
  
  showEmotionPicker.value = !showEmotionPicker.value
  if (showEmotionPicker.value) {
    pickerPosition.value = {
      x: Math.max(10, Math.min(parentRect.width - 280, clickX - 120)),
      y: Math.max(10, clickY - 200)
    }
  }
}

onMounted(() => {
  loadSavedData()
  
  // 初始化位置
  setTimeout(() => {
    const container = spriteImageRef.value?.parentElement
    if (container) {
      const rect = container.getBoundingClientRect()
      spritePos.value = {
        x: rect.width / 2,
        y: rect.height / 2
      }
    }
  }, 100)
})
</script>

<style scoped lang="scss">
.sprite-container {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  
  .sprite-image {
    position: absolute;
    width: 120px;
    height: 120px;
    object-fit: contain;
    cursor: grab;
    filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
    transition: filter 0.3s;
    
    &:active {
      cursor: grabbing;
    }
    
    &:hover {
      filter: drop-shadow(0 0 30px rgba(255, 255, 255, 0.5));
    }
  }
  
  .current-emotion-badge {
    position: absolute;
    bottom: 20px;
    left: 20px;
    width: 50px;
    height: 50px;
    border-radius: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  }
  
  .sprite-settings {
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 45px;
    height: 45px;
    border-radius: 25px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: white;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      background: rgba(255, 255, 255, 0.4);
      transform: scale(1.1);
    }
  }
  
  .emotion-picker {
    position: absolute;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    z-index: 100;
    min-width: 280px;
    padding: 16px;
    
    .picker-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #eee;
      
      span {
        font-weight: 600;
        color: #333;
      }
    }
    
    .emotion-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      max-height: 300px;
      overflow-y: auto;
      
      .emotion-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 10px;
        border-radius: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
        
        &:hover {
          transform: scale(1.05);
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
        }
        
        .emoji {
          font-size: 28px;
          margin-bottom: 4px;
        }
        
        .label {
          font-size: 12px;
          color: white;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
      }
    }
  }
}

// 精灵选择器样式
.sprite-selector {
  .selector-tabs {
    margin-bottom: 20px;
    text-align: center;
  }
  
  .preset-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    
    .preset-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 15px;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.3s;
      border: 2px solid transparent;
      
      &.active {
        border-color: #667eea;
        background: rgba(102, 126, 234, 0.1);
      }
      
      img {
        width: 80px;
        height: 80px;
        object-fit: contain;
      }
      
      span {
        margin-top: 8px;
        font-size: 14px;
      }
    }
  }
  
  .url-input {
    .preview {
      margin: 20px 0;
      text-align: center;
      
      img {
        max-width: 150px;
        max-height: 150px;
        object-fit: contain;
      }
    }
  }
  
  .upload-area {
    .preview {
      margin-top: 20px;
      text-align: center;
      
      img {
        max-width: 150px;
        max-height: 150px;
        object-fit: contain;
      }
    }
  }
}

.emoji-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  
  span {
    font-size: 24px;
    padding: 6px 10px;
    background: #f5f7fa;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background: #e0e3e9;
      transform: scale(1.1);
    }
  }
}

@keyframes bounce {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.2); }
}
</style>