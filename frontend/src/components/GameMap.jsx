import { TILE_SIZE, TILE_TYPES } from '../hooks/useGame';
import '../styles/GameMap.css';

const DEFAULT_SKIN_ICON = '🧙';

function GameMap({ mapData, playerPos, damageFlash, monsters, skinIcon = DEFAULT_SKIN_ICON, eggs = [] }) {
  if (!mapData) return null;

  const renderTile = (tileType, x, y) => {
    let className = 'tile';
    
    switch (tileType) {
      case TILE_TYPES.WALL:
        className += ' wall';
        break;
      case TILE_TYPES.START:
        className += ' start';
        break;
      case TILE_TYPES.END:
        className += ' end';
        break;
      case TILE_TYPES.TRAP:
        className += ' trap';
        break;
      default:
        className += ' empty';
    }

    return (
      <div
        key={`${x}-${y}`}
        className={className}
        style={{
          width: TILE_SIZE,
          height: TILE_SIZE,
          left: x * TILE_SIZE,
          top: y * TILE_SIZE
        }}
      >
        {tileType === TILE_TYPES.TRAP && <span className="trap-icon">💀</span>}
        {tileType === TILE_TYPES.END && <span className="end-icon">🚩</span>}
        {tileType === TILE_TYPES.START && <span className="start-icon">🏁</span>}
      </div>
    );
  };

  return (
    <div className="game-map-container">
      <div 
        className={`game-map ${damageFlash ? 'damage-flash' : ''}`}
        style={{
          width: mapData.width * TILE_SIZE,
          height: mapData.height * TILE_SIZE
        }}
      >
        {mapData.map.map((row, y) =>
          row.map((tile, x) => renderTile(tile, x, y))
        )}
        
        {monsters && monsters.map(monster => (
          <div 
            key={monster.id}
            className="monster"
            style={{
              width: TILE_SIZE,
              height: TILE_SIZE,
              left: monster.x * TILE_SIZE,
              top: monster.y * TILE_SIZE
            }}
            title={`${monster.name} - 伤害: ${monster.damage}`}
          >
            <span className="monster-icon">{monster.icon}</span>
          </div>
        ))}
        
        {eggs.filter(e => !e.isTriggered).map(egg => (
          <div 
            key={egg.id}
            className="egg hidden-egg"
            style={{
              width: TILE_SIZE,
              height: TILE_SIZE,
              left: egg.position.x * TILE_SIZE,
              top: egg.position.y * TILE_SIZE
            }}
            title={`彩蛋: ${egg.name}`}
          >
            <span className="egg-icon">🎁</span>
          </div>
        ))}
        
        {playerPos && (
          <div 
            className={`player ${damageFlash ? 'player-damage' : ''}`}
            style={{
              width: TILE_SIZE,
              height: TILE_SIZE,
              left: playerPos.x * TILE_SIZE,
              top: playerPos.y * TILE_SIZE
            }}
          >
            <span className="player-icon">{skinIcon}</span>
          </div>
        )}
      </div>
      
      <div className="game-legend">
        <div className="legend-item">
          <span className="legend-icon">🏁</span>
          <span>起点</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">🚩</span>
          <span>终点</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">💀</span>
          <span>陷阱</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">👾</span>
          <span>怪物</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">🧙</span>
          <span>角色</span>
        </div>
        {eggs && eggs.length > 0 && (
          <div className="legend-item">
            <span className="legend-icon">🎁</span>
            <span>隐藏彩蛋</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default GameMap;
