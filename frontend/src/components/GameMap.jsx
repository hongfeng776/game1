import { TILE_SIZE, TILE_TYPES } from '../hooks/useGame';
import '../styles/GameMap.css';

function GameMap({ mapData, playerPos, damageFlash, monsters }) {
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
            <span className="player-icon">🧙</span>
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
      </div>
    </div>
  );
}

export default GameMap;
