<style scoped lang="scss">
.gif-sprite-container {
  width: 100%;
  height: 100%;
  background: transparent;  // 改成透明
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  
  .sprite-gif {
    position: absolute;
    width: 120px;
    height: 120px;
    object-fit: contain;
    cursor: grab;
    filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
    
    &:active {
      cursor: grabbing;
    }
  }
  
  .emotion-picker {
    position: absolute;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    padding: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    
    .emotion-grid {
      display: flex;
      gap: 12px;
      
      .emotion-card {
        padding: 12px;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.3s;
        
        &.active {
          background: rgba(102, 126, 234, 0.15);
        }
        
        &:hover {
          background: #f5f7fa;
          transform: scale(1.05);
        }
        
        .card-gif {
          width: 70px;
          height: 70px;
          object-fit: contain;
        }
        
        .card-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 8px;
          
          .name {
            font-size: 12px;
            color: #666;
          }
          
          .emoji {
            font-size: 16px;
          }
        }
      }
    }
  }
}
</style>