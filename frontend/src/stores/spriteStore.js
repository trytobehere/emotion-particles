import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSpriteStore = defineStore('sprite', () => {
  // 精灵模板库（所有用户共享）
  const spriteTemplates = ref([
    {
      id: 'happy',
      name: '开心小火苗',
      emoji: '😊',
      emotion: '开心',
      color: '#FFD93D',
      value: 5,
      // 动画参数
      animation: {
        type: 'bounce',      // bounce, float, spin, pulse, shake
        speed: 1.2,
        intensity: 1.0
      },
      // 精灵外观
      appearance: {
        shape: 'flame',       // flame, droplet, star, cloud, heart
        primaryColor: '#FFD93D',
        secondaryColor: '#FF9F3D',
        size: 1.0,
        hasFace: true,
        accessories: ['sparkle']
      },
      // 描述
      description: '充满活力的小火苗，蹦蹦跳跳传递快乐',
      createdBy: 'system',
      usageCount: 1247
    },
    {
      id: 'calm',
      name: '平静云朵',
      emoji: '😌',
      emotion: '平静',
      color: '#6BCB77',
      value: 3,
      animation: {
        type: 'float',
        speed: 0.6,
        intensity: 0.8
      },
      appearance: {
        shape: 'cloud',
        primaryColor: '#6BCB77',
        secondaryColor: '#A8E6CF',
        size: 1.0,
        hasFace: true,
        accessories: []
      },
      description: '缓缓飘动的云朵，带来宁静与平和',
      createdBy: 'system',
      usageCount: 892
    },
    {
      id: 'tired',
      name: '疲惫小雨滴',
      emoji: '😫',
      emotion: '疲惫',
      color: '#9B9B9B',
      value: 2,
      animation: {
        type: 'float',
        speed: 0.4,
        intensity: 0.5
      },
      appearance: {
        shape: 'droplet',
        primaryColor: '#9B9B9B',
        secondaryColor: '#C0C0C0',
        size: 0.9,
        hasFace: true,
        accessories: ['zzz']
      },
      description: '慢慢滑落的小雨滴，懂得疲惫也需要被看见',
      createdBy: 'system',
      usageCount: 456
    },
    {
      id: 'anxious',
      name: '焦虑小漩涡',
      emoji: '😰',
      emotion: '焦虑',
      color: '#FF9F9F',
      value: 1,
      animation: {
        type: 'spin',
        speed: 1.8,
        intensity: 1.2
      },
      appearance: {
        shape: 'star',
        primaryColor: '#FF9F9F',
        secondaryColor: '#FFCCCB',
        size: 0.95,
        hasFace: true,
        accessories: ['sweat']
      },
      description: '不停旋转的小星星，焦虑的时候抱抱你',
      createdBy: 'system',
      usageCount: 567
    },
    {
      id: 'excited',
      name: '兴奋小星星',
      emoji: '🤩',
      emotion: '兴奋',
      color: '#FF6B6B',
      value: 5,
      animation: {
        type: 'pulse',
        speed: 1.5,
        intensity: 1.3
      },
      appearance: {
        shape: 'star',
        primaryColor: '#FF6B6B',
        secondaryColor: '#FFD93D',
        size: 1.1,
        hasFace: true,
        accessories: ['glow', 'sparkle']
      },
      description: '闪闪发光的小星星，兴奋到停不下来',
      createdBy: 'system',
      usageCount: 678
    },
    {
      id: 'sad',
      name: '低落小乌云',
      emoji: '😔',
      emotion: '低落',
      color: '#A78BFA',
      value: 1,
      animation: {
        type: 'float',
        speed: 0.5,
        intensity: 0.6
      },
      appearance: {
        shape: 'cloud',
        primaryColor: '#A78BFA',
        secondaryColor: '#C4B5FD',
        size: 1.0,
        hasFace: true,
        accessories: ['rain']
      },
      description: '飘着小雨的乌云，陪你度过低落时刻',
      createdBy: 'system',
      usageCount: 734
    }
  ])
  
  // 用户创建的自定义精灵模板
  const customTemplates = ref([])
  
  // 当前选中的精灵模板
  const currentTemplate = ref(spriteTemplates.value[0])
  
  // 获取所有模板
  const getAllTemplates = () => {
    return [...spriteTemplates.value, ...customTemplates.value]
  }
  
  // 根据情绪值获取推荐模板
  const getTemplateByEmotionValue = (value) => {
    const templates = getAllTemplates()
    return templates.find(t => t.value === value) || templates[0]
  }
  
  // 根据情绪名称获取模板
  const getTemplateByEmotion = (emotionName) => {
    const templates = getAllTemplates()
    return templates.find(t => t.emotion === emotionName)
  }
  
  // 添加自定义模板
  const addCustomTemplate = (template) => {
    const newTemplate = {
      ...template,
      id: `custom_${Date.now()}`,
      createdBy: 'user',
      usageCount: 0
    }
    customTemplates.value.push(newTemplate)
    
    // 保存到本地
    saveToLocal()
    
    return newTemplate
  }
  
  // 增加使用次数
  const incrementUsage = (templateId) => {
    const template = getAllTemplates().find(t => t.id === templateId)
    if (template) {
      template.usageCount++
      saveToLocal()
    }
  }
  
  // 保存到本地存储
  const saveToLocal = () => {
    localStorage.setItem('customSpriteTemplates', JSON.stringify(customTemplates.value))
  }
  
  // 从本地加载
  const loadFromLocal = () => {
    const saved = localStorage.getItem('customSpriteTemplates')
    if (saved) {
      try {
        customTemplates.value = JSON.parse(saved)
      } catch (e) {
        console.error('加载自定义精灵失败', e)
      }
    }
  }
  
  // 设置当前模板
  const setCurrentTemplate = (template) => {
    currentTemplate.value = template
    incrementUsage(template.id)
  }
  
  return {
    spriteTemplates,
    customTemplates,
    currentTemplate,
    getAllTemplates,
    getTemplateByEmotionValue,
    getTemplateByEmotion,
    addCustomTemplate,
    setCurrentTemplate,
    loadFromLocal,
    incrementUsage
  }
})