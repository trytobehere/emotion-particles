<template>
  <div class="register-view">
    <div class="register-card">
      <h1>📝 注册账号</h1>
      
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item prop="username">
          <el-input 
            v-model="form.username" 
            placeholder="用户名"
            size="large"
          />
        </el-form-item>
        <el-form-item prop="email">
          <el-input 
            v-model="form.email" 
            placeholder="邮箱"
            size="large"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input 
            v-model="form.password" 
            type="password"
            placeholder="密码"
            size="large"
          />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input 
            v-model="form.confirmPassword" 
            type="password"
            placeholder="确认密码"
            size="large"
          />
        </el-form-item>
        
        <el-button 
          type="primary" 
          size="large" 
          :loading="loading"
          @click="handleRegister"
          class="register-btn"
        >
          注册
        </el-button>
        
        <div class="login-link">
          已有账号？
          <router-link to="/login">返回登录</router-link>
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
  email: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('两次密码输入不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度3-50字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  
  loading.value = true
  const result = await userStore.register(form.username, form.password, form.email)
  loading.value = false
  
  if (result.success) {
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } else {
    ElMessage.error(result.error || '注册失败')
  }
}
</script>

<style scoped lang="scss">
.register-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-card {
  width: 100%;
  max-width: 360px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 30px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  
  h1 {
    text-align: center;
    margin: 0 0 30px;
    color: #333;
  }
  
  .register-btn {
    width: 100%;
    height: 48px;
    margin-top: 10px;
  }
  
  .login-link {
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