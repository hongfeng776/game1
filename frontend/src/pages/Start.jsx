import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { levelsAPI } from '../services/api'
import '../styles/Start.css'

function Start() {
  const [levels, setLevels] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    levelsAPI.getLevels().then(res => {
      if (res.success) {
        setLevels(res.data)
      }
    })
  }, [])

  const handleQuickPlay = () => {
    const currentLevel = levels.find(l => l.isUnlocked && !l.isCompleted)
    if (currentLevel) {
      navigate(`/levels?play=${currentLevel.id}`)
    } else {
      navigate('/levels')
    }
  }

  const renderStars = (count) => {
    return Array(3).fill(0).map((_, i) => (
      <span key={i} className={i < count ? 'star filled' : 'star'}>
        ⭐
      </span>
    ))
  }

  return (
    <div className="start-page">
      <div className="container">
        <h1 className="page-title">🎮 开始游戏</h1>

        <div className="quick-play-section">
          <div className="card quick-play-card">
            <div className="quick-play-icon">🚀</div>
            <h2>快速开始</h2>
            <p>从当前进度继续游戏</p>
            <button onClick={handleQuickPlay} className="btn btn-primary">
              ▶️ 开始游戏
            </button>
          </div>
        </div>

        <div className="progress-section card">
          <h3>📊 游戏进度</h3>
          <div className="progress-grid">
            <div className="progress-item">
              <div className="progress-icon">🎯</div>
              <div className="progress-text">
                <div className="progress-value">
                  {levels.filter(l => l.isCompleted).length} / {levels.length}
                </div>
                <div className="progress-label">已完成关卡</div>
              </div>
            </div>
            <div className="progress-item">
              <div className="progress-icon">⭐</div>
              <div className="progress-text">
                <div className="progress-value">
                  {levels.reduce((sum, l) => sum + l.stars, 0)} / {levels.length * 3}
                </div>
                <div className="progress-label">收集星星</div>
              </div>
            </div>
            <div className="progress-item">
              <div className="progress-icon">🔓</div>
              <div className="progress-text">
                <div className="progress-value">
                  {levels.filter(l => l.isUnlocked).length} / {levels.length}
                </div>
                <div className="progress-label">已解锁</div>
              </div>
            </div>
          </div>
        </div>

        <div className="game-modes">
          <h2 className="section-title">🎲 游戏模式</h2>
          <div className="modes-grid">
            <div className="mode-card card">
              <div className="mode-icon">🧩</div>
              <h3>经典模式</h3>
              <p>按部就班，逐关挑战</p>
              <Link to="/levels" className="btn btn-secondary">选择关卡</Link>
            </div>
            <div className="mode-card card">
              <div className="mode-icon">⚡</div>
              <h3>限时挑战</h3>
              <p>限时模式，争分夺秒</p>
              <button className="btn btn-outline" disabled>即将开放</button>
            </div>
            <div className="mode-card card">
              <div className="mode-icon">🏆</div>
              <h3>每日任务</h3>
              <p>完成任务，获取奖励</p>
              <button className="btn btn-outline" disabled>即将开放</button>
            </div>
          </div>
        </div>

        <div className="recent-levels card">
          <h3>🕐 最近关卡</h3>
          <div className="recent-grid">
            {levels.filter(l => l.isCompleted).slice(-3).reverse().map(level => (
              <div key={level.id} className="recent-item">
                <div className="recent-level-id">{level.id}</div>
                <div className="recent-level-name">{level.name}</div>
                <div className="recent-stars">{renderStars(level.stars)}</div>
              </div>
            ))}
            {levels.filter(l => l.isCompleted).length === 0 && (
              <p className="no-progress">还没有完成任何关卡，快去挑战吧！</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Start
