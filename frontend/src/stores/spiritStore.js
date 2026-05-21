import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'

export const useSpiritStore = defineStore('spirit', () => {
  const currentEmotion = ref(null)
  const todayRecords = ref([])
  const spiritState = ref(null)
  
  // 获取精灵状态
  const fetchSpiritState = async () => {
    try {
      const res = await request.get('/mood-records/today')
      if (res.data && res.data.length > 0) {
        const latest = res.data[0]
        currentEmotion.value = {
          id: latest.tagId,
          moodLevel: latest.moodLevel,
          note: latest.note
        }
      }
      todayRecords.value = res.data || []
      return res
    } catch (error) {
      console.error('获取精灵状态失败', error)
      return null
    }
  }
  
  // 设置当前情绪（并同步到后端）
  const setCurrentEmotion = async (emotion) => {
    currentEmotion.value = emotion
    
    // 调用后端保存情绪记录
    try {
      await request.post('/mood-records', {
        tagId: emotion.id,
        moodLevel: emotion.value || emotion.moodLevel || 3,
        note: emotion.label || ''
      })
      // 刷新今日记录
      await fetchSpiritState()
    } catch (error) {
      console.error('保存情绪失败', error)
      throw error
    }
  }
  
  // 快速记录情绪
  const quickRecord = async (tagId, moodLevel, note = '') => {
    try {
      const res = await request.post('/mood-records', {
        tagId,
        moodLevel,
        note
      })
      await fetchSpiritState()
      return res
    } catch (error) {
      console.error('快速记录失败', error)
      throw error
    }
  }
  
  // 获取情绪记录列表
  const fetchRecords = async (days = 7) => {
    try {
      const res = await request.get('/mood-records', {
        params: { days }
      })
      return res.data
    } catch (error) {
      console.error('获取记录失败', error)
      return []
    }
  }
  
  return {
    currentEmotion,
    todayRecords,
    spiritState,
    fetchSpiritState,
    setCurrentEmotion,
    quickRecord,
    fetchRecords
  }
})