import { useState, useEffect, useCallback } from 'react';
import { inventoryAPI } from '../services/api';
import { useGameContext } from '../context/GameContext';
import '../styles/Inventory.css';

const rarityConfig = {
  common: { name: '普通', color: '#9E9E9E', bgColor: '#FAFAFA' },
  uncommon: { name: '优秀', color: '#4CAF50', bgColor: '#E8F5E9' },
  rare: { name: '稀有', color: '#2196F3', bgColor: '#E3F2FD' }
};

function Inventory() {
  const { user, refreshUser } = useGameContext();
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
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
        showNotification(`使用了 ${inv.item.name}！`, 'success');
        setSelectedItem(null);
      }
    } catch (error) {
      showNotification(error.response?.data?.message || '使用失败', 'error');
    }
  };

  const getItemRarity = (rarity) => rarityConfig[rarity] || rarityConfig.common;

  const emptySlots = inventory ? Math.max(0, inventory.maxSlots - inventory.usedSlots) : 0;

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
              <span className="stat-label">已用格子</span>
            </div>
            <div className="stat-divider">/</div>
            <div className="stat-item">
              <span className="stat-value">{inventory.maxSlots}</span>
              <span className="stat-label">总格子</span>
            </div>
            <div className="stat-info">
              <span className="info-text">每类最多 {inventory.maxItemsPerType} 个</span>
            </div>
          </div>
        </div>

        <div className="inventory-grid-container">
          {inventory.items.map((inv) => {
            const { item, itemId, quantity } = inv;
            const rarity = getItemRarity(item.rarity);
            const isSelected = selectedItem?.itemId === itemId;

            return (
              <div
                key={itemId}
                className={`item-slot ${isSelected ? 'selected' : ''} rarity-${item.rarity}`}
                onClick={() => setSelectedItem(isSelected ? null : inv)}
                style={{
                  borderColor: rarity.color
                }}
              >
                <div className="item-icon">{item.icon}</div>
                <div className="item-name">{item.name}</div>
                <div className="item-quantity">×{quantity}</div>
              </div>
            );
          })}

          {Array.from({ length: emptySlots }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="item-slot empty-slot"
            >
              <div className="empty-icon">+</div>
            </div>
          ))}
        </div>

        {selectedItem && (
          <div className="item-detail-overlay" onClick={() => setSelectedItem(null)}>
            <div className="item-detail-card card" onClick={e => e.stopPropagation()}>
              <div className="detail-header">
                <div className="detail-icon">{selectedItem.item.icon}</div>
                <div className="detail-info">
                  <h3>{selectedItem.item.name}</h3>
                  <span className="detail-rarity" style={{ color: getItemRarity(selectedItem.item.rarity).color }}>
                    {getItemRarity(selectedItem.item.rarity).name}
                  </span>
                </div>
                <div className="detail-quantity">
                  数量: ×{selectedItem.quantity} / {inventory.maxItemsPerType}
                </div>
              </div>

              <div className="detail-description">
                <p>{selectedItem.item.description}</p>
              </div>

              <div className="detail-category">
                <span className="category-label">类型:</span>
                <span className="category-value">
                  {selectedItem.item.category === 'heal' ? '回复类' :
                   selectedItem.item.category === 'buff' ? '增益类' :
                   selectedItem.item.category === 'revive' ? '复活类' : '道具'}
                </span>
              </div>

              <div className="detail-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => setSelectedItem(null)}
                >
                  关闭
                </button>
                {selectedItem.item.category === 'heal' && (
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
