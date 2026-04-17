<template>
  <div class="treehole-card" @click="emit('click')">
    <div class="card-header">
      <div class="user-info">
        <span class="anonymous-id">{{ post.anonymousId }}</span>
        <span class="time">{{ post.time }}</span>
      </div>
      <div class="emotion-tag" :style="{ background: emotionColor }">
        {{ post.emotion }}
      </div>
    </div>
    
    <p class="content">{{ post.content }}</p>
    
    <div class="card-footer">
      <div class="action" @click.stop="handleLike">
        <span class="icon">{{ post.liked ? '❤️' : '🤍' }}</span>
        <span class="count">{{ post.likes }}</span>
      </div>
      <div class="action" @click.stop="emit('comment')">
        <span class="icon">💬</span>
        <span class="count">{{ post.comments }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  post: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click', 'like', 'comment'])

const emotionColor = computed(() => {
  const colors = {
    '😊': '#FFD93D',
    '😌': '#6BCB77',
    '😫': '#9B9B9B',
    '😰': '#FF9F9F',
    '🤩': '#FF6B6B',
    '😔': '#A78BFA'
  }
  return colors[props.post.emotion] || '#999'
})

const handleLike = () => {
  emit('like', props.post.id)
}
</script>

<style scoped lang="scss">
.treehole-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .anonymous-id {
        color: rgba(255, 255, 255, 0.9);
        font-weight: 500;
      }
      
      .time {
        color: rgba(255, 255, 255, 0.5);
        font-size: 12px;
      }
    }
    
    .emotion-tag {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 14px;
      color: white;
      font-weight: 500;
    }
  }
  
  .content {
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.6;
    margin: 0 0 16px 0;
    font-size: 15px;
  }
  
  .card-footer {
    display: flex;
    gap: 24px;
    
    .action {
      display: flex;
      align-items: center;
      gap: 6px;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        color: white;
        transform: scale(1.05);
      }
      
      .icon {
        font-size: 20px;
      }
      
      .count {
        font-size: 14px;
      }
    }
  }
}
</style>