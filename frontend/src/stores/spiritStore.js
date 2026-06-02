import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'

export const useSpiritStore = defineStore('spirit', () => {
  // 情绪相关
  const currentEmotion = ref(null)
  const todayRecords = ref([])
  
  // 精灵状态相关
  const spiritState = ref(null)
  const spiritType = ref('water')
  const spiritColor = ref('#4A9EFF')
  const followMode = ref('container')
  
  // ========== 情绪相关 ==========
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
  
  const setCurrentEmotion = async (emotion) => {
    currentEmotion.value = emotion
    try {
      await request.post('/mood-records', {
        tagId: emotion.id,
        moodLevel: emotion.value || emotion.moodLevel || 3,
        note: emotion.label || ''
      })
      await fetchSpiritState()
    } catch (error) {
      console.error('保存情绪失败', error)
      throw error
    }
  }
  
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
  
  // ========== 精灵配置相关 ==========
  const getSpiritState = async () => {
    try {
      const res = await request.get('/spirit/state')
      if (res.code === 200 && res.data) {
        spiritState.value = res.data
        spiritType.value = res.data.spiritType || 'water'
        spiritColor.value = res.data.spiritColor || '#4A9EFF'
        followMode.value = res.data.followMode || 'container'
        return res.data
      }
    } catch (error) {
      console.error('获取精灵配置失败', error)
    }
    return null
  }
  
  const updateSpiritState = async (data) => {
    try {
      const res = await request.put('/spirit/state', data)
      if (res.code === 200) {
        spiritState.value = res.data
        if (data.spiritType) spiritType.value = data.spiritType
        if (data.spiritColor) spiritColor.value = data.spiritColor
        if (data.followMode) followMode.value = data.followMode
        return res.data
      }
    } catch (error) {
      console.error('更新精灵配置失败', error)
    }
    return null
  }
  
  return {
    // 情绪相关
    currentEmotion,
    todayRecords,
    fetchSpiritState,
    setCurrentEmotion,
    quickRecord,
    fetchRecords,
    
    // 精灵配置相关
    spiritState,
    spiritType,
    spiritColor,
    followMode,
    getSpiritState,
    updateSpiritState
  }
})