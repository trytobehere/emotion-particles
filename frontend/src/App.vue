<template>
  <div id="app">
    <router-view />
    
    <!-- 底部导航 -->
    <nav class="bottom-nav">
      <router-link to="/" class="nav-item">
        <span class="icon">✨</span>
        <span class="label">精灵</span>
      </router-link>
      <router-link to="/diary" class="nav-item">
        <span class="icon">📔</span>
        <span class="label">日记</span>
      </router-link>
      <router-link to="/dashboard" class="nav-item">
        <span class="icon">📊</span>
        <span class="label">看板</span>
      </router-link>
      <router-link to="/universe" class="nav-item">
        <span class="icon">🌌</span>
        <span class="label">宇宙</span>
      </router-link>
      <router-link to="/profile" class="nav-item">
        <span class="icon">👤</span>
        <span class="label">我的</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
// App根组件
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

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 1000;
  
  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-decoration: none;
    color: #999;
    transition: all 0.3s;
    
    &.router-link-active {
      color: #667eea;
    }
    
    .icon {
      font-size: 24px;
      margin-bottom: 4px;
    }
    
    .label {
      font-size: 12px;
    }
  }
}
</style>