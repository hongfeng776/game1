import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { levelsAPI, inventoryAPI } from '../services/api';
import { useGame } from '../hooks/useGame';
import { useGameContext } from '../context/GameContext';
import GameMap from '../components/GameMap';
import '../styles/GamePlay.css';

const ITEM_DISPLAY = {
  hp_potion: { name: '生命药水', icon: '🧪' },
  attack_boost: { name: '狂暴药剂', icon: '💪' },
  revive_scroll: { name: '复活卷轴', icon: '📜' }
};

const MAX_CARRY_ITEMS = 2;

function GamePlay() {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const [mapData, setMapData] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [inventory, setInventory] = useState(null);
  const [carriedItems, setCarriedItems] = useState([]);
  const [showInventory, setShowInventory] = useState(false);
  const [notification, setNotification] = useState(null);
  const [itemEffects, setItemEffects] = useState([]);
  const { user, updateUser } = useGameContext();
  const gameEndedRef = useRef(false);
  const pendingItemRequestsRef = useRef(new Set());
  const effectIdCounter = useRef(0);

  const game = useGame(mapData, user);

  useEffect(() => {
    gameEndedRef.current = false;
    loadGame();
    loadInventory();
  }, [levelId]);

  const loadGame = useCallback(async () => {
    try {
      const mapRes = await levelsAPI.getLevelMap(levelId);
      if (mapRes.success) setMapData(mapRes.data);
    } catch (error) {
      console.error('加载游戏失败:', error);
    }
  }, [levelId]);

  const loadInventory = useCallback(async () => {
    try {
      const res = await inventoryAPI.getInventory();
      if (res.success) {
        setInventory(res.data.items);
        setCarriedItems(res.data.carriedItems || []);
      }
    } catch (error) {
      console.error('加载背包失败:', error);
    }
  }, []);

  useEffect(() => {
    if (game.isGameOver && !gameEndedRef.current) {
      gameEndedRef.current = true;
      handleGameEnd();
    }
  }, [game.isGameOver]);

  const showNotificationMsg = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 2000);
  };

  const showItemEffect = (effectType, effectValue, itemIcon) => {
    const effectId = effectIdCounter.current++;
    const newEffect = {
      id: effectId,
      type: effectType,
      value: effectValue,
      icon: itemIcon
    };
    
    setItemEffects(prev => [...prev, newEffect]);
    
    setTimeout(() => {
      setItemEffects(prev => prev.filter(e => e.id !== effectId));
    }, 1500);
  };

  const handleGameEnd = async () => {
    try {
      if (game.isWin) {
        const result = await levelsAPI.completeLevel(parseInt(levelId), game.timeUsed);
        if (result.success) {
          setResultData(result.data);
          setShowResult(true);
          if (result.data.user) {
            updateUser(result.data.user);
          }
        }
      } else {
        const result = await levelsAPI.failLevel(parseInt(levelId));
        setResultData({ win: false });
        setShowResult(true);
        if (result.data?.user) {
          updateUser(result.data.user);
        }
      }
    } catch (error) {
      console.error('游戏结束处理失败:', error);
    }
  };

  const handleUseItem = async (itemId, item) => {
    if (!inventory || !itemId) return;

    if (pendingItemRequestsRef.current.has(itemId)) {
      return;
    }

    const invItem = inventory.find(i => i.itemId === itemId);
    if (!invItem || invItem.quantity <= 0) {
      showNotificationMsg('道具数量不足！', 'error');
      return;
    }

    if (item.category === 'heal' && game.hp >= game.maxHp) {
      showNotificationMsg('生命值已满！', 'error');
      return;
    }

    if (item.category === 'revive' && game.wasRevived) {
      showNotificationMsg('本局已使用过复活！', 'error');
      return;
    }

    pendingItemRequestsRef.current.add(itemId);

    try {
      const display = ITEM_DISPLAY[itemId];
      
      const effect = game.useItem(itemId);
      if (!effect.success) {
        showNotificationMsg(effect.message || '使用失败', 'error');
        return;
      }

      const res = await inventoryAPI.useItem(itemId, 1);
      if (res.success) {
        if (effect.type === 'heal') {
          const healPercent = Math.round((effect.healAmount / game.maxHp) * 100);
          showItemEffect('heal', healPercent, display.icon);
          showNotificationMsg(`使用了 ${display.name}，恢复了 ${effect.healAmount} 点生命值！`, 'success');
        } else if (effect.type === 'buff') {
          const buffText = `攻击 +${Math.round(effect.buff.attackBoost * 100)}%`;
          showItemEffect('buff', buffText, display.icon);
          showNotificationMsg(`使用了 ${display.name}，获得增益效果！`, 'success');
        } else if (effect.type === 'revive') {
          showItemEffect('revive', '就绪', display.icon);
          showNotificationMsg(`已激活 ${display.name}，死亡时自动复活！`, 'success');
        }
        await loadInventory();
      } else {
        showNotificationMsg(res.message || '使用失败', 'error');
      }
    } catch (error) {
      showNotificationMsg(error.response?.data?.message || '使用失败', 'error');
    } finally {
      pendingItemRequestsRef.current.delete(itemId);
    }
  };

  const handleRevive = async () => {
    try {
      const reviveItem = inventory?.find(i => i.itemId === 'revive_scroll' && i.quantity > 0);
      if (reviveItem) {
        await inventoryAPI.useItem('revive_scroll', 1);
        await loadInventory();
        showNotificationMsg('复活成功！', 'success');
        gameEndedRef.current = false;
      }
    } catch (error) {
      console.error('复活失败:', error);
    }
  };

  const hasReviveItem = inventory?.some(i => i.itemId === 'revive_scroll' && i.quantity > 0) && !game.wasRevived;
  const hasReviveCarried = carriedItems.includes('revive_scroll') && inventory?.some(i => i.itemId === 'revive_scroll' && i.quantity > 0) && !game.wasRevived;

  useEffect(() => {
    game.setExternalHandlers({
      onRevive: handleRevive,
      hasReviveItem: hasReviveItem
    });
  }, [hasReviveItem]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderStars = (count) => {
    return Array(3).fill(0).map((_, i) => (
      <span key={i} className={`result-star ${i < count ? 'filled' : ''}`}>⭐</span>
    ));
  };

  const handleRetry = () => {
    gameEndedRef.current = false;
    setShowResult(false);
    setResultData(null);
    game.resetGame();
    loadInventory();
  };

  const handleBackToLevels = () => {
    navigate('/levels');
  };

  const handleNextLevel = () => {
    const nextLevelId = parseInt(levelId) + 1;
    navigate(`/game/${nextLevelId}`);
  };

  const getCarriedItemsList = () => {
    if (!inventory || !carriedItems) return [];
    return carriedItems
      .map(itemId => inventory.find(inv => inv.itemId === itemId && inv.quantity > 0))
      .filter(Boolean);
  };

  const carriedItemsList = getCarriedItemsList();

  if (!mapData || !user) {
    return (
      <div className="game-loading">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="game-play-page">
      {notification && (
        <div className={`game-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="item-effects-container">
        {itemEffects.map(effect => (
          <div key={effect.id} className={`item-effect item-effect-${effect.type}`}>
            <div className="effect-bubbles">
              {effect.type === 'heal' && <><span className="bubble">💚</span><span className="bubble">💚</span><span className="bubble">💚</span></>}
              {effect.type === 'buff' && <><span className="bubble">✨</span><span className="bubble">⭐</span><span className="bubble">✨</span></>}
              {effect.type === 'revive' && <><span className="bubble">📜</span><span className="bubble">✨</span><span className="bubble">📜</span></>}
            </div>
            <div className="effect-text">
              {effect.type === 'heal' && `+${effect.value}% 回血`}
              {effect.type === 'buff' && effect.value}
              {effect.type === 'revive' && `复活 ${effect.value}`}
            </div>
          </div>
        ))}
      </div>

      <div className="game-header">
        <div className="game-header-left">
          <button className="back-btn" onClick={handleBackToLevels}>
            ← 返回
          </button>
          <h1 className="level-name">{mapData.name}</h1>
        </div>
        <div className="game-header-right">
          <div className="game-timer">
            ⏱️ {formatTime(game.timeUsed)} / {formatTime(mapData.timeLimit)}
          </div>
        </div>
      </div>

      <div className="game-container">
        <div className="game-sidebar">
          <div className="player-stats-card card">
            <h3>角色状态</h3>
            <div className="stat-row">
              <span className="stat-icon">❤️</span>
              <span className="stat-label">生命值</span>
              <span className="stat-value">{game.hp}/{game.maxHp}</span>
            </div>
            <div className="hp-bar">
              <div 
                className="hp-fill" 
                style={{ width: `${(game.hp / game.maxHp) * 100}%` }}
              ></div>
            </div>
            <div className="stat-row">
              <span className="stat-icon">⚔️</span>
              <span className="stat-label">攻击力</span>
              <span className="stat-value">
                {game.attack}
                {game.buffs.attackBoost > 0 && (
                  <span className="buff-positive"> (+{Math.round(game.buffs.attackBoost * 100)}%)</span>
                )}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-icon">🛡️</span>
              <span className="stat-label">防御力</span>
              <span className="stat-value">{game.defense}</span>
            </div>
            {hasReviveCarried && (
              <div className="stat-row revive-ready">
                <span className="stat-icon">📜</span>
                <span className="stat-label">复活卷轴</span>
                <span className="stat-value active">就绪</span>
              </div>
            )}
          </div>

          <div className="quick-items-card card">
            <h3>携带道具 ({carriedItemsList.length}/{MAX_CARRY_ITEMS})</h3>
            {carriedItemsList.length === 0 ? (
              <p className="no-items">未携带道具</p>
            ) : (
              <div className="quick-items-grid">
                {carriedItemsList.map(inv => (
                  <button 
                    key={inv.itemId}
                    className={`quick-item ${inv.item.category === 'revive' && game.wasRevived ? 'used' : ''}`}
                    title={`${inv.item.name}: ${inv.item.description}`}
                    onClick={() => inv.item.category !== 'revive' && handleUseItem(inv.itemId, inv.item)}
                    disabled={inv.item.category === 'revive' && game.wasRevived}
                  >
                    <span className="item-icon">{inv.item.icon}</span>
                    <span className="item-count">{inv.quantity}</span>
                  </button>
                ))}
              </div>
            )}
            <button 
              className="open-inventory-btn"
              onClick={() => setShowInventory(true)}
            >
              🎒 打开背包
            </button>
          </div>

          <div className="level-rewards-card card">
            <h3>通关奖励</h3>
            <div className="reward-item">
              <span className="reward-icon">💰</span>
              <span className="reward-text">金币: {mapData.coins}</span>
            </div>
            <div className="reward-item">
              <span className="reward-icon">✨</span>
              <span className="reward-text">经验: {mapData.experience}</span>
            </div>
            <div className="reward-item">
              <span className="reward-icon">🎁</span>
              <span className="reward-text">30%概率掉道具</span>
            </div>
          </div>

          <div className="game-controls-card card">
            <h3>操作说明</h3>
            <div className="control-item">
              <kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd>
              <span>移动</span>
            </div>
            <div className="control-item">
              <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
              <span>移动</span>
            </div>
          </div>
        </div>

        <div className="game-main">
          {!game.isPlaying && !game.isGameOver && (
            <div className="game-start-overlay">
              <div className="start-overlay-content card">
                <h2>🎮 准备开始</h2>
                <p>使用方向键或WASD移动角色</p>
                <p>躲避陷阱💀，到达终点🚩</p>
                {carriedItemsList.length > 0 && (
                  <p>已携带 {carriedItemsList.length} 个道具</p>
                )}
                <button className="btn btn-primary" onClick={game.startGame}>
                  ▶️ 开始游戏
                </button>
              </div>
            </div>
          )}

          {game.isPaused && (
            <div className="game-pause-overlay">
              <div className="pause-overlay-content card">
                <h2>⏸️ 游戏暂停</h2>
                <button className="btn btn-primary" onClick={game.togglePause}>
                  ▶️ 继续游戏
                </button>
                <button className="btn btn-secondary" onClick={handleBackToLevels}>
                  🏠 返回关卡
                </button>
              </div>
            </div>
          )}

          <GameMap 
            mapData={mapData} 
            playerPos={game.playerPos}
            damageFlash={game.damageFlash}
          />

          <div className="game-action-buttons">
            {game.isPlaying && !game.isGameOver && (
              <>
                <button className="btn btn-secondary" onClick={game.togglePause}>
                  ⏸️ 暂停
                </button>
                <button className="btn btn-outline" onClick={game.resetGame}>
                  🔄 重置
                </button>
              </>
            )}
          </div>

          <div className="mobile-controls">
            <div className="mobile-control-row">
              <button 
                className="mobile-control-btn"
                onClick={() => game.movePlayer(0, -1, handleRevive, hasReviveCarried)}
                disabled={!game.isPlaying || game.isPaused || game.isGameOver}
              >
                ↑
              </button>
            </div>
            <div className="mobile-control-row">
              <button 
                className="mobile-control-btn"
                onClick={() => game.movePlayer(-1, 0, handleRevive, hasReviveCarried)}
                disabled={!game.isPlaying || game.isPaused || game.isGameOver}
              >
                ←
              </button>
              <button 
                className="mobile-control-btn"
                onClick={() => game.movePlayer(0, 1, handleRevive, hasReviveCarried)}
                disabled={!game.isPlaying || game.isPaused || game.isGameOver}
              >
                ↓
              </button>
              <button 
                className="mobile-control-btn"
                onClick={() => game.movePlayer(1, 0, handleRevive, hasReviveCarried)}
                disabled={!game.isPlaying || game.isPaused || game.isGameOver}
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>

      {showInventory && inventory && (
        <div className="inventory-overlay" onClick={() => setShowInventory(false)}>
          <div className="inventory-modal card" onClick={e => e.stopPropagation()}>
            <div className="inventory-modal-header">
              <h2>🎒 背包</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowInventory(false)}
              >
                ✕
              </button>
            </div>
            
            {inventory.length === 0 ? (
              <div className="empty-inventory">
                <div className="empty-icon">📭</div>
                <p>背包空空如也</p>
              </div>
            ) : (
              <div className="inventory-modal-grid">
                {inventory.map(inv => {
                  const isCarried = carriedItems.includes(inv.itemId);
                  const canUse = ['heal', 'buff'].includes(inv.item?.category);
                  return (
                    <div 
                      key={inv.itemId}
                      className={`inventory-modal-item ${!canUse ? 'disabled' : ''} ${isCarried ? 'carried' : ''}`}
                      onClick={() => canUse && handleUseItem(inv.itemId, inv.item)}
                    >
                      {isCarried && <div className="carried-badge">已携带</div>}
                      <div className="item-icon-large">{inv.item?.icon}</div>
                      <div className="item-name">{inv.item?.name}</div>
                      <div className="item-quantity">×{inv.quantity}</div>
                      {inv.item?.rarity && (
                        <div className={`item-rarity ${inv.item.rarity}`}>
                          {inv.item.rarity === 'common' && '普通'}
                          {inv.item.rarity === 'uncommon' && '优秀'}
                          {inv.item.rarity === 'rare' && '稀有'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {showResult && resultData && (
        <div className="result-overlay">
          <div className="result-modal card">
            {resultData.win !== false ? (
              <>
                <div className="result-icon">🎉</div>
                <h2>恭喜通关！</h2>
                <div className="result-stars">
                  {renderStars(resultData.stars)}
                </div>
                <div className="result-rewards">
                  <div className="reward-item">
                    <span className="reward-icon">💰</span>
                    <span>+{resultData.coins} 金币</span>
                  </div>
                  <div className="reward-item">
                    <span className="reward-icon">✨</span>
                    <span>+{resultData.experience} 经验</span>
                  </div>
                  {resultData.drops && resultData.drops.length > 0 && (
                    <div className="drops-section">
                      <div className="drops-title">🎁 获得道具:</div>
                      <div className="drops-list">
                        {resultData.drops.map((drop, idx) => (
                          <span key={idx} className="drop-item">
                            {drop.item?.icon} {drop.item?.name} ×{drop.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {resultData.leveledUp && (
                  <div className="level-up-badge">
                    🎊 等级提升！
                  </div>
                )}
                <div className="result-time">
                  用时: {formatTime(game.timeUsed)}
                </div>
                <div className="result-actions">
                  <button className="btn btn-outline" onClick={handleRetry}>
                    🔄 重玩
                  </button>
                  <button className="btn btn-secondary" onClick={handleBackToLevels}>
                    🏠 返回
                  </button>
                  <button className="btn btn-primary" onClick={handleNextLevel}>
                    ➡️ 下一关
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="result-icon">💀</div>
                <h2>闯关失败</h2>
                <p>生命值耗尽了...</p>
                <div className="result-actions">
                  <button className="btn btn-outline" onClick={handleBackToLevels}>
                    🏠 返回
                  </button>
                  <button className="btn btn-primary" onClick={handleRetry}>
                    🔄 重试
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GamePlay;
