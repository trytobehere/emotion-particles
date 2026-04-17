<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3>🥧 情绪分布</h3>
      <span class="subtitle">本周</span>
    </div>
    <div ref="chartRef" class="chart"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
})

const chartRef = ref(null)
let chartInstance = null

const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}次 ({d}%)',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#eee',
      padding: [8, 12]
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      itemWidth: 12,
      itemHeight: 12,
      textStyle: {
        fontSize: 12,
        color: '#666'
      }
    },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        position: 'outside',
        formatter: '{b}\n{d}%',
        fontSize: 12,
        color: '#666',
        lineHeight: 18
      },
      labelLine: {
        length: 15,
        length2: 10,
        smooth: true
      },
      emphasis: {
        scale: true,
        label: {
          show: true,
          fontWeight: 600
        }
      },
      data: props.data
    }],
    color: ['#FFD93D', '#6BCB77', '#FF9F9F', '#9B9B9B', '#A78BFA', '#FF6B6B']
  }
  
  chartInstance.setOption(option)
}

const handleResize = () => {
  chartInstance?.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

watch(() => props.data, () => {
  if (chartInstance) {
    initChart()
  }
}, { deep: true })
</script>

<style scoped>
.chart-container {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.subtitle {
  font-size: 13px;
  color: #999;
}

.chart {
  width: 100%;
  height: 300px;
}
</style>