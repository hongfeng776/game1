import { useState, useEffect } from 'react'
import { signInAPI, userAPI } from '../services/api'
import '../styles/SignIn.css'

function SignIn() {
  const [signInStatus, setSignInStatus] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [supplementing, setSupplementing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [rewardResult, setRewardResult] = useState(null)
  const [showNextMonth, setShowNextMonth] = useState(false)

  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

  const weekRewards = [
    { day: 1, coins: 50, item: { id: 'hp_potion', name: '生命药水', icon: '🧪', quantity: 2 } },
    { day: 2, coins: 100, item: { id: 'hp_potion', name: '生命药水', icon: '🧪', quantity: 3 } },
    { day: 3, coins: 100, item: { id: 'hp_potion', name: '生命药水', icon: '🧪', quantity: 2 } },
    { day: 4, coins: 150, item: { id: 'attack_boost', name: '狂暴药剂', icon: '💪', quantity: 1 } },
    { day: 5, coins: 200, item: { id: 'hp_potion', name: '生命药水', icon: '🧪', quantity: 2 } },
    { day: 6, coins: 200, item: { id: 'attack_boost', name: '狂暴药剂', icon: '💪', quantity: 1 } },
    { day: 7, coins: 500, item: { id: 'revive_scroll', name: '复活卷轴', icon: '📜', quantity: 1 } }
  ]

  useEffect(() => {
    loadSignInStatus()
  }, [])

  const loadSignInStatus = async () => {
    try {
      setLoading(true)
      const [statusRes, userRes] = await Promise.all([
        signInAPI.getStatus(),
        userAPI.getUser()
      ])
      if (statusRes.success) {
        setSignInStatus(statusRes.data)
      }
      if (userRes.success) {
        setUser(userRes.data)
      }
    } catch (error) {
      console.error('加载签到状态失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async () => {
    if (!signInStatus?.canSignIn || signingIn) return

    try {
      setSigningIn(true)
      const res = await signInAPI.signIn()
      if (res.success) {
        setRewardResult({
          streak: res.data.streak,
          rewards: res.data.rewards,
          earnedCoins: res.data.coins,
          totalCoins: res.data.user.coins,
          isSupplemental: false,
          isSpecialReward: res.data.isSpecialReward
        })
        setUser(res.data.user)
        setShowModal(true)
        
        const newStatus = await signInAPI.getStatus()
        if (newStatus.success) {
          setSignInStatus(newStatus.data)
        }
      }
    } catch (error) {
      console.error('签到失败:', error)
      alert(error.response?.data?.message || '签到失败，请重试')
    } finally {
      setSigningIn(false)
    }
  }

  const handleSupplementalSignIn = async () => {
    if (!signInStatus?.supplemental?.canSupplemental || supplementing) return

    try {
      setSupplementing(true)
      const res = await signInAPI.supplementalSignIn()
      if (res.success) {
        setRewardResult({
          streak: res.data.streak,
          previousStreak: res.data.previousStreak,
          daysRecovered: res.data.daysRecovered,
          rewards: res.data.rewards,
          earnedCoins: res.data.coins,
          totalCoins: res.data.user.coins,
          isSupplemental: true,
          isSpecialReward: res.data.isSpecialReward
        })
        setUser(res.data.user)
        setShowModal(true)
        
        const newStatus = await signInAPI.getStatus()
        if (newStatus.success) {
          setSignInStatus(newStatus.data)
        }
      }
    } catch (error) {
      console.error('补签失败:', error)
      alert(error.response?.data?.message || '补签失败，请重试')
    } finally {
      setSupplementing(false)
    }
  }

  const isDaySigned = (day) => {
    if (!signInStatus) return false
    const currentStreak = signInStatus.streak
    if (signInStatus.canSignIn) {
      return day <= currentStreak
    }
    return day <= currentStreak
  }

  const isToday = (day) => {
    if (!signInStatus) return false
    const currentStreak = signInStatus.streak
    const nextDay = signInStatus.canSignIn ? currentStreak + 1 : currentStreak
    const todayInWeek = ((nextDay - 1) % 7) + 1
    return day === todayInWeek
  }

  const getDayInCycle = (day) => {
    if (!signInStatus) return day
    const currentStreak = signInStatus.streak
    const nextDay = signInStatus.canSignIn ? currentStreak + 1 : currentStreak
    const todayInWeek = ((nextDay - 1) % 7) + 1
    const offset = todayInWeek - 1
    return ((day - 1 + offset) % 7) + 1
  }

  if (loading) {
    return (
      <div className="signin-page">
        <div className="container">
          <div className="loading">加载中...</div>
        </div>
      </div>
    )
  }

  const nextMonthRewards = signInStatus?.nextMonthRewards || []

  return (
    <div className="signin-page">
      <div className="container">
        <h1 className="page-title">📅 每日签到</h1>

        {user && (
          <div className="user-resources card">
            <div className="resource-item">
              <span className="resource-icon">💰</span>
              <span className="resource-value">{user.coins}</span>
              <span className="resource-label">金币</span>
            </div>
            <div className="resource-item">
              <span className="resource-icon">🔥</span>
              <span className="resource-value">{signInStatus?.streak || 0}</span>
              <span className="resource-label">连续签到</span>
            </div>
          </div>
        )}

        <div className={`streak-card card ${!signInStatus?.canSignIn && !signInStatus?.supplemental?.canSupplemental ? 'signed-today' : ''}`}>
          <div className="streak-info">
            <div className="streak-title">🔥 连续签到</div>
            <div className="streak-count">
              <span className="streak-number">{signInStatus?.streak || 0}</span>
              <span className="streak-unit">天</span>
            </div>
          </div>
          <div className="streak-action">
            {signInStatus?.canSignIn ? (
              <button 
                className={`signin-btn ${signingIn ? 'loading' : ''}`}
                onClick={handleSignIn}
                disabled={signingIn}
              >
                {signingIn ? '签到中...' : '立即签到'}
              </button>
            ) : signInStatus?.supplemental?.canSupplemental ? (
              <button 
                className={`supplemental-btn ${supplementing ? 'loading' : ''}`}
                onClick={handleSupplementalSignIn}
                disabled={supplementing}
              >
                {supplementing ? '补签中...' : `🆓 免费补签 (${signInStatus.supplemental.freeCount}/${signInStatus.supplemental.maxFreeCount})`}
              </button>
            ) : (
              <div className="signed-status-wrapper">
                <div className="signed-status">
                  <span className="check-icon">✓</span>
                  今日已签到
                </div>
                <button 
                  className="signed-disabled-btn"
                  disabled
                >
                  已完成
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="rewards-section">
          <h2 className="section-title">🎁 签到奖励</h2>
          <div className="rewards-grid">
            {weekRewards.map((reward, index) => {
              const actualDay = getDayInCycle(reward.day)
              const isSigned = isDaySigned(reward.day)
              const isCurrent = isToday(reward.day)
              const isSpecial = reward.day === 3 || reward.day === 7

              return (
                <div
                  key={reward.day}
                  className={`reward-card card ${
                    isSigned ? 'signed' : ''
                  } ${isCurrent ? 'today' : ''} ${isSpecial ? 'special' : ''}`}
                >
                  <div className="reward-day">
                    <span>{weekDays[(index + 6) % 7]}</span>
                    {isSigned && <span className="check-icon">✓</span>}
                  </div>
                  <div className="reward-content">
                    {reward.item && (
                      <div className="reward-item">
                        <span className="item-icon">{reward.item.icon}</span>
                        <span className="item-qty">x{reward.item.quantity}</span>
                      </div>
                    )}
                    <div className="reward-coins">
                      <span>💰</span>
                      <span>{reward.coins}</span>
                    </div>
                  </div>
                  {isCurrent && signInStatus?.canSignIn && (
                    <div className="today-badge">今日</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="next-month-section">
          <div className="section-header card">
            <h2 className="section-title">🎊 下个月奖励预览</h2>
            <button 
              className={`toggle-btn ${showNextMonth ? 'expanded' : ''}`}
              onClick={() => setShowNextMonth(!showNextMonth)}
            >
              {showNextMonth ? '收起 ▲' : '展开查看更多奖励 ▼'}
            </button>
          </div>
          
          {showNextMonth && (
            <div className="next-month-rewards card">
              <p className="next-month-intro">
                坚持签到，下个月更有丰厚奖励等着你！
              </p>
              <div className="next-month-grid">
                {nextMonthRewards.map((reward) => (
                  <div key={reward.day} className="next-month-item">
                    <div className="next-month-day">
                      <span className="day-badge">第{reward.day}天</span>
                    </div>
                    <div className="next-month-content">
                      {reward.item && (
                        <div className="next-month-item-reward">
                          <span className="item-icon">{reward.item.icon}</span>
                          <span className="item-name">{reward.item.name}</span>
                          <span className="item-qty">x{reward.item.quantity}</span>
                        </div>
                      )}
                      <div className="next-month-coins">
                        <span>💰</span>
                        <span>+{reward.coins}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="encourage-text">
                💪 保持连续签到，解锁更多稀有奖励！
              </div>
            </div>
          )}
        </div>

        <div className="info-section card">
          <h3 className="info-title">📋 签到规则</h3>
          <ul className="info-list">
            <li>每日可签到一次，连续签到可获得更多奖励</li>
            <li>第 3 天签到可获得额外金币加成</li>
            <li>第 7 天签到可获得稀有道具：复活卷轴</li>
            <li>每月可免费补签 1 次，补签后可恢复连续签到</li>
            <li>断签后将从第 1 天重新计算</li>
          </ul>
        </div>

        {showModal && rewardResult && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className={`modal-content card ${rewardResult.isSpecialReward ? 'special-reward' : ''}`} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                {rewardResult.isSpecialReward && (
                  <div className="special-badge">
                    ✨ 特殊奖励
                  </div>
                )}
                <h2>🎉 {rewardResult.isSupplemental ? '补签成功' : '签到成功'}</h2>
                {rewardResult.isSupplemental && (
                  <div className="supplemental-tag">🆓 免费补签</div>
                )}
              </div>
              <div className="modal-body">
                {rewardResult.isSpecialReward && (
                  <div className="special-celebration">
                    <span className="celebration-icon">🎊</span>
                    <span className="celebration-text">连续签到 {rewardResult.streak} 天达成！</span>
                    <span className="celebration-icon">🎊</span>
                  </div>
                )}
                {rewardResult.isSupplemental && rewardResult.daysRecovered > 0 && (
                  <div className="recover-info">
                    <span>🔥 恢复连续签到 +{rewardResult.daysRecovered} 天</span>
                  </div>
                )}
                <div className={`streak-result ${rewardResult.isSpecialReward ? 'special-streak' : ''}`}>
                  <span>连续签到</span>
                  <span className="streak-result-number">{rewardResult.streak}</span>
                  <span>天</span>
                </div>
                <div className="rewards-result">
                  <h3>获得奖励</h3>
                  <div className="rewards-list">
                    {rewardResult.rewards.map((reward, index) => (
                      <div key={index} className={`reward-item-result ${rewardResult.isSpecialReward ? 'special-item' : ''}`}>
                        <span className="reward-icon">
                          {reward.item?.icon || '🎁'}
                        </span>
                        <span className="reward-name">{reward.item?.name}</span>
                        <span className="reward-quantity">x{reward.quantity}</span>
                      </div>
                    ))}
                    {rewardResult.earnedCoins > 0 && (
                      <div className={`reward-item-result coins ${rewardResult.isSpecialReward ? 'special-coins' : ''}`}>
                        <span className="reward-icon">💰</span>
                        <span className="reward-name">金币</span>
                        <span className="reward-quantity">+{rewardResult.earnedCoins}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <button 
                className={`modal-close-btn ${rewardResult.isSpecialReward ? 'special-btn' : ''}`}
                onClick={() => setShowModal(false)}
              >
                {rewardResult.isSpecialReward ? '太棒了！' : '确定'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SignIn
