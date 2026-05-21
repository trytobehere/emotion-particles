<template>
  <div class="diary-detail">
    <!-- 情绪头部 -->
    <div class="emotion-header" :style="{ background: diary.emotion.color }">
      <span class="emoji">{{ diary.emotion.emoji }}</span>
      <span class="label">{{ diary.emotion.label }}</span>
    </div>
    
    <!-- 标题 -->
    <h2 class="title">{{ diary.title || '无标题' }}</h2>
    
    <!-- 元信息 -->
    <div class="meta">
      <span>{{ diary.createdAt }}</span>
      <span>{{ diary.weather }}</span>
    </div>
    
    <!-- 内容 -->
    <div class="content">{{ diary.content }}</div>
    
    <!-- AI 摘要 -->
    <div class="ai-summary">
      <div class="ai-label">🤖 AI 摘要</div>
      <div v-if="aiSummaryLoading" class="loading">
        <el-icon class="is-loading"><Loading /></el-icon> AI 正在生成摘要...
      </div>
      <p v-else-if="aiSummary">{{ aiSummary }}</p>
      <p v-else class="empty">暂无摘要</p>
    </div>
    
    <!-- AI 建议 -->
    <div class="ai-suggestion">
      <div class="ai-label">💡 AI 建议</div>
      <div v-if="aiSuggestionLoading" class="loading">
        <el-icon class="is-loading"><Loading /></el-icon> AI 正在生成建议...
      </div>
      <p v-else-if="aiSuggestion">{{ aiSuggestion }}</p>
      <p v-else class="empty">暂无建议</p>
    </div>
    
    <!-- 标签 -->
    <div class="tags" v-if="diary.tags?.length">
      <span v-for="tag in diary.tags" :key="tag" class="tag">{{ tag }}</span>
    </div>
    
    <!-- 图片 -->
    <div class="images" v-if="diary.images?.length">
      <div v-for="(img, index) in diary.images" :key="index" class="image-placeholder">
        {{ img }}
      </div>
    </div>
    
    <!-- 底部按钮 -->
    <div class="detail-footer">
      <el-button @click="emit('close')">关闭</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useDiaryStore } from '@/stores/diaryStore'
import { Loading } from '@element-plus/icons-vue'

const props = defineProps({
  diary: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])
const diaryStore = useDiaryStore()
const aiSummary = ref('')
const aiSuggestion = ref('')
const aiSummaryLoading = ref(false)
const aiSuggestionLoading = ref(false)

const loadAI = async () => {
  if (props.diary.content) {
    // 加载摘要
    aiSummaryLoading.value = true
    aiSummary.value = await diaryStore.generateSummary(props.diary.content)
    aiSummaryLoading.value = false
    
    // 加载建议
    aiSuggestionLoading.value = true
    const emotionLabel = props.diary.emotion?.label || '中性'
    aiSuggestion.value = await diaryStore.generateSuggestion(props.diary.content, emotionLabel)
    aiSuggestionLoading.value = false
  }
}

onMounted(() => {
  loadAI()
})

watch(() => props.diary, () => {
  loadAI()
}, { deep: true })
</script>

<style scoped lang="scss">
.diary-detail {
  padding: 20px;
  padding-bottom: 100px;
  
  .emotion-header {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border-radius: 30px;
    margin-bottom: 20px;
    
    .emoji {
      font-size: 32px;
    }
    
    .label {
      font-size: 18px;
      color: white;
      font-weight: 600;
    }
  }
  
  .title {
    font-size: 24px;
    margin: 0 0 12px 0;
  }
  
  .meta {
    display: flex;
    gap: 20px;
    color: #999;
    font-size: 14px;
    margin-bottom: 24px;
  }
  
  .content {
    font-size: 16px;
    line-height: 1.8;
    color: #333;
    margin-bottom: 24px;
    white-space: pre-wrap;
  }
  
  .ai-summary {
    background: linear-gradient(135deg, #667eea15, #764ba215);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 24px;
    border-left: 4px solid #667eea;
    
    .ai-label {
      font-size: 14px;
      font-weight: 600;
      color: #667eea;
      margin-bottom: 8px;
    }
    
    .loading {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #999;
      font-size: 14px;
    }
    
    .empty {
      color: #999;
      font-size: 14px;
    }
    
    p {
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
      color: #555;
    }
  }
  
  .ai-suggestion {
    background: linear-gradient(135deg, #764ba215, #667eea15);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 24px;
    border-left: 4px solid #764ba2;
    
    .ai-label {
      font-size: 14px;
      font-weight: 600;
      color: #764ba2;
      margin-bottom: 8px;
    }
    
    .loading {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #999;
      font-size: 14px;
    }
    
    .empty {
      color: #999;
      font-size: 14px;
    }
    
    p {
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
      color: #555;
    }
  }
  
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 24px;
    
    .tag {
      padding: 6px 16px;
      background: #f0f2f5;
      border-radius: 16px;
      font-size: 13px;
      color: #666;
    }
  }
  
  .images {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 24px;
    
    .image-placeholder {
      width: 100px;
      height: 100px;
      background: #f0f2f5;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 24px;
    }
  }
  
  .detail-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px 20px;
    background: white;
    border-top: 1px solid #eee;
    
    .el-button {
      width: 100%;
      height: 48px;
    }
  }
}
</style>