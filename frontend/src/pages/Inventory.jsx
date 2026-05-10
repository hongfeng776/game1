import { useState, useEffect, useCallback } from 'react';
import { inventoryAPI } from '../services/api';
import { useGameContext } from '../context/GameContext';
import '../styles/Inventory.css';

const rarityConfig = {
  common: { name: '普通', color: '#9E9E9E', bgColor: '#F5F5F5' },
  uncommon: { name: '优秀', color: '#4CAF50', bgColor: '#E8F5E9' },
  rare: { name: '稀有', color: '#2196F3', bgColor: '#E3F2FD' },
  epic: { name: '史诗', color: '#9C27B0', bgColor: '#F3E5F5' },
  legendary: { name: '传说', color: '#FF9800', bgColor: '#FFF3E0' }
};

const categoryConfig = {
  heal: { name: '回复', icon: '❤️' },
  buff: { name: '增益', icon: '✨' },
  revive: { name: '复活', icon: '📜' },
  shield: { name: '护盾', icon: '🛡️' }
};

function Inventory() {
  const { user, refreshUser } = useGameContext();
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filter, setFilter] = useState('all');
  const [notification, setNotification] = useState(null);

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await inventoryAPI.getInventory();
      if (res.success) {
        setInventory(res.data);
      }
    } catch (error) {
      console.error('获取背包数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredItems = inventory?.items?.filter(inv => {
    if (filter === 'all') return true;
    return inv.item?.category === filter;
  }) || [];

  const handleUseItem = async (itemId) => {
    const inv = inventory.items.find(i => i.itemId === itemId);
    if (!inv || inv.quantity <= 0) return;

    if (inv.item.category === 'revive' || inv.item.category === 'buff') {
      showNotification('请在关卡中使用此道具', 'error');
      return;
    }

    try {
      const res = await inventoryAPI.useItem(itemId, 1);
      if (res.success) {
        await loadInventory();
        await refreshUser();
        const effect = res.data.effect;
        if (effect.heal) {
          showNotification(`使用了 ${inv.item.name}，恢复了生命值！`, 'success');
        } else {
          showNotification(`使用了 ${inv.item.name}！`, 'success');
        }
        setSelectedItem(null);
      }
    } catch (error) {
      showNotification(error.response?.data?.message || '使用失败', 'error');
    }
  };

  const getItemRarity = (rarity) => rarityConfig[rarity] || rarityConfig.common;

  if (loading || !inventory) {
    return (
      <div className="inventory-page">
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
    <div className="inventory-page">
      <div className="container">
        <h1 className="page-title">🎒 我的背包</h1>

        {notification && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}

        <div className="inventory-header card">
          <div className="inventory-stats">
            <div className="stat-item">
              <span className="stat-icon">📦</span>
              <span className="stat-value">{inventory.usedSlots}</span>
              <span className="stat-label">已使用格子</span>
            </div>
            <div className="stat-divider">/</div>
            <div className="stat-item">
              <span className="stat-value">{inventory.maxSlots}</span>
              <span className="stat-label">最大格子</span>
            </div>
          </div>
          <div className="filter-bar">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              全部
            </button>
            {Object.entries(categoryConfig).map(([key, cfg]) => (
              <button
                key={key}
                className={`filter-btn ${filter === key ? 'active' : ''}`}
                onClick={() => setFilter(key)}
              >
                {cfg.icon} {cfg.name}
              </button>
            ))}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">📭</div>
            <h3>背包空空如也</h3>
            <p>通关关卡有概率获得道具奖励</p>
          </div>
        ) : (
          <div className="inventory-grid">
            {filteredItems.map((inv) => {
              const { item, itemId, quantity } = inv;
              const rarity = getItemRarity(item.rarity);
              const isSelected = selectedItem?.itemId === itemId;

              return (
                <div
                  key={itemId}
                  className={`item-slot ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedItem(isSelected ? null : inv)}
                  style={{
                    borderColor: rarity.color,
                    background: rarity.bgColor
                  }}
                >
                  <div className="item-icon">{item.icon}</div>
                  <div className="item-name">{item.name}</div>
                  <div className="item-quantity">×{quantity}</div>
                  <div
                    className="item-rarity-badge"
                    style={{ background: rarity.color }}
                  >
                    {rarity.name}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedItem && (
          <div className="item-detail-overlay" onClick={() => setSelectedItem(null)}>
            <div className="item-detail-card card" onClick={e => e.stopPropagation()}>
              <div
                className="detail-header"
                style={{
                  borderColor: getItemRarity(selectedItem.item.rarity).color
                }}
              >
                <div className="detail-icon">{selectedItem.item.icon}</div>
                <div className="detail-info">
                  <h3>{selectedItem.item.name}</h3>
                  <span
                    className="detail-rarity"
                    style={{ color: getItemRarity(selectedItem.item.rarity).color }}
                  >
                    {getItemRarity(selectedItem.item.rarity).name}
                  </span>
                </div>
                <div className="detail-quantity">
                  数量: ×{selectedItem.quantity}
                </div>
              </div>

              <div className="detail-description">
                <p>{selectedItem.item.description}</p>
              </div>

              <div className="detail-category">
                <span className="category-label">类型:</span>
                <span className="category-value">
                  {categoryConfig[selectedItem.item.category]?.name || '道具'}
                </span>
              </div>

              <div className="detail-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => setSelectedItem(null)}
                >
                  关闭
                </button>
                {(selectedItem.item.category === 'heal') && (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleUseItem(selectedItem.itemId)}
                    disabled={selectedItem.quantity <= 0}
                  >
                    使用
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Inventory;
