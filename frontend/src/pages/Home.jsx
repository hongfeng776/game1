import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { userAPI, signInAPI, endlessAPI } from '../services/api'
import { useGameContext } from '../context/GameContext'
import '../styles/Home.css'

function Home() {
  const [user, setUser] = useState(null)
  const [signInStatus, setSignInStatus] = useState(null)
  const [endlessStatus, setEndlessStatus] = useState(null)
  const [signInLoading, setSignInLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  const { updateUser } = useGameContext()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const userRes = await userAPI.getUser()
      if (userRes.success) {
        setUser(userRes.data)
      }
      
      const signInRes = await signInAPI.getStatus()
      if (signInRes.success) {
        setSignInStatus(signInRes.data)
      }
      
      const endlessRes = await endlessAPI.getStatus()
      if (endlessRes.success) {
        setEndlessStatus(endlessRes.data)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleSignIn = async () => {
    if (!signInStatus?.canSignIn || signInLoading) return
    
    setSignInLoading(true)
    try {
      const res = await signInAPI.signIn()
      if (res.success) {
        setSignInStatus({ ...signInStatus, canSignIn: false, streak: res.data.streak })
        if (res.data.user) {
          updateUser(res.data.user)
          setUser(res.data.user)
        }
        
        const rewardTexts = res.data.rewards.map(r => 
          `${r.item?.icon} ${r.item?.name} ×${r.quantity}`
        ).join(', ')
        showNotification(`签到成功！连续 ${res.data.streak} 天。获得: ${rewardTexts || '金币奖励'}`)
      }
    } catch (error) {
      showNotification(error.response?.data?.message || '签到失败', 'error')
    } finally {
      setSignInLoading(false)
    }
  }

  return (
    <div className="home">
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      <div className="container">
        {signInStatus && (
          <div className="signin-section card">
            <div className="signin-header">
              <div className="signin-title">
                <span className="signin-icon">📅</span>
                <h3>每日签到</h3>
              </div>
              <div className="signin-streak">
                🔥 连续 {signInStatus.streak || 0} 天
              </div>
            </div>
            
            <div className="signin-rewards">
              {signInStatus.todayRewards?.map((reward, idx) => (
                <div key={idx} className="reward-preview">
                  <span className="reward-icon">{reward.itemId?.includes('hp_potion') ? (
                    reward.itemId === 'hp_potion_small' ? '🧪' : 
                    reward.itemId === 'hp_potion_medium' ? '🧴' : '⚗️'
                  ) : reward.itemId === 'attack_boost' ? '💪' :
                    reward.itemId === 'shield' ? '💎' :
                    reward.itemId === 'revive' ? '📜' : '🎁'}</span>
                  <span className="reward-count">×{reward.quantity || (reward.coins && `${reward.coins}💰`)}</span>
                </div>
              ))}
            </div>
            
            <button
              className={`btn ${signInStatus.canSignIn ? 'btn-success' : 'btn-disabled'}`}
              onClick={handleSignIn}
              disabled={!signInStatus.canSignIn || signInLoading}
            >
              {signInLoading ? '签到中...' : (signInStatus.canSignIn ? '✓ 立即签到' : '✓ 今日已签到')}
            </button>
          </div>
        )}

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
          <Link to="/endless" className="btn btn-warning action-card endless-card">
            <div className="action-icon">♾️</div>
            <span>无尽模式</span>
          </Link>
        </div>

        {endlessStatus && (
          <div className="endless-info card">
            <div className="endless-header">
              <div className="endless-icon">♾️</div>
              <h3>无尽模式</h3>
            </div>
            <div className="endless-stats">
              <div className="endless-stat-item">
                <span className="endless-stat-icon">🏆</span>
                <span className="endless-stat-value">{endlessStatus.highestLevel}</span>
                <span className="endless-stat-label">最高层数</span>
              </div>
              <div className="endless-stat-item">
                <span className="endless-stat-icon">🎮</span>
                <span className="endless-stat-value">{endlessStatus.totalRuns}</span>
                <span className="endless-stat-label">挑战次数</span>
              </div>
              {endlessStatus.bestRun && (
                <div className="endless-stat-item">
                  <span className="endless-stat-icon">⏱️</span>
                  <span className="endless-stat-value">{formatTime(endlessStatus.bestRun.timeUsed)}</span>
                  <span className="endless-stat-label">最佳时间</span>
                </div>
              )}
            </div>
            <div className="endless-rewards-info">
              <span>每 {endlessStatus.config.rewardInterval} 关获得里程碑奖励</span>
            </div>
          </div>
        )}

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
