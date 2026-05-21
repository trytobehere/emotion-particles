import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'

export const useDiaryStore = defineStore('diary', () => {
  const diaries = ref([])
  
  const commonTags = ref([
    '工作', '学习', '生活', '社交', '家庭', 
    '健康', '运动', '美食', '旅行', '阅读',
    '电影', '音乐', '游戏', '购物', '理财'
  ])
  
  // 加载日记列表
  const fetchDiaries = async () => {
    try {
      const res = await request.get('/diaries')
      const list = res.data?.content || res.data || []
      // 转换数据格式，确保 emotion 字段存在
      diaries.value = list.map(item => ({
        id: item.id,
        title: item.title || '无标题',
        content: item.content || '',
        contentPreview: item.contentPreview || (item.content?.substring(0, 80) || ''),
        emotion: {
          emoji: getEmotionEmoji(item.moodLevel),
          label: getEmotionLabel(item.moodLevel),
          color: getEmotionColor(item.moodLevel),
          value: item.moodLevel || 3
        },
        tags: item.tags || [],
        images: item.images || [],
        createdAt: item.createdAt || new Date().toISOString(),
        weather: item.weather || '晴',
        moodLevel: item.moodLevel || 3
      }))
    } catch (error) {
      console.error('获取日记失败', error)
    }
  }
  
  // 根据情绪值获取表情
  const getEmotionEmoji = (level) => {
    const map = { 1: '😔', 2: '😫', 3: '😌', 4: '😊', 5: '🤩' }
    return map[level] || '😊'
  }
  
  const getEmotionLabel = (level) => {
    const map = { 1: '低落', 2: '疲惫', 3: '平静', 4: '开心', 5: '兴奋' }
    return map[level] || '平静'
  }
  
  const getEmotionColor = (level) => {
    const map = { 1: '#A78BFA', 2: '#9B9B9B', 3: '#6BCB77', 4: '#FFD93D', 5: '#FF6B6B' }
    return map[level] || '#6BCB77'
  }
  
  // 添加日记
  const addDiary = async (diary) => {
    try {
      await request.post('/diaries', {
        title: diary.title,
        content: diary.content,
        moodLevel: diary.emotion?.value || 3,
        weather: diary.weather,
        isPublic: 0
      })
      await fetchDiaries()
    } catch (error) {
      console.error('保存日记失败', error)
      throw error
    }
  }
  
  // 删除日记
  const deleteDiary = async (id) => {
    try {
      await request.delete(`/diaries/${id}`)
      await fetchDiaries()
    } catch (error) {
      console.error('删除日记失败', error)
      throw error
    }
  }
  
  // 更新日记
  const updateDiary = async (id, updates) => {
    try {
      await request.put(`/diaries/${id}`, updates)
      await fetchDiaries()
    } catch (error) {
      console.error('更新日记失败', error)
      throw error
    }
  }
  
  // 获取草稿
  const fetchDrafts = async () => {
    try {
      const res = await request.get('/diaries/drafts')
      return res.data || []
    } catch (error) {
      console.error('获取草稿失败', error)
      return []
    }
  }
  
  // 生成日记摘要
  const generateSummary = async (content) => {
    try {
      const res = await request.post('/ai/summary', { content })
      return res.data
    } catch (error) {
      console.error('生成摘要失败', error)
      return ''
    }
  }

  // 生成智能建议
  const generateSuggestion = async (content, emotionLabel) => {
    try {
      const res = await request.post('/ai/suggestion', { content, emotionLabel })
      return res.data
    } catch (error) {
      console.error('生成建议失败', error)
      return ''
    }
  }

  return {
    diaries,
    commonTags,
    fetchDiaries,
    addDiary,
    deleteDiary,
    updateDiary,
    fetchDrafts,
    generateSummary,   // ✅ 新增
    generateSuggestion // ✅ 新增
  }
})