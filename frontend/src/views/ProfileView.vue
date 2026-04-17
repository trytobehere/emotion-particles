<template>
  <div class="profile-view">
    <!-- 头部 -->
    <div class="header">
      <h1>👤 个人中心</h1>
      <el-button link @click="showSettings = true">
        <el-icon><Setting /></el-icon>
      </el-button>
    </div>
    
    <!-- 用户信息卡片 -->
    <div class="user-card">
      <div class="avatar-section">
        <div class="avatar" @click="showAvatarPicker = true">
          {{ userStore.userInfo.avatar }}
        </div>
        <div class="user-info">
          <h2>{{ userStore.userInfo.username }}</h2>
          <p class="bio">{{ userStore.userInfo.bio }}</p>
        </div>
      </div>
      
      <div class="user-stats">
        <div class="stat-item">
          <span class="value">{{ userStore.daysSinceJoin }}</span>
          <span class="label">加入天数</span>
        </div>
        <div class="stat-item">
          <span class="value">{{ diaryStore.diaries.length }}</span>
          <span class="label">日记</span>
        </div>
        <div class="stat-item">
          <span class="value">{{ totalRecords }}</span>
          <span class="label">记录</span>
        </div>
      </div>
    </div>
    
    <!-- 功能菜单 -->
    <div class="menu-section">
      <div class="menu-group">
        <div class="group-title">账号管理</div>
        <div class="menu-item" @click="handleEditProfile">
          <div class="menu-left">
            <span class="icon">✏️</span>
            <span>编辑资料</span>
          </div>
          <el-icon><ArrowRight /></el-icon>
        </div>
        <div class="menu-item" @click="handleChangePassword">
          <div class="menu-left">
            <span class="icon">🔐</span>
            <span>修改密码</span>
          </div>
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
      
      <div class="menu-group">
        <div class="group-title">数据管理</div>
        <div class="menu-item" @click="handleExportData">
          <div class="menu-left">
            <span class="icon">📤</span>
            <span>导出数据</span>
          </div>
          <el-icon><ArrowRight /></el-icon>
        </div>
        <div class="menu-item" @click="handleClearCache">
          <div class="menu-left">
            <span class="icon">🗑️</span>
            <span>清除缓存</span>
          </div>
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
      
      <div class="menu-group">
        <div class="group-title">使用统计</div>
        <div class="menu-item" @click="goToDashboard">
          <div class="menu-left">
            <span class="icon">📊</span>
            <span>详细数据</span>
          </div>
          <el-icon><ArrowRight /></el-icon>
        </div>
        <div class="menu-item">
          <div class="menu-left">
            <span class="icon">📅</span>
            <span>连续记录</span>
          </div>
          <span class="value-badge">{{ continuousDays }} 天</span>
        </div>
      </div>
      
      <div class="menu-group">
        <div class="group-title">其他</div>
        <div class="menu-item">
          <div class="menu-left">
            <span class="icon">ℹ️</span>
            <span>关于我们</span>
          </div>
          <span class="version">v1.0.0</span>
        </div>
        <div class="menu-item" @click="handleFeedback">
          <div class="menu-left">
            <span class="icon">💬</span>
            <span>意见反馈</span>
          </div>
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
    </div>
    
    <!-- 退出登录按钮 -->
    <div class="logout-section">
      <el-button type="danger" plain round size="large" @click="handleLogout">
        退出登录
      </el-button>
    </div>
    
    <!-- 编辑资料对话框 -->
    <el-dialog v-model="showEditProfile" title="编辑资料" width="90%">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="editForm.username" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="个性签名">
          <el-input v-model="editForm.bio" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditProfile = false">取消</el-button>
        <el-button type="primary" @click="saveProfile">保存</el-button>
      </template>
    </el-dialog>
    
    <!-- 头像选择器 -->
    <el-dialog v-model="showAvatarPicker" title="选择头像" width="80%">
      <div class="avatar-grid">
        <div 
          v-for="avatar in avatarOptions" 
          :key="avatar"
          class="avatar-option"
          :class="{ active: userStore.userInfo.avatar === avatar }"
          @click="selectAvatar(avatar)"
        >
          {{ avatar }}
        </div>
      </div>
    </el-dialog>
    
    <!-- 设置抽屉 -->
    <el-drawer v-model="showSettings" title="设置" direction="rtl" size="80%">
      <div class="settings-content">
        <div class="setting-item">
          <div class="setting-info">
            <span class="title">深色模式</span>
            <span class="desc">使用深色主题</span>
          </div>
          <el-switch v-model="settingsForm.theme" 
            active-value="dark" 
            inactive-value="light"
          />
        </div>
        
        <div class="setting-item">
          <div class="setting-info">
            <span class="title">消息通知</span>
            <span class="desc">接收互动提醒</span>
          </div>
          <el-switch v-model="settingsForm.notifications" />
        </div>
        
        <div class="setting-item">
          <div class="setting-info">
            <span class="title">匿名模式</span>
            <span class="desc">树洞中显示为匿名</span>
          </div>
          <el-switch v-model="settingsForm.anonymousMode" />
        </div>
        
        <div class="setting-item">
          <div class="setting-info">
            <span class="title">自动同步</span>
            <span class="desc">WiFi下自动同步数据</span>
          </div>
          <el-switch v-model="settingsForm.autoSync" />
        </div>
        
        <div class="setting-item">
          <div class="setting-info">
            <span class="title">字体大小</span>
          </div>
          <el-select v-model="settingsForm.fontSize" size="small">
            <el-option label="小" value="small" />
            <el-option label="中" value="medium" />
            <el-option label="大" value="large" />
          </el-select>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Setting, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/userStore'
import { useDiaryStore } from '@/stores/diaryStore'

const router = useRouter()
const userStore = useUserStore()
const diaryStore = useDiaryStore()

// UI状态
const showEditProfile = ref(false)
const showAvatarPicker = ref(false)
const showSettings = ref(false)

// 编辑表单
const editForm = reactive({
  username: userStore.userInfo.username,
  email: userStore.userInfo.email,
  bio: userStore.userInfo.bio
})

// 设置表单
const settingsForm = reactive({ ...userStore.settings })

// 头像选项
const avatarOptions = ['😊', '😎', '🥰', '🤔', '😌', '🌟', '🌈', '🌸', '🐼', '🦊', '🐨', '🐧']

// 计算属性 - 必须先定义才能使用
const totalRecords = computed(() => {
  return diaryStore.diaries.length * 2
})

const continuousDays = computed(() => {
  return diaryStore.diaries.length > 0 ? Math.min(7, diaryStore.diaries.length) : 0
})

// 更新统计数据
const updateStats = () => {
  const stats = {
    totalDiaries: diaryStore.diaries.length,
    totalRecords: totalRecords.value,
    continuousDays: continuousDays.value,
    totalLikes: 42
  }
  userStore.updateStatistics(stats)
}

// 编辑资料
const handleEditProfile = () => {
  editForm.username = userStore.userInfo.username
  editForm.email = userStore.userInfo.email
  editForm.bio = userStore.userInfo.bio
  showEditProfile.value = true
}

const saveProfile = () => {
  userStore.updateUserInfo(editForm)
  showEditProfile.value = false
  ElMessage.success('资料已更新')
}

// 选择头像
const selectAvatar = (avatar) => {
  userStore.updateUserInfo({ avatar })
  showAvatarPicker.value = false
  ElMessage.success('头像已更新')
}

// 修改密码
const handleChangePassword = () => {
  ElMessage.info('演示模式：密码修改功能')
}

// 导出数据
const handleExportData = () => {
  const data = {
    user: userStore.userInfo,
    diaries: diaryStore.diaries,
    exportTime: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `emotion-data-${Date.now()}.json`
  a.click()
  
  ElMessage.success('数据导出成功')
}

// 清除缓存
const handleClearCache = async () => {
  try {
    await ElMessageBox.confirm('确定清除所有本地缓存吗？', '提示', {
      type: 'warning'
    })
    localStorage.clear()
    ElMessage.success('缓存已清除')
  } catch {
    // 取消
  }
}

// 跳转到看板
const goToDashboard = () => {
  router.push('/dashboard')
}

// 意见反馈
const handleFeedback = () => {
  ElMessage.info('感谢您的反馈！我们会认真对待每一条建议。')
}

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定退出登录吗？', '提示', {
      type: 'warning'
    })
    ElMessage.success('已退出登录')
  } catch {
    // 取消
  }
}

// 生命周期 - 放在最后
onMounted(() => {
  updateStats()
})
</script>

<style scoped lang="scss">
.profile-view {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 80px;
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: white;
    
    h1 {
      font-size: 24px;
      margin: 0;
    }
  }
  
  .user-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    margin: 20px;
    padding: 24px;
    border-radius: 24px;
    color: white;
    
    .avatar-section {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      
      .avatar {
        width: 70px;
        height: 70px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 40px;
        cursor: pointer;
        transition: all 0.3s;
        border: 3px solid rgba(255, 255, 255, 0.5);
        
        &:hover {
          transform: scale(1.05);
          background: rgba(255, 255, 255, 0.3);
        }
      }
      
      .user-info {
        flex: 1;
        
        h2 {
          margin: 0 0 8px 0;
          font-size: 22px;
        }
        
        .bio {
          margin: 0;
          opacity: 0.9;
          font-size: 14px;
        }
      }
    }
    
    .user-stats {
      display: flex;
      justify-content: space-around;
      
      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .value {
          font-size: 24px;
          font-weight: 700;
        }
        
        .label {
          font-size: 13px;
          opacity: 0.8;
          margin-top: 4px;
        }
      }
    }
  }
  
  .menu-section {
    padding: 0 20px;
    
    .menu-group {
      background: white;
      border-radius: 16px;
      margin-bottom: 16px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      
      .group-title {
        padding: 16px 16px 8px;
        font-size: 13px;
        color: #999;
        font-weight: 500;
      }
      
      .menu-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        cursor: pointer;
        transition: background 0.3s;
        
        &:hover {
          background: #f5f7fa;
        }
        
        .menu-left {
          display: flex;
          align-items: center;
          gap: 12px;
          
          .icon {
            font-size: 22px;
            width: 28px;
            text-align: center;
          }
          
          span:last-child {
            font-size: 15px;
            color: #333;
          }
        }
        
        .value-badge {
          padding: 4px 12px;
          background: #667eea;
          color: white;
          border-radius: 20px;
          font-size: 13px;
        }
        
        .version {
          color: #999;
          font-size: 13px;
        }
      }
    }
  }
  
  .logout-section {
    padding: 20px;
    
    .el-button {
      width: 100%;
      height: 50px;
      font-size: 16px;
    }
  }
  
  .avatar-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    padding: 16px;
    
    .avatar-option {
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      background: #f5f7fa;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.3s;
      
      &.active {
        background: #667eea;
        transform: scale(1.05);
        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
      }
      
      &:hover {
        background: #e0e3e9;
      }
    }
  }
  
  .settings-content {
    padding: 20px;
    
    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      border-bottom: 1px solid #f0f0f0;
      
      .setting-info {
        .title {
          display: block;
          font-size: 16px;
          color: #333;
          margin-bottom: 4px;
        }
        
        .desc {
          font-size: 13px;
          color: #999;
        }
      }
    }
  }
}
</style>