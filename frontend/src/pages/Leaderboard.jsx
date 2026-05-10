import { useState, useEffect, useCallback } from 'react';
import { leaderboardAPI } from '../services/api';
import { getSkinIcon } from '../config/skinConfig';
import '../styles/Leaderboard.css';

function Leaderboard() {
  const [activeTab, setActiveTab] = useState('levels');
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [types, setTypes] = useState([]);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  const loadLeaderboard = useCallback(async (type, isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      let res;
      if (isManualRefresh) {
        res = await leaderboardAPI.refreshLeaderboard(type);
      } else {
        res = await leaderboardAPI.getLeaderboard(type);
      }
      
      if (res.success) {
        const data = res.data;
        
        console.log('[排行榜] 收到数据:', {
          myRank: data.myRank,
          myData: data.myData,
          currentUserSnapshot: data.currentUserSnapshot,
          playerCount: data.players.length
        });
        
        if (data.currentUserSnapshot) {
          console.log('[排行榜] 当前用户快照:', data.currentUserSnapshot);
        }
        
        if (!data.myData && data.currentUserSnapshot) {
          console.log('[排行榜] 警告: myData 为空，但有 currentUserSnapshot');
        }
        
        setLeaderboardData(data);
        
        if (isManualRefresh) {
          setRefreshSuccess(true);
          setTimeout(() => setRefreshSuccess(false), 2000);
        }
      }
    } catch (error) {
      console.error('获取排行榜失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    console.log('[排行榜] 手动刷新被触发，type:', activeTab);
    loadLeaderboard(activeTab, true);
  }, [activeTab, loadLeaderboard]);

  const loadTypes = useCallback(async () => {
    try {
      const res = await leaderboardAPI.getLeaderboardTypes();
      if (res.success) {
        setTypes(res.data.types);
      }
    } catch (error) {
      console.error('获取排行榜类型失败:', error);
    }
  }, []);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  useEffect(() => {
    loadLeaderboard(activeTab);
  }, [activeTab, loadLeaderboard]);

  const getRankStyle = (rank) => {
    switch (rank) {
      case 1:
        return {
          icon: '🥇',
          color: '#FFD700',
          bgGradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
          borderColor: '#FFD700',
          frameType: 'gold',
          isTop3: true,
          isTop10: true
        };
      case 2:
        return {
          icon: '🥈',
          color: '#C0C0C0',
          bgGradient: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)',
          borderColor: '#C0C0C0',
          frameType: 'silver',
          isTop3: true,
          isTop10: true
        };
      case 3:
        return {
          icon: '🥉',
          color: '#CD7F32',
          bgGradient: 'linear-gradient(135deg, #CD7F32 0%, #B87333 100%)',
          borderColor: '#CD7F32',
          frameType: 'bronze',
          isTop3: true,
          isTop10: true
        };
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
      case 9:
      case 10:
        return {
          icon: null,
          color: '#667eea',
          bgGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderColor: '#667eea',
          frameType: 'diamond',
          isTop3: false,
          isTop10: true
        };
      default:
        return {
          icon: null,
          color: '#667eea',
          bgGradient: null,
          borderColor: null,
          frameType: null,
          isTop3: false,
          isTop10: false
        };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActiveTypeConfig = () => {
    return types.find(t => t.type === activeTab) || { name: '排行榜', icon: '🏆' };
  };

  if (loading && !leaderboardData) {
    return (
      <div className="leaderboard-page">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>加载排行榜中...</p>
          </div>
        </div>
      </div>
    );
  }

  const config = getActiveTypeConfig();

  return (
    <div className="leaderboard-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">
            🏆 排行榜
          </h1>
          <button
            className={`refresh-btn ${refreshing ? 'spinning' : ''} ${refreshSuccess ? 'success' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing || loading}
            title="刷新排行榜"
          >
            <span className="refresh-icon">🔄</span>
            <span className="refresh-text">
              {refreshSuccess ? '已刷新!' : refreshing ? '刷新中...' : '刷新'}
            </span>
          </button>
        </div>

        <div className="leaderboard-tabs card">
          {types.map(type => (
            <button
              key={type.type}
              className={`tab-btn ${activeTab === type.type ? 'active' : ''}`}
              onClick={() => setActiveTab(type.type)}
            >
              <span className="tab-icon">{type.icon}</span>
              <span className="tab-text">{type.name}</span>
            </button>
          ))}
        </div>

        {leaderboardData && leaderboardData.myData && (
          <div className="my-rank-card card">
            <div className="my-rank-header">
              <h3>我的排名</h3>
              <span className="update-time">
                更新于 {formatDate(leaderboardData.lastUpdate)}
              </span>
            </div>
            <div className="my-rank-content">
              <div className="my-rank-number">
                {leaderboardData.myRank ? (
                  leaderboardData.myRank <= 3 ? (
                    <span className="top-3-rank">{getRankStyle(leaderboardData.myRank).icon}</span>
                  ) : (
                    <span className="rank-number">#{leaderboardData.myRank}</span>
                  )
                ) : (
                  <span className="no-rank">未上榜</span>
                )}
              </div>
              <div className="my-player-info">
                <div className="my-avatar">
                  {getSkinIcon(leaderboardData.myData.currentSkin)}
                </div>
                <div className="my-info">
                  <h4>{leaderboardData.myData.nickname}</h4>
                  <div className="my-stats">
                    <span className="my-level">Lv.{leaderboardData.myData.level}</span>
                    <span className="my-score">
                      {leaderboardData.type === 'levels' 
                        ? `🎯 通关 ${leaderboardData.myData.completedLevels} 层`
                        : `🦸 等级 ${leaderboardData.myData.level}`
                      }
                    </span>
                  </div>
                </div>
              </div>
              <div className="my-score-display">
                <div className="score-label">{leaderboardData.typeName}</div>
                <div className="score-value">{leaderboardData.myData.score}</div>
              </div>
            </div>
          </div>
        )}

        <div className="leaderboard-list card">
          <div className="list-header">
            <span className="col-rank">排名</span>
            <span className="col-player">玩家</span>
            <span className="col-info">信息</span>
            <span className="col-score">分数</span>
          </div>

          {loading ? (
            <div className="list-loading">
              <div className="loading-spinner-small"></div>
              <p>加载中...</p>
            </div>
          ) : leaderboardData && leaderboardData.players.length > 0 ? (
            <div className="players-list">
              {leaderboardData.players.map((player, index) => {
                const rankStyle = getRankStyle(player.rank);
                const isTop3 = player.rank <= 3;
                const isTop10 = player.rank <= 10;
                const isCurrentUser = player.isCurrentUser;
                const frameClass = rankStyle.frameType ? `avatar-frame-${rankStyle.frameType}` : '';

                return (
                  <div
                    key={player.playerId}
                    className={`player-row ${isTop3 ? 'top-3' : ''} ${isTop10 ? 'top-10' : ''} ${isCurrentUser ? 'current-user' : ''}`}
                    style={isTop10 ? {
                      borderLeftColor: rankStyle.borderColor
                    } : {}}
                  >
                    <div className="col-rank">
                      {isTop3 ? (
                        <span className="top-rank-badge" style={{ color: rankStyle.color }}>
                          {rankStyle.icon}
                        </span>
                      ) : (
                        <span className={`rank-text ${isTop10 ? 'top-10-rank' : ''}`}>
                          {player.rank}
                        </span>
                      )}
                    </div>
                    
                    <div className="col-player">
                      <div className={`avatar-container ${frameClass}`}>
                        <div className="player-avatar" style={isTop10 ? {
                          background: rankStyle.bgGradient
                        } : {}}>
                          {getSkinIcon(player.currentSkin)}
                        </div>
                        {isTop10 && (
                          <div className="rank-badge-overlay" style={{
                            background: rankStyle.bgGradient
                          }}>
                            #{player.rank}
                          </div>
                        )}
                      </div>
                      <div className="player-name-info">
                        <span className="player-name">
                          {player.nickname}
                          {isCurrentUser && <span className="self-tag">(我)</span>}
                          {isTop3 && <span className="elite-tag">👑</span>}
                        </span>
                        <span className="player-level">Lv.{player.level}</span>
                      </div>
                    </div>

                    <div className="col-info">
                      <div className="player-stats">
                        <span className="stat">
                          🎯 {player.completedLevels}
                        </span>
                        <span className="stat">
                          ⭐ {player.totalStars}
                        </span>
                      </div>
                    </div>

                    <div className="col-score">
                      <div className="score-badge" style={isTop10 ? {
                        background: rankStyle.bgGradient
                      } : {}}>
                        {player.score}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-list">
              <div className="empty-icon">📭</div>
              <p>暂无排行数据</p>
            </div>
          )}
        </div>

        {leaderboardData && (
          <div className="leaderboard-footer">
            <span className="total-players">
              👥 共 {leaderboardData.totalPlayers} 名玩家参与排行
            </span>
            <span className="max-display">
              显示前 {leaderboardData.maxDisplay} 名
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;