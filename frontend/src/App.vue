<template>
  <div id="app">
    <router-view />
    
    <!-- 未登录时显示登录/注册入口（右上角） -->
    <div v-if="!isLoggedIn" class="login-hint">
      <router-link to="/login" class="login-link">登录</router-link>
      <span class="divider">|</span>
      <router-link to="/register" class="register-link">注册</router-link>
    </div>
    
    <!-- 右下角导航 + 控制面板组合（仅登录后显示） -->
    <div v-if="isLoggedIn" class="right-bottom-group">
      <!-- 导航栏 -->
      <div class="nav-float" :class="{ expanded: isExpanded }">
        <!-- 收起状态的按钮 -->
        <div v-if="!isExpanded" class="nav-toggle-btn" @click="toggleNav">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
        
        <!-- 展开状态的导航 -->
        <div v-else class="nav-expanded">
          <div class="nav-header">
            <span class="nav-title">导航菜单</span>
            <button class="close-btn" @click="toggleNav">✕</button>
          </div>
          <div class="nav-items">
            <router-link to="/" class="nav-item" @click="onNavClick">
              <span class="nav-icon">✨</span>
              <span class="nav-label">精灵</span>
            </router-link>
            <router-link to="/diary" class="nav-item" @click="onNavClick">
              <span class="nav-icon">📔</span>
              <span class="nav-label">日记</span>
            </router-link>
            <router-link to="/dashboard" class="nav-item" @click="onNavClick">
              <span class="nav-icon">📊</span>
              <span class="nav-label">看板</span>
            </router-link>
            <router-link to="/universe" class="nav-item" @click="onNavClick">
              <span class="nav-icon">🌌</span>
              <span class="nav-label">宇宙</span>
            </router-link>
            <router-link to="/profile" class="nav-item" @click="onNavClick">
              <span class="nav-icon">👤</span>
              <span class="nav-label">我的</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()

const isExpanded = ref(false)

// 登录状态
const isLoggedIn = computed(() => userStore.isLoggedIn)

// 从本地存储读取导航状态
onMounted(() => {
  const saved = localStorage.getItem('navExpanded')
  if (saved !== null) {
    isExpanded.value = saved === 'true'
  }
  
  userStore.init()
})

// 切换导航
const toggleNav = () => {
  isExpanded.value = !isExpanded.value
  localStorage.setItem('navExpanded', isExpanded.value)
}

// 点击导航项
const onNavClick = () => {
  // 可选：点击后自动收起导航
  // isExpanded.value = false
}
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
}

#app {
  width: 100%;
  height: 100%;
  position: relative;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

// 未登录时的登录入口
.login-hint {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 10px 20px;
  border-radius: 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  
  a {
    text-decoration: none;
    color: #667eea;
    font-weight: 500;
    font-size: 14px;
    
    &:hover {
      color: #764ba2;
    }
  }
  
  .divider {
    margin: 0 10px;
    color: #ccc;
  }
}

// 右下角组合
.right-bottom-group {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

// 悬浮式导航
.nav-float {
  position: relative;
  
  .nav-toggle-btn {
    width: 56px;
    height: 56px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
    border-radius: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.3);
    
    .dot {
      width: 6px;
      height: 6px;
      background: #667eea;
      border-radius: 50%;
      transition: all 0.3s ease;
    }
    
    &:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 25px rgba(102, 126, 234, 0.3);
      background: rgba(255, 255, 255, 1);
      
      .dot {
        background: #764ba2;
      }
    }
    
    &:active {
      transform: scale(0.98);
    }
  }
  
  .nav-expanded {
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
    border-radius: 28px;
    padding: 16px 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    animation: slideIn 0.3s ease;
    
    .nav-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      
      .nav-title {
        font-size: 14px;
        font-weight: 600;
        color: #333;
      }
      
      .close-btn {
        width: 28px;
        height: 28px;
        border-radius: 14px;
        border: none;
        background: rgba(0, 0, 0, 0.05);
        cursor: pointer;
        font-size: 14px;
        color: #999;
        transition: all 0.2s;
        
        &:hover {
          background: rgba(0, 0, 0, 0.1);
          color: #666;
        }
      }
    }
    
    .nav-items {
      display: flex;
      gap: 12px;
      
      .nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-decoration: none;
        padding: 10px 14px;
        border-radius: 20px;
        transition: all 0.2s;
        color: #999;
        
        &.router-link-active {
          background: linear-gradient(135deg, #667eea15, #764ba215);
          color: #667eea;
        }
        
        .nav-icon {
          font-size: 24px;
          margin-bottom: 4px;
        }
        
        .nav-label {
          font-size: 11px;
          font-weight: 500;
        }
        
        &:hover {
          background: rgba(102, 126, 234, 0.1);
          transform: translateY(-2px);
          color: #667eea;
        }
        
        &:active {
          transform: translateY(0);
        }
      }
    }
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// 移动端适配
@media (max-width: 768px) {
  .right-bottom-group {
    right: 16px;
    bottom: 16px;
    gap: 10px;
  }
  
  .nav-float {
    .nav-expanded {
      padding: 12px 14px;
      
      .nav-items {
        gap: 6px;
        
        .nav-item {
          padding: 6px 8px;
          
          .nav-icon {
            font-size: 20px;
          }
          
          .nav-label {
            font-size: 9px;
          }
        }
      }
    }
  }
}
</style>