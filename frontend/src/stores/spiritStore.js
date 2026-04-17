import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSpiritStore = defineStore('spirit', () => {
  const currentEmotion = ref(null)
  
  const setCurrentEmotion = (emotion) => {
    currentEmotion.value = emotion
  }
  
  return {
    currentEmotion,
    setCurrentEmotion
  }
})