<template>
  <div class="login-view">
    <div class="login-card">
      <h1>✨ 情绪粒子</h1>
      <p class="subtitle">轻记录 · 深洞察 · 广共鸣</p>
      
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item prop="username">
          <el-input 
            v-model="form.username" 
            placeholder="用户名"
            size="large"
            prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input 
            v-model="form.password" 
            type="password"
            placeholder="密码"
            size="large"
            prefix-icon="Lock"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-button 
          type="primary" 
          size="large" 
          :loading="loading"
          @click="handleLogin"
          class="login-btn"
        >
          登录
        </el-button>
        
        <div class="register-link">
          还没有账号？
          <router-link to="/register">立即注册</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  
  loading.value = true
  const result = await userStore.login(form.username, form.password)
  loading.value = false
  
  if (result.success) {
    ElMessage.success('登录成功')
    router.push('/')
  } else {
    ElMessage.error(result.error || '登录失败')
  }
}
</script>

<style scoped lang="scss">
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 360px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 30px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  
  h1 {
    text-align: center;
    margin: 0 0 8px;
    color: #333;
  }
  
  .subtitle {
    text-align: center;
    color: #999;
    font-size: 13px;
    margin-bottom: 30px;
  }
  
  .login-btn {
    width: 100%;
    height: 48px;
    margin-top: 10px;
  }
  
  .register-link {
    text-align: center;
    margin-top: 20px;
    color: #999;
    font-size: 14px;
    
    a {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }
  }
}
</style>