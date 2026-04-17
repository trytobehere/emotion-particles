<template>
  <div class="diary-editor">
    <!-- 情绪选择 -->
    <div class="emotion-section">
      <div class="section-title">今日情绪</div>
      <div class="emotion-list">
        <div 
          v-for="emotion in emotions" 
          :key="emotion.id"
          class="emotion-item"
          :class="{ active: form.emotion?.id === emotion.id }"
          :style="{ background: emotion.color }"
          @click="form.emotion = emotion"
        >
          <span class="emoji">{{ emotion.emoji }}</span>
          <span class="label">{{ emotion.label }}</span>
        </div>
      </div>
    </div>
    
    <!-- 标题 -->
    <el-input 
      v-model="form.title"
      placeholder="标题（可选）"
      size="large"
      class="title-input"
    />
    
    <!-- 内容 -->
    <el-input 
      v-model="form.content"
      type="textarea"
      placeholder="记录今天的心情..."
      :rows="8"
      resize="none"
      class="content-input"
    />
    
    <!-- 天气选择 -->
    <div class="weather-section">
      <div class="section-title">天气</div>
      <div class="weather-list">
        <div 
          v-for="w in weathers" 
          :key="w"
          class="weather-item"
          :class="{ active: form.weather === w }"
          @click="form.weather = w"
        >
          {{ w }}
        </div>
      </div>
    </div>
    
    <!-- 标签选择 -->
    <div class="tag-section">
      <div class="section-title">标签</div>
      <div class="tag-list">
        <span 
          v-for="tag in diaryStore.commonTags" 
          :key="tag"
          class="tag"
          :class="{ active: form.tags?.includes(tag) }"
          @click="toggleTag(tag)"
        >
          {{ tag }}
        </span>
      </div>
      
      <!-- 自定义标签 -->
      <div class="custom-tag">
        <el-input 
          v-model="customTag"
          placeholder="自定义标签"
          size="small"
          @keyup.enter="addCustomTag"
        >
          <template #append>
            <el-button @click="addCustomTag">
              <el-icon><Plus /></el-icon>
            </el-button>
          </template>
        </el-input>
      </div>
    </div>
    
    <!-- 图片上传（简化版） -->
    <div class="image-section">
      <div class="section-title">图片</div>
      <div class="image-list">
        <div 
          v-for="(img, index) in form.images" 
          :key="index"
          class="image-item"
        >
          <span>{{ img }}</span>
          <el-icon @click="removeImage(index)"><Close /></el-icon>
        </div>
        <el-button @click="addMockImage" round>
          <el-icon><Picture /></el-icon>
          添加图片
        </el-button>
      </div>
    </div>
    
    <!-- 底部按钮 -->
    <div class="editor-footer">
      <el-button @click="emit('cancel')">取消</el-button>
      <el-button type="primary" @click="handleSave" :disabled="!form.emotion || !form.content">
        保存
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus, Close, Picture } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useDiaryStore } from '@/stores/diaryStore'

const props = defineProps({
  diary: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['save', 'cancel'])

const diaryStore = useDiaryStore()

// 预设情绪
const emotions = [
  { id: 1, label: '开心', emoji: '😊', color: '#FFD93D', value: 5 },
  { id: 2, label: '平静', emoji: '😌', color: '#6BCB77', value: 3 },
  { id: 3, label: '疲惫', emoji: '😫', color: '#9B9B9B', value: 2 },
  { id: 4, label: '焦虑', emoji: '😰', color: '#FF9F9F', value: 1 },
  { id: 5, label: '兴奋', emoji: '🤩', color: '#FF6B6B', value: 5 },
  { id: 6, label: '低落', emoji: '😔', color: '#A78BFA', value: 1 }
]

// 天气选项
const weathers = ['☀️ 晴', '☁️ 多云', '🌧️ 雨', '⛈️ 暴雨', '❄️ 雪', '🌫️ 雾']

// 表单数据
const form = reactive({
  title: '',
  content: '',
  emotion: null,
  weather: '☀️ 晴',
  tags: [],
  images: []
})

// 自定义标签
const customTag = ref('')

// 初始化编辑数据
if (props.diary) {
  Object.assign(form, props.diary)
}

// 切换标签
const toggleTag = (tag) => {
  const index = form.tags.indexOf(tag)
  if (index > -1) {
    form.tags.splice(index, 1)
  } else {
    form.tags.push(tag)
  }
}

// 添加自定义标签
const addCustomTag = () => {
  const tag = customTag.value.trim()
  if (!tag) return
  
  if (!form.tags.includes(tag)) {
    form.tags.push(tag)
  }
  
  if (!diaryStore.commonTags.includes(tag)) {
    diaryStore.commonTags.push(tag)
  }
  
  customTag.value = ''
}

// 添加模拟图片
const addMockImage = () => {
  ElMessage.info('演示模式：图片上传功能开发中')
  form.images.push('📷 示例图片')
}

// 移除图片
const removeImage = (index) => {
  form.images.splice(index, 1)
}

// 保存
const handleSave = () => {
  if (!form.emotion) {
    ElMessage.warning('请选择今日情绪')
    return
  }
  
  if (!form.content.trim()) {
    ElMessage.warning('请输入日记内容')
    return
  }
  
  emit('save', { ...form })
}
</script>

<style scoped lang="scss">
.diary-editor {
  padding: 20px;
  padding-bottom: 100px;
  
  .section-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    color: #333;
  }
  
  .emotion-section {
    margin-bottom: 24px;
    
    .emotion-list {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      
      .emotion-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px 16px;
        border-radius: 16px;
        cursor: pointer;
        opacity: 0.6;
        transition: all 0.3s;
        
        &.active {
          opacity: 1;
          transform: scale(1.05);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
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
  
  .title-input {
    margin-bottom: 16px;
  }
  
  .content-input {
    margin-bottom: 24px;
    
    :deep(textarea) {
      line-height: 1.6;
    }
  }
  
  .weather-section {
    margin-bottom: 24px;
    
    .weather-list {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      
      .weather-item {
        padding: 8px 16px;
        background: #f0f2f5;
        border-radius: 20px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s;
        
        &.active {
          background: #667eea;
          color: white;
        }
      }
    }
  }
  
  .tag-section {
    margin-bottom: 24px;
    
    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 16px;
      
      .tag {
        padding: 8px 16px;
        background: #f0f2f5;
        border-radius: 20px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.3s;
        
        &.active {
          background: #667eea;
          color: white;
        }
      }
    }
  }
  
  .image-section {
    margin-bottom: 24px;
    
    .image-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      
      .image-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #f0f2f5;
        border-radius: 8px;
        font-size: 13px;
        
        .el-icon {
          cursor: pointer;
          color: #999;
          
          &:hover {
            color: #f56c6c;
          }
        }
      }
    }
  }
  
  .editor-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    gap: 12px;
    padding: 16px 20px;
    background: white;
    border-top: 1px solid #eee;
    
    .el-button {
      flex: 1;
      height: 48px;
    }
  }
}
</style>