import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { userAPI } from '../services/api'
import '../styles/Home.css'

function Home() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    userAPI.getUser().then(res => {
      if (res.success) {
        setUser(res.data)
      }
    })
  }, [])

  return (
    <div className="home">
      <div className="container">
        <div className="hero">
          <div className="hero-content">
            <h1 className="hero-title">🎮 卡通休闲游戏</h1>
            <p className="hero-subtitle">开启你的冒险之旅！</p>
          </div>
          <div className="hero-decoration">
            <div className="floating-emoji">🌟</div>
            <div className="floating-emoji" style={{ animationDelay: '0.5s' }}>✨</div>
            <div className="floating-emoji" style={{ animationDelay: '1s' }}>🎯</div>
          </div>
        </div>

        <div className="quick-actions">
          <Link to="/start" className="btn btn-primary action-card">
            <div className="action-icon">▶️</div>
            <span>开始游戏</span>
          </Link>
          <Link to="/levels" className="btn btn-secondary action-card">
            <div className="action-icon">🎯</div>
            <span>选择关卡</span>
          </Link>
        </div>

        {user && (
          <div className="user-preview card">
            <div className="user-header">
              <div className="user-avatar">👤</div>
              <div className="user-info">
                <h3>{user.nickname}</h3>
                <p>等级: {user.level}</p>
              </div>
              <Link to="/profile" className="btn btn-outline">查看详情</Link>
            </div>
            <div className="user-stats">
              <div className="stat-item">
                <div className="stat-icon">⭐</div>
                <div className="stat-value">{user.totalStars}</div>
                <div className="stat-label">总星星</div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">🏆</div>
                <div className="stat-value">{user.completedLevels}</div>
                <div className="stat-label">已通关</div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">🎖️</div>
                <div className="stat-value">{user.achievementCount}</div>
                <div className="stat-label">成就</div>
              </div>
            </div>
          </div>
        )}

        <div className="features">
          <div className="feature-card card">
            <div className="feature-icon">🎨</div>
            <h3>精美画面</h3>
            <p>卡通风格，色彩丰富</p>
          </div>
          <div className="feature-card card">
            <div className="feature-icon">⚡</div>
            <h3>轻松上手</h3>
            <p>简单操作，老少皆宜</p>
          </div>
          <div className="feature-card card">
            <div className="feature-icon">🎁</div>
            <h3>丰富奖励</h3>
            <p>每日签到，好礼相送</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
