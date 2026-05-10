import { useEffect, useState } from 'react'
import { levelsAPI } from '../services/api'
import '../styles/Levels.css'

function Levels() {
  const [levels, setLevels] = useState([])
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    levelsAPI.getLevels().then(res => {
      if (res.success) {
        setLevels(res.data)
      }
    })
  }, [])

  const handleLevelClick = (level) => {
    if (level.isUnlocked) {
      setSelectedLevel(level)
      setShowModal(true)
    }
  }

  const handleStartLevel = () => {
    if (selectedLevel) {
      alert(`开始关卡: ${selectedLevel.name}`)
      setShowModal(false)
    }
  }

  const renderStars = (count) => {
    return Array(3).fill(0).map((_, i) => (
      <span key={i} className={`star ${i < count ? 'filled' : ''}`}>
        ⭐
      </span>
    ))
  }

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
            <div className="modal card" onClick={e => e.stopPropagation()}>
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
