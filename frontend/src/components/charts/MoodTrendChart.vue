<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3>📈 情绪趋势</h3>
      <span class="subtitle">近7天</span>
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
    grid: {
      left: '8%',
      right: '5%',
      top: 30,
      bottom: 30,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: props.data.map(d => d.date),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        fontSize: 12,
        color: '#999'
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 5,
      splitLine: { 
        lineStyle: { 
          type: 'dashed', 
          color: '#eee' 
        } 
      },
      axisLabel: {
        fontSize: 12,
        color: '#999'
      }
    },
    series: [{
      data: props.data.map(d => d.value),
      type: 'line',
      smooth: true,
      lineStyle: { 
        color: '#667eea', 
        width: 3 
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#667eea40' },
          { offset: 1, color: '#667eea05' }
        ])
      },
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: { 
        color: '#764ba2',
        borderWidth: 2,
        borderColor: '#fff'
      },
      label: {
        show: true,
        position: 'top',
        fontSize: 12,
        color: '#667eea',
        fontWeight: 600
      }
    }],
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>情绪值: {c}',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#eee',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: {
        color: '#333',
        fontSize: 13
      }
    }
  }
  
  chartInstance.setOption(option)
}

// 响应式调整
const handleResize = () => {
  chartInstance?.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

// 监听数据变化
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
  height: 250px;
}
</style>