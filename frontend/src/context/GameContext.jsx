import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { userAPI, saveAPI } from '../services/api';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    fetchUser();

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
  }, [fetchUser]);

  return (
    <GameContext.Provider value={{ user, isLoading, updateUser, refreshUser, saveGame }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
}
