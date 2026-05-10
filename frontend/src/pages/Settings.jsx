import { useEffect, useState } from 'react'
import { settingsAPI } from '../services/api'
import '../styles/Settings.css'

function Settings() {
  const [settings, setSettings] = useState({
    musicVolume: 80,
    sfxVolume: 70,
    language: 'zh-CN',
    notifications: true,
    vibration: true
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    settingsAPI.getSettings().then(res => {
      if (res.success) {
        setSettings(res.data)
      }
    })
  }, [])

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
