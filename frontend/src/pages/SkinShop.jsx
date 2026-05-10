import { useState, useEffect, useCallback, useRef } from 'react';
import { skinAPI } from '../services/api';
import { useGameContext } from '../context/GameContext';
import '../styles/SkinShop.css';

const rarityConfig = {
  common: { name: '普通', color: '#9E9E9E', bgColor: '#FAFAFA', borderColor: '#9E9E9E' },
  rare: { name: '稀有', color: '#9C27B0', bgColor: '#F3E5F5', borderColor: '#9C27B0' }
};

function SkinShop() {
  const { user, refreshUser, updateUser } = useGameContext();
  const [skinsData, setSkinsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSkin, setSelectedSkin] = useState(null);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('common');
  const [buying, setBuying] = useState(false);
  const [wearing, setWearing] = useState(false);
  
  const navigationRef = useRef({ lastTime: 0, isAnimating: false });

  const loadSkins = useCallback(async () => {
    try {
      setLoading(true);
      const res = await skinAPI.getSkins();
      if (res.success) {
        setSkinsData(res.data);
      }
    } catch (error) {
      console.error('获取皮肤列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSkins();
  }, [loadSkins]);

  useEffect(() => {
    setSelectedSkin(null);
  }, [activeTab]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleBuySkin = async (skinId, skin) => {
    if (buying) return;
    
    if (skin.type !== 'common') {
      showNotification('稀有皮肤无法购买，需通过签到解锁！', 'error');
      return;
    }
    
    if (skin.unlocked) {
      showNotification('您已拥有该皮肤！', 'error');
      return;
    }

    try {
      setBuying(true);
      const res = await skinAPI.buySkin(skinId);
      if (res.success) {
        if (res.data.user) {
          updateUser(res.data.user);
        }
        await loadSkins();
        showNotification(`成功购买 ${skin.name}！`, 'success');
        setSelectedSkin(null);
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || '购买失败';
      showNotification(errMsg, 'error');
    } finally {
      setBuying(false);
    }
  };

  const handleWearSkin = async (skinId, skin) => {
    if (wearing) return;

    try {
      setWearing(true);
      const res = await skinAPI.wearSkin(skinId);
      if (res.success) {
        if (res.data.user) {
          updateUser(res.data.user);
        }
        await loadSkins();
        showNotification(`已穿戴 ${skin.name}！`, 'success');
        setSelectedSkin(null);
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || '穿戴失败';
      showNotification(errMsg, 'error');
    } finally {
      setWearing(false);
    }
  };

  const getSkinRarity = (rarity) => rarityConfig[rarity] || rarityConfig.common;

  const currentTabSkins = skinsData ? (activeTab === 'common' ? skinsData.commonSkins : skinsData.rareSkins) : [];

  const navigateSkin = useCallback((direction) => {
    const now = Date.now();
    if (now - navigationRef.current.lastTime < 200) return;
    if (navigationRef.current.isAnimating) return;
    
    navigationRef.current.lastTime = now;
    navigationRef.current.isAnimating = true;

    if (!selectedSkin || currentTabSkins.length === 0) {
      navigationRef.current.isAnimating = false;
      return;
    }

    const currentIndex = currentTabSkins.findIndex(skin => skin.id === selectedSkin.id);
    
    let targetSkin;
    if (currentIndex === -1) {
      targetSkin = currentTabSkins[0];
    } else {
      let newIndex = currentIndex + direction;
      if (newIndex < 0) {
        newIndex = currentTabSkins.length - 1;
      } else if (newIndex >= currentTabSkins.length) {
        newIndex = 0;
      }
      targetSkin = currentTabSkins[newIndex];
    }

    setSelectedSkin(targetSkin);
    
    setTimeout(() => {
      navigationRef.current.isAnimating = false;
    }, 150);
  }, [selectedSkin, currentTabSkins]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedSkin(null);
  };

  if (loading || !skinsData) {
    return (
      <div className="skin-shop-page">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="skin-shop-page">
      <div className="container">
        <h1 className="page-title">🎨 角色皮肤商店</h1>

        {notification && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}

        <div className="shop-header card">
          <div className="shop-stats">
            <div className="stat-item">
              <span className="stat-icon">💰</span>
              <span className="stat-value">{skinsData.userCoins}</span>
              <span className="stat-label">金币</span>
            </div>
            <div className="stat-divider">|</div>
            <div className="stat-item">
              <span className="stat-icon">👕</span>
              <span className="stat-value">{skinsData.unlockedCount}/{skinsData.totalCount}</span>
              <span className="stat-label">已解锁</span>
            </div>
          </div>
          
          <div className="tabs-container">
            <button 
              className={`tab-btn ${activeTab === 'common' ? 'active' : ''}`}
              onClick={() => handleTabChange('common')}
            >
              💰 普通皮肤
            </button>
            <button 
              className={`tab-btn ${activeTab === 'rare' ? 'active' : ''}`}
              onClick={() => handleTabChange('rare')}
            >
              🌟 稀有皮肤
            </button>
          </div>
        </div>

        {activeTab === 'rare' && (
          <div className="rare-tips card">
            <div className="rare-tips-content">
              <span className="tips-icon">📅</span>
              <div className="tips-text">
                <p><strong>稀有皮肤</strong>通过<strong>连续签到</strong>解锁</p>
                <p>保持连续签到，解锁更多稀有皮肤！</p>
              </div>
            </div>
            {user && (
              <div className="streak-info">
                <span className="streak-badge">🔥 当前连续签到: {user.signInStreak} 天</span>
              </div>
            )}
          </div>
        )}

        <div className="skins-grid">
          {currentTabSkins.map((skin) => {
            const rarity = getSkinRarity(skin.rarity);
            const isSelected = selectedSkin?.id === skin.id;
            const canBuy = !skin.unlocked && skin.type === 'common';
            const canWear = skin.unlocked && !skin.isWearing;

            return (
              <div
                key={skin.id}
                className={`skin-card ${isSelected ? 'selected' : ''} ${skin.isWearing ? 'wearing' : ''} ${!skin.unlocked ? 'locked' : ''}`}
                style={{
                  borderColor: skin.unlocked ? rarity.borderColor : '#ccc',
                  background: skin.isSpecial && skin.unlocked ? 
                    (skin.color.includes('gradient') ? skin.color : `linear-gradient(135deg, ${skin.color}22, ${skin.color}44)`)
                    : rarity.bgColor
                }}
                onClick={() => setSelectedSkin(isSelected ? null : skin)}
              >
                {skin.isSpecial && (
                  <div className="special-badge">⭐ 稀有</div>
                )}
                
                {!skin.unlocked && (
                  <div className="locked-overlay">
                    <span className="locked-icon">🔒</span>
                  </div>
                )}

                {skin.isWearing && (
                  <div className="wearing-badge">✅ 穿戴中</div>
                )}

                <div 
                  className="skin-preview"
                  style={{
                    boxShadow: skin.unlocked ? `0 0 20px ${skin.color}66` : 'none'
                  }}
                >
                  <span className="skin-icon">{skin.icon}</span>
                </div>

                <div className="skin-info">
                  <h3 className="skin-name" style={{ color: rarity.color }}>
                    {skin.name}
                  </h3>
                  <span className="skin-rarity" style={{ color: rarity.color }}>
                    {rarity.name}
                  </span>
                </div>

                {skin.type === 'common' && !skin.unlocked && (
                  <div className="skin-price">
                    <span className="price-icon">💰</span>
                    <span className="price-value" style={{ 
                      color: skinsData.userCoins >= skin.price ? '#4CAF50' : '#f44336' 
                    }}>
                      {skin.price}
                    </span>
                  </div>
                )}

                {skin.type === 'common' && skin.unlocked && (
                  <div className="owned-badge">✓ 已拥有</div>
                )}

                {skin.type === 'rare' && !skin.unlocked && skin.unlockProgress && (
                  <div className="unlock-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${skin.unlockProgress.percentage}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      {skin.unlockProgress.current}/{skin.unlockProgress.required} 天
                    </span>
                  </div>
                )}

                {skin.type === 'rare' && !skin.unlocked && !skin.unlockProgress && (
                  <div className="unlock-requirement">
                    需要连续签到 {skin.requiredSignInDays} 天
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {selectedSkin && (
          <div className="skin-detail-overlay" onClick={() => setSelectedSkin(null)}>
            <div className="skin-detail-card card" onClick={e => e.stopPropagation()}>
              <div className="detail-header">
                <button 
                  className={`nav-btn nav-btn-left ${navigationRef.current.isAnimating ? 'disabled' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateSkin(-1);
                  }}
                  disabled={navigationRef.current.isAnimating}
                >
                  ◀
                </button>
                
                <div 
                  className="detail-preview"
                  style={{
                    background: selectedSkin.color.includes('gradient') 
                      ? selectedSkin.color 
                      : `linear-gradient(135deg, ${selectedSkin.color}22, ${selectedSkin.color}44)`,
                    boxShadow: `0 0 30px ${selectedSkin.color}88`
                  }}
                >
                  <span className="detail-icon">{selectedSkin.icon}</span>
                  {selectedSkin.unlocked && (
                    <div className="unlocked-badge">✓ 已解锁</div>
                  )}
                </div>
                
                <button 
                  className={`nav-btn nav-btn-right ${navigationRef.current.isAnimating ? 'disabled' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateSkin(1);
                  }}
                  disabled={navigationRef.current.isAnimating}
                >
                  ▶
                </button>
              </div>

              <div className="detail-indicators">
                {currentTabSkins.map((skin, index) => (
                  <span 
                    key={skin.id}
                    className={`indicator ${selectedSkin.id === skin.id ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!navigationRef.current.isAnimating) {
                        setSelectedSkin(skin);
                      }
                    }}
                  ></span>
                ))}
              </div>

              <div className="detail-info">
                <h2>{selectedSkin.name}</h2>
                <span className="detail-rarity" style={{ color: getSkinRarity(selectedSkin.rarity).color }}>
                  {getSkinRarity(selectedSkin.rarity).name}
                  {selectedSkin.isSpecial && ' ⭐'}
                </span>
              </div>

              <div className="detail-description">
                <p>{selectedSkin.description}</p>
              </div>

              <div className="detail-status">
                <div className="status-item">
                  <span className="status-label">状态:</span>
                  <span className={`status-value ${selectedSkin.unlocked ? 'unlocked' : 'locked'}`}>
                    {selectedSkin.unlocked ? '✓ 已解锁' : '🔒 未解锁'}
                  </span>
                </div>
                
                {selectedSkin.isWearing && (
                  <div className="status-item wearing-status">
                    <span className="status-label">穿戴:</span>
                    <span className="status-value wearing">✅ 当前穿戴中</span>
                  </div>
                )}

                {selectedSkin.type === 'common' && !selectedSkin.unlocked && (
                  <div className="status-item price-status">
                    <span className="status-label">价格:</span>
                    <span className="status-value" style={{ 
                      color: skinsData.userCoins >= selectedSkin.price ? '#4CAF50' : '#f44336' 
                    }}>
                      💰 {selectedSkin.price} 金币
                      {skinsData.userCoins < selectedSkin.price && 
                        <span className="insufficient-funds"> (余额不足)</span>
                      }
                    </span>
                  </div>
                )}

                {selectedSkin.type === 'rare' && !selectedSkin.unlocked && selectedSkin.unlockProgress && (
                  <div className="status-item progress-status">
                    <span className="status-label">解锁进度:</span>
                    <div className="inline-progress">
                      <div className="inline-progress-bar">
                        <div 
                          className="inline-progress-fill"
                          style={{ width: `${selectedSkin.unlockProgress.percentage}%` }}
                        ></div>
                      </div>
                      <span className="inline-progress-text">
                        {selectedSkin.unlockProgress.current}/{selectedSkin.unlockProgress.required} 天
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="detail-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => setSelectedSkin(null)}
                >
                  关闭
                </button>
                
                {selectedSkin.type === 'common' && !selectedSkin.unlocked && (
                  <button
                    className={`btn btn-primary ${skinsData.userCoins < selectedSkin.price ? 'disabled' : ''}`}
                    onClick={() => handleBuySkin(selectedSkin.id, selectedSkin)}
                    disabled={skinsData.userCoins < selectedSkin.price || buying}
                  >
                    {buying ? '购买中...' : `💰 购买 (${selectedSkin.price}金币)`}
                  </button>
                )}

                {selectedSkin.type === 'common' && selectedSkin.unlocked && !selectedSkin.isWearing && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleWearSkin(selectedSkin.id, selectedSkin)}
                    disabled={wearing}
                  >
                    {wearing ? '穿戴中...' : '👕 穿戴'}
                  </button>
                )}

                {selectedSkin.type === 'common' && selectedSkin.unlocked && selectedSkin.isWearing && (
                  <div className="btn btn-disabled">✅ 已穿戴</div>
                )}

                {selectedSkin.type === 'rare' && selectedSkin.unlocked && !selectedSkin.isWearing && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleWearSkin(selectedSkin.id, selectedSkin)}
                    disabled={wearing}
                  >
                    {wearing ? '穿戴中...' : '👕 穿戴'}
                  </button>
                )}

                {selectedSkin.type === 'rare' && selectedSkin.unlocked && selectedSkin.isWearing && (
                  <div className="btn btn-disabled">✅ 已穿戴</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SkinShop;