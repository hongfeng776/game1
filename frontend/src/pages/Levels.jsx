import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { levelsAPI, inventoryAPI } from '../services/api'
import '../styles/Levels.css'

const MAX_CARRY_ITEMS = 2;
const DEFAULT_DIFFICULTY = 'normal';

function Levels() {
  const navigate = useNavigate()
  const [levels, setLevels] = useState([])
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [inventory, setInventory] = useState(null)
  const [selectedItems, setSelectedItems] = useState([])
  const [notification, setNotification] = useState(null)
  const [saving, setSaving] = useState(false)
  const [difficulties, setDifficulties] = useState([])
  const [selectedDifficulty, setSelectedDifficulty] = useState(DEFAULT_DIFFICULTY)

  useEffect(() => {
    levelsAPI.getLevels().then(res => {
      if (res.success) {
        setLevels(res.data)
      }
    })
    levelsAPI.getDifficulties().then(res => {
      if (res.success) {
        setDifficulties(res.data)
      }
    })
  }, [])

  const loadInventory = useCallback(async () => {
    try {
      const res = await inventoryAPI.getInventory()
      if (res.success) {
        setInventory(res.data)
        setSelectedItems(res.data.carriedItems || [])
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

  const showNotificationMsg = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 2500)
  }

  const toggleItemSelection = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId))
    } else {
      if (selectedItems.length >= MAX_CARRY_ITEMS) {
        showNotificationMsg(`最多只能携带 ${MAX_CARRY_ITEMS} 个道具`, 'error')
        return
      }
      setSelectedItems([...selectedItems, itemId])
    }
  }

  const handleStartLevel = async () => {
    if (!selectedLevel) return

    setSaving(true)
    try {
      const res = await inventoryAPI.carryItems(selectedItems)
      if (res.success) {
        navigate(`/game/${selectedLevel.id}?difficulty=${selectedDifficulty}`)
      }
    } catch (error) {
      showNotificationMsg(error.response?.data?.message || '保存失败', 'error')
    } finally {
      setSaving(false)
    }
  }

  const renderStars = (count) => {
    return Array(3).fill(0).map((_, i) => (
      <span key={i} className={`star ${i < count ? 'filled' : ''}`}>
        ⭐
      </span>
    ))
  }

  const usableItems = inventory?.items?.filter(inv => inv.quantity > 0) || []

  return (
    <div className="levels-page">
      <div className="container">
        <h1 className="page-title">🎯 选择关卡</h1>

        {notification && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}

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

                <div className="difficulty-section">
                  <h3 className="difficulty-title">⚔️ 选择难度</h3>
                  <div className="difficulty-options">
                    {difficulties.map(diff => (
                      <div
                        key={diff.id}
                        className={`difficulty-option ${selectedDifficulty === diff.id ? 'selected' : ''}`}
                        onClick={() => setSelectedDifficulty(diff.id)}
                        style={{ '--diff-color': diff.color }}
                      >
                        <div className="difficulty-icon">{diff.icon}</div>
                        <div className="difficulty-name">{diff.name}</div>
                        <div className="difficulty-desc">{diff.description}</div>
                        
                        {diff.monsterStrength && (
                          <div className="difficulty-strength">
                            <span className="strength-label">怪物强度:</span>
                            <span className={`strength-value strength-${diff.id}`}>
                              {diff.monsterStrength}
                            </span>
                          </div>
                        )}
                        
                        <div className="difficulty-details">
                          <div className="detail-item">
                            <span className="detail-icon">👾</span>
                            <span>怪物 ×{diff.monsterMultiplier}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-icon">⚡</span>
                            <span>速度 ×{diff.monsterSpeedMultiplier}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-icon">💰</span>
                            <span>金币 ×{diff.coinMultiplier}</span>
                          </div>
                        </div>
                        
                        {diff.monsterStrengthDesc && (
                          <div className="difficulty-tooltip">
                            <div className="tooltip-section">
                              <span className="tooltip-icon">👾</span>
                              <span className="tooltip-text">{diff.monsterStrengthDesc}</span>
                            </div>
                          </div>
                        )}
                        
                        {diff.rewardDesc && (
                          <div className="difficulty-tooltip reward-tooltip">
                            <div className="tooltip-section">
                              <span className="tooltip-icon">🎁</span>
                              <span className="tooltip-text">{diff.rewardDesc}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="inventory-section">
                  <div className="inventory-header-row">
                    <h3 className="inventory-title">🎒 选择携带道具</h3>
                    <span className="selection-count">
                      已选 {selectedItems.length}/{MAX_CARRY_ITEMS}
                    </span>
                  </div>
                  {usableItems.length === 0 ? (
                    <div className="empty-inventory-hint">
                      <p>背包空空如也</p>
                      <p className="hint-text">通关关卡有概率获得道具</p>
                    </div>
                  ) : (
                    <div className="usable-items-grid">
                      {usableItems.map(inv => {
                        const isSelected = selectedItems.includes(inv.itemId)
                        return (
                          <div
                            key={inv.itemId}
                            className={`usable-item rarity-${inv.item?.rarity || 'common'} ${isSelected ? 'selected' : ''}`}
                            onClick={() => toggleItemSelection(inv.itemId)}
                            title={`${inv.item.name}: ${inv.item.description}`}
                          >
                            {isSelected && <div className="selected-badge">✓</div>}
                            <span className="item-icon">{inv.item?.icon}</span>
                            <span className="item-name">{inv.item?.name}</span>
                            <span className="item-count">×{inv.quantity}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {selectedItems.length > 0 && (
                  <div className="selected-items-preview">
                    <span className="preview-label">携带道具:</span>
                    <div className="preview-items">
                      {selectedItems.map(itemId => {
                        const inv = usableItems.find(i => i.itemId === itemId)
                        return (
                          <span key={itemId} className="preview-item">
                            {inv?.item?.icon} {inv?.item?.name}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleStartLevel}
                  disabled={saving}
                >
                  {saving ? '准备中...' : '▶️ 开始游戏'}
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
