<template>
  <div class="diary-chat-wrapper">
    <!-- 缩小的提示语（点击展开） -->
    <div v-if="!isChatActive" class="chat-trigger" @click="isChatActive = true">
      <span class="chat-icon">💬</span>
      <span class="chat-text">你想和我聊聊吗？</span>
    </div>

    <!-- 展开后的聊天窗口 -->
    <div v-else class="chat-window" @click.stop>
      <div class="chat-header">
        <span>✨ 星语小助手</span>
        <span class="chat-close" @click="isChatActive = false">✕</span>
      </div>
      <div class="chat-messages" ref="messagesContainer">
        <div v-for="(msg, index) in messages" :key="index" class="chat-message" :class="msg.role">
          <div class="bubble">{{ msg.content }}</div>
        </div>
        <div v-if="isLoading" class="chat-message assistant">
          <div class="bubble loading">...</div>
        </div>
      </div>
      <div class="chat-input">
        <input 
          v-model="input" 
          type="text"
          class="chat-input-field"
          placeholder="说点什么..."
          @keyup.enter="sendMessage"
          @focus="isChatActive = true"
          @blur="handleBlur"
        />
        <button class="chat-send-btn" @click="sendMessage" :disabled="!input.trim() || isLoading">
          <span>发送</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, watch } from 'vue'
import request from '@/utils/request'
import { useUserStore } from '@/stores/userStore'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()
const isChatActive = ref(false)
const input = ref('')
const isLoading = ref(false)
const messagesContainer = ref(null)

const messages = ref([
  { role: 'assistant', content: '✨ 你好呀！我是星语小助手，有什么想说的都可以告诉我~' }
])

// 监听登录状态变化
watch(() => userStore.isLoggedIn, (newVal) => {
  if (!newVal) {
    // 退出登录时清除聊天记录
    sessionStorage.removeItem('chatHistory')
    messages.value = [
      { role: 'assistant', content: '✨ 你好呀！我是星语小助手，有什么想说的都可以告诉我~' }
    ]
  }
})

// 从 sessionStorage 恢复历史（仅当登录状态下）
onMounted(() => {
  if (userStore.isLoggedIn) {
    const saved = sessionStorage.getItem('chatHistory')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.length > 0) {
        messages.value = parsed
      }
    }
  }
})

const saveHistory = () => {
  sessionStorage.setItem('chatHistory', JSON.stringify(messages.value))
}

const handleBlur = () => {
  setTimeout(() => {
    if (!input.value.trim()) {
      isChatActive.value = false
    }
  }, 200)
}

const sendMessage = async () => {
  const content = input.value.trim()
  if (!content || isLoading.value) return

  messages.value.push({ role: 'user', content })
  input.value = ''
  isLoading.value = true
  saveHistory()
  await scrollToBottom()

  try {
    const res = await request.post('/ai/chat', { content })
    const reply = res.data || '嗯嗯，我在听你说。'
    messages.value.push({ role: 'assistant', content: reply })
    saveHistory()
  } catch (e) {
    messages.value.push({ role: 'assistant', content: '网络好像有点问题，等会儿再聊吧~' })
    saveHistory()
  }

  isLoading.value = false
  await scrollToBottom()
}

const scrollToBottom = async () => {
  await nextTick()
  const container = messagesContainer.value
  if (container) {
    container.scrollTop = container.scrollHeight
  }
}
</script>

<style scoped lang="scss">
.diary-chat-wrapper {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999;
  transition: all 0.3s ease;
  min-width: 120px;
  max-width: 90%;
}

.chat-trigger {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  border-radius: 30px;
  padding: 6px 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s;
}

.chat-trigger:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.chat-icon {
  font-size: 18px;
}

.chat-window {
  background: transparent;
  backdrop-filter: blur(12px);
  border-radius: 20px;
  padding: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  width: 360px;
  max-width: 90vw;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: radial-gradient(circle at 50% 30%, rgba(25, 25, 112, 0.7), rgba(10, 10, 50, 0.9));
  color: white;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  margin-bottom: 10px;
  color: rgba(255, 255, 255, 0.9);
}

.chat-close {
  cursor: pointer;
  opacity: 0.6;
}
.chat-close:hover {
  opacity: 1;
}

.chat-messages {
  max-height: 280px;
  overflow-y: auto;
  margin-bottom: 10px;
  padding: 4px;
}

.chat-message {
  display: flex;
  margin-bottom: 10px;
}
.chat-message.user {
  justify-content: flex-end;
}
.chat-message.assistant {
  justify-content: flex-start;
}

.bubble {
  max-width: 70%;
  padding: 8px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

.chat-message.assistant .bubble {
  background: linear-gradient(135deg, #4a6cf7, #7c3aed);
  color: white;
  border-bottom-left-radius: 4px;
}

.chat-message.user .bubble {
  background: linear-gradient(135deg, #f093fb, #f5576c);
  color: white;
  border-bottom-right-radius: 4px;
}

.bubble.loading {
  background: rgba(255, 255, 255, 0.2);
  color: #ccc;
}

.chat-input {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  align-items: center;
}

.chat-input-field {
  flex: 1;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 8px 14px;
  color: white;
  font-size: 14px;
  outline: none;
  transition: all 0.3s;
}

.chat-input-field::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.chat-input-field:focus {
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.18);
}

.chat-send-btn {
  background: linear-gradient(135deg, #4a6cf7, #7c3aed);
  border: none;
  border-radius: 20px;
  padding: 8px 18px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.chat-send-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: scale(1.03);
}

.chat-send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 滚动条美化 */
.chat-messages::-webkit-scrollbar {
  width: 4px;
}
.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}
</style>