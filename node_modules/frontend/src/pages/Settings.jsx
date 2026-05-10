import { useEffect, useState, useCallback } from 'react'
import { settingsAPI, backupAPI, userAPI } from '../services/api'
import { useGameContext } from '../context/GameContext'
import '../styles/Settings.css'

function formatDate(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function Settings() {
  const { updateUser, refreshUser } = useGameContext()
  const [settings, setSettings] = useState({
    musicVolume: 80,
    sfxVolume: 70,
    language: 'zh-CN',
    notifications: true,
    vibration: true
  })
  const [saved, setSaved] = useState(false)
  const [backups, setBackups] = useState([])
  const [loadingBackups, setLoadingBackups] = useState(false)
  const [backupName, setBackupName] = useState('')
  const [creatingBackup, setCreatingBackup] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    settingsAPI.getSettings().then(res => {
      if (res.success) {
        setSettings(res.data)
      }
    })
    loadBackups()
  }, [])

  const loadBackups = useCallback(async () => {
    setLoadingBackups(true)
    try {
      const res = await backupAPI.getList()
      if (res.success) {
        setBackups(res.data)
      }
    } catch (error) {
      console.error('加载备份列表失败:', error)
    } finally {
      setLoadingBackups(false)
    }
  }, [])

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = () => {
    settingsAPI.updateSettings(settings).then(res => {
      if (res.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  const handleCreateBackup = async () => {
    if (creatingBackup) return
    setCreatingBackup(true)
    try {
      const res = await backupAPI.create(backupName.trim() || undefined)
      if (res.success) {
        showMessage('success', '备份创建成功！')
        setBackupName('')
        loadBackups()
      } else {
        showMessage('error', res.error || '创建备份失败')
      }
    } catch (error) {
      console.error('创建备份失败:', error)
      showMessage('error', '创建备份失败')
    } finally {
      setCreatingBackup(false)
    }
  }

  const handleRestoreBackup = async (filename) => {
    if (!window.confirm('确定要恢复此备份吗？当前进度将被覆盖！')) {
      return
    }
    try {
      const res = await backupAPI.restore(filename)
      if (res.success) {
        showMessage('success', '备份恢复成功！')
        const userRes = await userAPI.getUser()
        if (userRes.success) {
          console.log('用户数据已更新:', userRes.data)
          updateUser(userRes.data)
          await refreshUser()
        }
      } else {
        showMessage('error', res.error || '恢复备份失败')
      }
    } catch (error) {
      console.error('恢复备份失败:', error)
      showMessage('error', '恢复备份失败')
    }
  }

  const handleDeleteBackup = async (filename) => {
    if (!window.confirm('确定要删除此备份吗？此操作不可撤销！')) {
      return
    }
    try {
      const res = await backupAPI.delete(filename)
      if (res.success) {
        showMessage('success', '备份已删除')
        loadBackups()
      } else {
        showMessage('error', res.error || '删除备份失败')
      }
    } catch (error) {
      console.error('删除备份失败:', error)
      showMessage('error', '删除备份失败')
    }
  }

  return (
    <div className="settings-page">
      <div className="container">
        <h1 className="page-title">⚙️ 设置</h1>

        {saved && (
          <div className="save-toast">
            ✅ 设置已保存！
          </div>
        )}

        <div className="settings-card card">
          <h2 className="section-header">🔊 声音设置</h2>
          
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">🎵</span>
              <span className="setting-label">背景音乐</span>
              <span className="setting-value">{settings.musicVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.musicVolume}
              onChange={(e) => handleChange('musicVolume', parseInt(e.target.value))}
              className="setting-slider"
            />
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">🔔</span>
              <span className="setting-label">音效音量</span>
              <span className="setting-value">{settings.sfxVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.sfxVolume}
              onChange={(e) => handleChange('sfxVolume', parseInt(e.target.value))}
              className="setting-slider"
            />
          </div>
        </div>

        <div className="settings-card card">
          <h2 className="section-header">🌐 语言设置</h2>
          
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">🌍</span>
              <span className="setting-label">游戏语言</span>
            </div>
            <select
              value={settings.language}
              onChange={(e) => handleChange('language', e.target.value)}
              className="setting-select"
            >
              <option value="zh-CN">简体中文</option>
              <option value="zh-TW">繁体中文</option>
              <option value="en-US">English</option>
              <option value="ja-JP">日本語</option>
            </select>
          </div>
        </div>

        <div className="settings-card card">
          <h2 className="section-header">📱 通知设置</h2>
          
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">📢</span>
              <span className="setting-label">推送通知</span>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => handleChange('notifications', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">📳</span>
              <span className="setting-label">震动反馈</span>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.vibration}
                onChange={(e) => handleChange('vibration', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-card card">
          <h2 className="section-header">ℹ️ 关于</h2>
          
          <div className="about-section">
            <div className="about-item">
              <span className="about-label">游戏版本</span>
              <span className="about-value">v1.0.0</span>
            </div>
            <div className="about-item">
              <span className="about-label">开发者</span>
              <span className="about-value">卡通游戏工作室</span>
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn btn-outline">
              📋 用户协议
            </button>
            <button className="btn btn-outline">
              🔒 隐私政策
            </button>
          </div>
        </div>

        <div className="settings-card card">
          <h2 className="section-header">💾 存档备份</h2>
          
          <div className="backup-create-section">
            <p className="backup-description">
              创建备份可以保护您的游戏进度，最多保留 10 个备份。
            </p>
            <div className="backup-input-group">
              <input
                type="text"
                placeholder="输入备份名称（可选）"
                value={backupName}
                onChange={(e) => setBackupName(e.target.value)}
                className="backup-input"
                maxLength={30}
              />
              <button
                onClick={handleCreateBackup}
                disabled={creatingBackup}
                className="btn btn-primary"
              >
                {creatingBackup ? '创建中...' : '+ 创建备份'}
              </button>
            </div>
          </div>

          <div className="backup-list-section">
            <h3 className="backup-list-title">📂 现有备份 ({backups.length}/10)</h3>
            
            {loadingBackups ? (
              <div className="loading-text">加载中...</div>
            ) : backups.length === 0 ? (
              <div className="empty-backups">
                暂无备份，创建一个备份来保护您的进度吧！
              </div>
            ) : (
              <div className="backup-list">
                {backups.map((backup, index) => (
                  <div key={index} className={`backup-item ${backup.corrupted ? 'backup-corrupted' : ''}`}>
                    <div className="backup-info">
                      <div className="backup-header">
                        <span className="backup-name">
                          {backup.filename.startsWith('backup_') ? '自动备份' : backup.filename.split('_')[0]}
                        </span>
                        {backup.corrupted && <span className="corrupted-badge">⚠️ 已损坏</span>}
                      </div>
                      <div className="backup-details">
                        <span className="backup-detail">
                          📅 {formatDate(backup.createdAt)}
                        </span>
                        {backup.userLevel !== undefined && (
                          <span className="backup-detail">
                            ⭐ Lv.{backup.userLevel}
                          </span>
                        )}
                        {backup.coins !== undefined && (
                          <span className="backup-detail">
                            💰 {backup.coins.toLocaleString()}
                          </span>
                        )}
                        <span className="backup-detail">
                          📁 {formatSize(backup.size)}
                        </span>
                      </div>
                    </div>
                    <div className="backup-actions">
                      <button
                        onClick={() => handleRestoreBackup(backup.filename)}
                        disabled={backup.corrupted}
                        className="btn btn-outline btn-small"
                        title={backup.corrupted ? '备份已损坏，无法恢复' : '恢复此备份'}
                      >
                        恢复
                      </button>
                      <button
                        onClick={() => handleDeleteBackup(backup.filename)}
                        className="btn btn-danger btn-small"
                        title="删除此备份"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {message && (
          <div className={`message-toast message-${message.type}`}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}

        <div className="save-section">
          <button onClick={handleSave} className="btn btn-primary save-btn">
            💾 保存设置
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings
