import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { userAPI, saveAPI, backupAPI } from '../services/api';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveCorrupted, setSaveCorrupted] = useState(null);
  const [showCorruptedModal, setShowCorruptedModal] = useState(false);
  const [availableBackups, setAvailableBackups] = useState([]);

  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await userAPI.getUser();
      if (res.success) {
        setUser(res.data);
      }
    } catch (error) {
      console.error('获取用户数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkSaveIntegrity = useCallback(async () => {
    try {
      const res = await saveAPI.checkIntegrity();
      if (res.success && !res.data.valid && res.data.exists) {
        console.warn('[存档] 检测到存档损坏:', res.data.error);
        setSaveCorrupted(res.data);
        
        const backupRes = await backupAPI.getList();
        if (backupRes.success && backupRes.data.length > 0) {
          const validBackups = backupRes.data.filter(b => !b.corrupted);
          setAvailableBackups(validBackups);
        }
        
        setShowCorruptedModal(true);
      }
    } catch (error) {
      console.error('[存档] 检查完整性失败:', error);
    }
  }, []);

  const updateUser = useCallback((userData) => {
    setUser(userData);
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  const saveGame = useCallback(async () => {
    try {
      await saveAPI.save();
      console.log('[存档] 游戏已保存');
    } catch (error) {
      console.error('[存档] 保存失败:', error);
    }
  }, []);

  const handleRestoreBackup = useCallback(async (filename) => {
    try {
      const res = await backupAPI.restore(filename);
      if (res.success) {
        alert('备份恢复成功！');
        setShowCorruptedModal(false);
        setSaveCorrupted(null);
        await fetchUser();
      } else {
        alert(`恢复失败: ${res.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('[备份] 恢复失败:', error);
      alert('恢复失败，请重试');
    }
  }, [fetchUser]);

  const handleCloseCorruptedModal = useCallback(() => {
    setShowCorruptedModal(false);
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    fetchUser();
    checkSaveIntegrity();

    const handleBeforeUnload = async (event) => {
      try {
        await saveAPI.save();
        console.log('[存档] 游戏退出前已自动保存');
      } catch (error) {
        console.error('[存档] 自动保存失败:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleBeforeUnload);
    };
  }, [fetchUser, checkSaveIntegrity]);

  return (
    <GameContext.Provider value={{ user, isLoading, updateUser, refreshUser, saveGame }}>
      {children}
      
      {showCorruptedModal && (
        <div className="modal-overlay" style={modalStyles.overlay}>
          <div className="modal-content" style={modalStyles.content}>
            <div className="modal-header" style={modalStyles.header}>
              <span style={modalStyles.warningIcon}>⚠️</span>
              <h2 style={modalStyles.title}>存档损坏检测</h2>
            </div>
            
            <div className="modal-body" style={modalStyles.body}>
              <p style={modalStyles.message}>
                检测到您的游戏存档可能已损坏，错误信息：
              </p>
              <div style={modalStyles.errorBox}>
                {saveCorrupted?.error || '存档文件格式错误'}
              </div>
              
              {saveCorrupted?.savedAt && (
                <p style={modalStyles.saveTime}>
                  存档时间：{formatDate(saveCorrupted.savedAt)}
                </p>
              )}
              
              {availableBackups.length > 0 ? (
                <div style={modalStyles.backupSection}>
                  <h3 style={modalStyles.backupTitle}>💾 可用备份</h3>
                  <p style={modalStyles.backupDesc}>
                    您有 {availableBackups.length} 个可用的备份存档，可以选择恢复：
                  </p>
                  <div style={modalStyles.backupList}>
                    {availableBackups.slice(0, 5).map((backup, index) => (
                      <div key={index} style={modalStyles.backupItem}>
                        <div style={modalStyles.backupInfo}>
                          <span style={modalStyles.backupName}>
                            {backup.filename.startsWith('backup_') ? '自动备份' : backup.filename.split('_')[0]}
                          </span>
                          <span style={modalStyles.backupMeta}>
                            {formatDate(backup.createdAt)}
                            {backup.userLevel !== undefined && ` · Lv.${backup.userLevel}`}
                            {backup.coins !== undefined && ` · ${backup.coins.toLocaleString()} 金币`}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRestoreBackup(backup.filename)}
                          style={modalStyles.restoreButton}
                        >
                          恢复
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={modalStyles.noBackupSection}>
                  <p style={modalStyles.noBackupText}>
                    😢 没有找到可用的备份存档。
                  </p>
                  <p style={modalStyles.suggestionText}>
                    建议：以后定期创建备份来保护您的游戏进度。
                    您可以在【设置 → 存档备份】中手动创建备份。
                  </p>
                </div>
              )}
            </div>
            
            <div className="modal-footer" style={modalStyles.footer}>
              <button
                onClick={handleCloseCorruptedModal}
                style={modalStyles.closeButton}
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </GameContext.Provider>
  );
}

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
  },
  content: {
    background: 'white',
    borderRadius: '20px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
  },
  header: {
    padding: '25px 30px',
    background: 'linear-gradient(135deg, #ff6b6b, #ee5a5a)',
    borderRadius: '20px 20px 0 0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  warningIcon: {
    fontSize: '2rem'
  },
  title: {
    margin: 0,
    color: 'white',
    fontSize: '1.4rem',
    fontWeight: 'bold'
  },
  body: {
    padding: '25px 30px'
  },
  message: {
    color: '#333',
    lineHeight: '1.6',
    margin: '0 0 15px 0'
  },
  errorBox: {
    background: '#fff3f3',
    border: '1px solid #ffcdd2',
    borderRadius: '10px',
    padding: '15px',
    color: '#d32f2f',
    fontWeight: '500',
    marginBottom: '15px'
  },
  saveTime: {
    color: '#666',
    fontSize: '0.9rem',
    margin: '0 0 20px 0'
  },
  backupSection: {
    borderTop: '1px solid #eee',
    paddingTop: '20px'
  },
  backupTitle: {
    margin: '0 0 10px 0',
    color: '#333',
    fontSize: '1.1rem'
  },
  backupDesc: {
    color: '#666',
    fontSize: '0.9rem',
    margin: '0 0 15px 0'
  },
  backupList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  backupItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#f8f9fa',
    borderRadius: '12px',
    padding: '15px',
    border: '1px solid #e9ecef'
  },
  backupInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  backupName: {
    fontWeight: 'bold',
    color: '#333'
  },
  backupMeta: {
    fontSize: '0.85rem',
    color: '#666'
  },
  restoreButton: {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'transform 0.2s'
  },
  noBackupSection: {
    borderTop: '1px solid #eee',
    paddingTop: '20px'
  },
  noBackupText: {
    color: '#666',
    margin: '0 0 10px 0'
  },
  suggestionText: {
    color: '#999',
    fontSize: '0.9rem',
    lineHeight: '1.6',
    margin: 0
  },
  footer: {
    padding: '20px 30px',
    borderTop: '1px solid #eee',
    display: 'flex',
    justifyContent: 'flex-end'
  },
  closeButton: {
    background: '#666',
    color: 'white',
    border: 'none',
    padding: '12px 30px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1rem'
  }
};

export function useGameContext() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
}
