import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { levelsAPI, inventoryAPI } from '../services/api'
import '../styles/Levels.css'

function Levels() {
  const navigate = useNavigate()
  const [levels, setLevels] = useState([])
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [inventory, setInventory] = useState(null)

  useEffect(() => {
    levelsAPI.getLevels().then(res => {
      if (res.success) {
        setLevels(res.data)
      }
    })
    loadInventory()
  }, [])

  const loadInventory = useCallback(async () => {
    try {
      const res = await inventoryAPI.getInventory()
      if (res.success) {
        setInventory(res.data.items)
      }
    } catch (error) {
      console.error('加载背包失败:', error)
    }
  }, [])

  const handleLevelClick = (level) => {
    if (level.isUnlocked) {
      setSelectedLevel(level)
      setShowModal(true)
      loadInventory()
    }
  }

  const handleStartLevel = () => {
    if (selectedLevel) {
      navigate(`/game/${selectedLevel.id}`)
    }
  }

  const renderStars = (count) => {
    return Array(3).fill(0).map((_, i) => (
      <span key={i} className={`star ${i < count ? 'filled' : ''}`}>
        ⭐
      </span>
    ))
  }

  const categoryConfig = {
    heal: { name: '回复', icon: '❤️' },
    buff: { name: '增益', icon: '✨' },
    revive: { name: '复活', icon: '📜' },
    shield: { name: '护盾', icon: '🛡️' }
  }

  const usableItems = inventory?.filter(inv => {
    const categories = ['heal', 'buff', 'shield', 'revive']
    return categories.includes(inv.item?.category) && inv.quantity > 0
  }) || []

  return (
    <div className="levels-page">
      <div className="container">
        <h1 className="page-title">🎯 选择关卡</h1>

        <div className="level-header card">
          <div className="level-stats">
            <div className="stat">
              <span className="stat-icon">⭐</span>
              <span className="stat-text">
                {levels.reduce((sum, l) => sum + l.stars, 0)} / {levels.length * 3}
              </span>
            </div>
            <div className="stat">
              <span className="stat-icon">🎯</span>
              <span className="stat-text">
                {levels.filter(l => l.isCompleted).length} / {levels.length}
              </span>
            </div>
          </div>
        </div>

        <div className="levels-grid">
          {levels.map(level => (
            <div
              key={level.id}
              className={`level-card card ${level.isUnlocked ? 'unlocked' : 'locked'} ${level.isCompleted ? 'completed' : ''}`}
              onClick={() => handleLevelClick(level)}
            >
              <div className="level-number">
                {level.isUnlocked ? level.id : '🔒'}
              </div>
              <div className="level-name">
                {level.name}
              </div>
              {level.isCompleted && (
                <div className="level-stars">
                  {renderStars(level.stars)}
                </div>
              )}
              {!level.isCompleted && level.isUnlocked && (
                <div className="level-status">
                  未完成
                </div>
              )}
              {!level.isUnlocked && (
                <div className="level-status">
                  未解锁
                </div>
              )}
            </div>
          ))}
        </div>

        {showModal && selectedLevel && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal card level-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedLevel.name}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                {selectedLevel.isCompleted && (
                  <div className="modal-stars">
                    {renderStars(selectedLevel.stars)}
                  </div>
                )}
                <div className="modal-info">
                  <div className="info-item">
                    <span className="info-label">关卡ID:</span>
                    <span className="info-value">{selectedLevel.id}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">状态:</span>
                    <span className="info-value">
                      {selectedLevel.isCompleted ? '✅ 已完成' : '⏳ 待挑战'}
                    </span>
                  </div>
                </div>

                <div className="inventory-section">
                  <h3 className="inventory-title">🎒 可用道具</h3>
                  {usableItems.length === 0 ? (
                    <div className="empty-inventory-hint">
                      <p>背包空空如也</p>
                      <p className="hint-text">通关关卡有概率获得道具</p>
                    </div>
                  ) : (
                    <div className="usable-items-grid">
                      {usableItems.map(inv => (
                        <div 
                          key={inv.itemId}
                          className={`usable-item rarity-${inv.item?.rarity || 'common'}`}
                          title={`${inv.item.name}: ${inv.item.description}`}
                        >
                          <span className="item-icon">{inv.item?.icon}</span>
                          <span className="item-name">{inv.item?.name}</span>
                          <span className="item-count">×{inv.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button className="btn btn-primary" onClick={handleStartLevel}>
                  ▶️ 开始游戏
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Levels
