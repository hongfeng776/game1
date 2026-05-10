import { useState, useEffect, useCallback } from 'react';
import { heroAPI, userAPI } from '../services/api';
import { useGameContext } from '../context/GameContext';
import { getSkinIcon } from '../config/skinConfig';
import '../styles/Hero.css';

const attributeConfig = {
  hp: {
    name: '生命值',
    icon: '❤️',
    color: '#FF6B6B',
    description: '增加角色最大生命值，让你在陷阱面前更耐抗',
    apiKey: 'maxHp'
  },
  attack: {
    name: '攻击力',
    icon: '⚔️',
    color: '#FF8C42',
    description: '增加角色攻击力，打怪更轻松',
    apiKey: 'attack'
  },
  defense: {
    name: '防御力',
    icon: '🛡️',
    color: '#4ECDC4',
    description: '增加角色防御力，减少受到的伤害',
    apiKey: 'defense'
  }
};

function Hero() {
  const { user, updateUser, refreshUser } = useGameContext();
  const [heroInfo, setHeroInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [notification, setNotification] = useState(null);

  const loadHeroInfo = useCallback(async () => {
    try {
      setLoading(true);
      const res = await heroAPI.getHeroInfo();
      if (res.success) {
        setHeroInfo(res.data);
      }
    } catch (error) {
      console.error('获取角色信息失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHeroInfo();
  }, [loadHeroInfo]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUpgrade = async (attributeType) => {
    if (!heroInfo || heroInfo.attributeLevels[attributeType] >= heroInfo.maxLevel) return;

    const cost = heroInfo.nextUpgradeCosts[attributeType];
    if (heroInfo.coins < cost) {
      showNotification('金币不足！', 'error');
      return;
    }

    try {
      setUpgrading(attributeType);
      const res = await heroAPI.upgradeAttribute(attributeType);
      if (res.success) {
        setHeroInfo(prev => ({
          ...prev,
          coins: res.data.remainingCoins,
          currentAttributes: {
            maxHp: res.data.newAttributes.maxHp,
            attack: res.data.newAttributes.attack,
            defense: res.data.newAttributes.defense,
            speed: res.data.newAttributes.speed
          },
          attributeLevels: {
            ...prev.attributeLevels,
            [attributeType]: res.data.newLevel
          },
          nextUpgradeCosts: res.data.nextUpgradeCosts,
          nextLevelBonuses: res.data.nextLevelBonuses,
          resetInfo: res.data.resetInfo || prev.resetInfo
        }));
        await refreshUser();
        const attrName = attributeConfig[attributeType].name;
        showNotification(`${attrName}升级成功！`, 'success');
      }
    } catch (error) {
      showNotification(error.response?.data?.message || '升级失败', 'error');
    } finally {
      setUpgrading(null);
    }
  };

  const handleReset = async () => {
    if (!heroInfo) return;
    
    if (heroInfo.coins < heroInfo.resetInfo?.resetCost) {
      showNotification('金币不足，无法重置！', 'error');
      return;
    }

    try {
      setResetting(true);
      const res = await heroAPI.resetAttributes();
      if (res.success) {
        setHeroInfo(prev => ({
          ...prev,
          coins: res.data.remainingCoins,
          currentAttributes: {
            maxHp: res.data.newAttributes.maxHp,
            attack: res.data.newAttributes.attack,
            defense: res.data.newAttributes.defense,
            speed: res.data.newAttributes.speed
          },
          attributeLevels: res.data.attributeLevels,
          nextUpgradeCosts: res.data.nextUpgradeCosts,
          nextLevelBonuses: res.data.nextLevelBonuses,
          resetInfo: res.data.resetInfo
        }));
        await refreshUser();
        setShowResetConfirm(false);
        showNotification(`重置成功！返还 ${res.data.refund} 金币`, 'success');
      }
    } catch (error) {
      showNotification(error.response?.data?.message || '重置失败', 'error');
    } finally {
      setResetting(false);
    }
  };

  const getProgressPercent = (currentLevel, maxLevel) => {
    return (currentLevel / maxLevel) * 100;
  };

  const formatValue = (value, type) => {
    if (type === 'speed') {
      return value.toFixed(2);
    }
    return Math.floor(value);
  };

  const getPreviewText = (attrType, nextBonus, nextCost, canAfford) => {
    const config = attributeConfig[attrType];
    if (!canAfford) {
      return `金币不足，需要 ${nextCost} 金币`;
    }
    return `花费 ${nextCost} 金币，${config.name}将提升 +${formatValue(nextBonus, attrType)}`;
  };

  if (loading || !heroInfo) {
    return (
      <div className="hero-page">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  const hasUpgrades = heroInfo.resetInfo?.hasUpgrades;
  const canReset = heroInfo.coins >= (heroInfo.resetInfo?.resetCost || 0);

  return (
    <div className="hero-page">
      <div className="container">
        <h1 className="page-title">🦸 角色养成</h1>

        {notification && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}

        <div className="hero-header-card card">
          <div className="hero-avatar">
            {getSkinIcon(user?.currentSkin)}
          </div>
          <div className="hero-info">
            <h2>{heroInfo.nickname}</h2>
            <div className="hero-level">
              <span className="level-badge">Lv.{heroInfo.level}</span>
            </div>
            <div className="hero-resources">
              <div className="resource-item">
                <span className="resource-icon">💰</span>
                <span className="resource-value">{heroInfo.coins}</span>
              </div>
              <div className="resource-item">
                <span className="resource-icon">💎</span>
                <span className="resource-value">{heroInfo.diamonds}</span>
              </div>
            </div>
          </div>
        </div>

        {hasUpgrades && (
          <div className="reset-section card">
            <div className="reset-info">
              <div className="reset-icon">🔄</div>
              <div className="reset-text">
                <h3>属性重置</h3>
                <p>
                  已花费 <strong>{heroInfo.resetInfo.totalSpent}</strong> 金币升级属性，
                  重置后将返还 <strong className="text-success">{heroInfo.resetInfo.refund}</strong> 金币
                  （50%返还）
                </p>
              </div>
            </div>
            <button
              className={`reset-btn ${canReset ? '' : 'disabled'}`}
              onClick={() => canReset && setShowResetConfirm(true)}
              disabled={!canReset}
            >
              💰 {heroInfo.resetInfo.resetCost} 重置
            </button>
          </div>
        )}

        <div className="attributes-section">
          <h2 className="section-title">📈 属性加点</h2>
          <p className="section-subtitle">花费金币升级属性，等级越高加成越多</p>
          
          <div className="attributes-grid">
            {Object.keys(attributeConfig).map((attrType) => {
              const config = attributeConfig[attrType];
              const currentLevel = heroInfo.attributeLevels[attrType];
              const currentValue = heroInfo.currentAttributes[config.apiKey];
              const nextCost = heroInfo.nextUpgradeCosts[attrType];
              const nextBonus = heroInfo.nextLevelBonuses[attrType];
              const isMaxed = currentLevel >= heroInfo.maxLevel;
              const canAfford = heroInfo.coins >= nextCost;

              return (
                <div key={attrType} className="attribute-card card">
                  <div className="attribute-header">
                    <div className="attribute-icon" style={{ background: config.color + '20' }}>
                      {config.icon}
                    </div>
                    <div className="attribute-meta">
                      <h3>{config.name}</h3>
                      <div className="level-indicator">
                        Lv.{currentLevel}
                        <span className="level-max">/ {heroInfo.maxLevel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="attribute-progress">
                    <div 
                      className="progress-bar"
                      style={{ background: config.color + '30' }}
                    >
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${getProgressPercent(currentLevel, heroInfo.maxLevel)}%`,
                          background: `linear-gradient(90deg, ${config.color}, ${config.color}CC)`
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="attribute-current">
                    <span className="current-label">当前值</span>
                    <span className="current-value" style={{ color: config.color }}>
                      {formatValue(currentValue, attrType)}
                      {!isMaxed && (
                        <span className="next-bonus">
                          +{formatValue(nextBonus, attrType)}
                        </span>
                      )}
                    </span>
                  </div>

                  <p className="attribute-desc">{config.description}</p>

                  {!isMaxed ? (
                    <>
                      <div className={`preview-text ${canAfford ? 'affordable' : 'not-affordable'}`}>
                        {getPreviewText(attrType, nextBonus, nextCost, canAfford)}
                      </div>
                      <button
                        className={`upgrade-btn ${canAfford ? 'affordable' : 'not-affordable'}`}
                        onClick={() => handleUpgrade(attrType)}
                        disabled={!canAfford || upgrading === attrType}
                      >
                        {upgrading === attrType ? (
                          <span className="upgrading">
                            <span className="spin">⚙️</span> 升级中...
                          </span>
                        ) : (
                          <>
                            <span className="cost">💰 {nextCost}</span>
                            <span className="action">升级</span>
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <div className="maxed-badge">
                      🏆 已满级
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="tips-section">
          <h2 className="section-title">💡 养成建议</h2>
          <div className="tips-card card">
            <div className="tip-item">
              <span className="tip-icon">❤️</span>
              <span className="tip-text"><strong>生命值：</strong>新手优先升级，让你在陷阱面前有更多容错空间</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon">🛡️</span>
              <span className="tip-text"><strong>防御力：</strong>与生命值配合，高防御可以大幅减少陷阱伤害</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon">⚔️</span>
              <span className="tip-text"><strong>攻击力：</strong>后期必备，高攻击让你在战斗关卡如虎添翼</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon">🔄</span>
              <span className="tip-text"><strong>属性重置：</strong>花费少量金币可重置所有属性，返还50%已消耗金币</span>
            </div>
          </div>
        </div>

        {showResetConfirm && (
          <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
            <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-icon">🔄</span>
                <h2>确认重置属性</h2>
              </div>
              <div className="modal-body">
                <div className="reset-details">
                  <div className="reset-detail-item">
                    <span className="detail-label">重置费用：</span>
                    <span className="detail-value">💰 {heroInfo.resetInfo.resetCost}</span>
                  </div>
                  <div className="reset-detail-item">
                    <span className="detail-label">已花费金币：</span>
                    <span className="detail-value">💰 {heroInfo.resetInfo.totalSpent}</span>
                  </div>
                  <div className="reset-detail-item refund">
                    <span className="detail-label">返还金币（50%）：</span>
                    <span className="detail-value">💰 +{heroInfo.resetInfo.refund}</span>
                  </div>
                </div>
                <p className="reset-warning">
                  ⚠️ 所有属性等级将回到初始值（Lv.1），此操作无法撤销！
                </p>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowResetConfirm(false)}
                >
                  取消
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={handleReset}
                  disabled={resetting}
                >
                  {resetting ? (
                    <><span className="spin">⚙️</span> 重置中...</>
                  ) : (
                    '确认重置'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Hero;
