import { useEffect, useState } from 'react'
import { userAPI } from '../services/api'
import '../styles/Profile.css'

function Profile() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    userAPI.getUser().then(res => {
      if (res.success) {
        setUser(res.data)
      }
    })
  }, [])

  return (
    <div className="profile-page">
      <div className="container">
        <h1 className="page-title">👤 个人中心</h1>

        {user && (
          <>
            <div className="profile-card card">
              <div className="profile-header">
                <div className="profile-avatar">
                  👤
                </div>
                <div className="profile-info">
                  <h2>{user.nickname}</h2>
                  <div className="level-badge">
                    Lv.{user.level}
                  </div>
                </div>
              </div>
              
              <div className="exp-section">
                <div className="exp-header">
                  <span>经验值</span>
                  <span>{user.experience} / {user.nextLevelExp}</span>
                </div>
                <div className="exp-bar">
                  <div 
                    className="exp-progress" 
                    style={{ width: `${(user.experience / user.nextLevelExp) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="resources-section">
              <h2 className="section-title">💰 资源</h2>
              <div className="resources-grid">
                <div className="resource-card card">
                  <div className="resource-icon">💰</div>
                  <div className="resource-info">
                    <div className="resource-name">金币</div>
                    <div className="resource-value">{user.coins}</div>
                  </div>
                </div>
                <div className="resource-card card">
                  <div className="resource-icon">💎</div>
                  <div className="resource-info">
                    <div className="resource-name">钻石</div>
                    <div className="resource-value">{user.diamonds}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="stats-section">
              <h2 className="section-title">📊 游戏统计</h2>
              <div className="stats-grid">
                <div className="stat-card card">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-value">{user.totalStars}</div>
                  <div className="stat-label">总星星</div>
                </div>
                <div className="stat-card card">
                  <div className="stat-icon">🎯</div>
                  <div className="stat-value">{user.completedLevels}</div>
                  <div className="stat-label">已通关</div>
                </div>
                <div className="stat-card card">
                  <div className="stat-icon">🏆</div>
                  <div className="stat-value">{user.achievementCount}</div>
                  <div className="stat-label">成就数</div>
                </div>
              </div>
            </div>

            <div className="menu-section">
              <div className="menu-card card">
                <div className="menu-item">
                  <span className="menu-icon">🎁</span>
                  <span className="menu-text">我的背包</span>
                  <span className="menu-arrow">›</span>
                </div>
                <div className="menu-item">
                  <span className="menu-icon">🏅</span>
                  <span className="menu-text">成就系统</span>
                  <span className="menu-arrow">›</span>
                </div>
                <div className="menu-item">
                  <span className="menu-icon">📈</span>
                  <span className="menu-text">排行榜</span>
                  <span className="menu-arrow">›</span>
                </div>
                <div className="menu-item">
                  <span className="menu-icon">🎫</span>
                  <span className="menu-text">兑换中心</span>
                  <span className="menu-arrow">›</span>
                </div>
                <div className="menu-item">
                  <span className="menu-icon">❓</span>
                  <span className="menu-text">帮助中心</span>
                  <span className="menu-arrow">›</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Profile
