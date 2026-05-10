import { useState, useCallback, useEffect, useRef } from 'react';

export const TILE_SIZE = 40;
export const TILE_TYPES = {
  EMPTY: 0,
  WALL: 1,
  START: 2,
  END: 3,
  TRAP: 4
};

function calculateDamage(baseDamage, defense) {
  const reduction = defense * 0.5;
  const finalDamage = Math.max(1, baseDamage - reduction);
  return Math.floor(finalDamage);
}

const ITEM_DEFS = {
  hp_potion: {
    id: 'hp_potion',
    name: '生命药水',
    icon: '🧪',
    category: 'heal',
    effect: { heal: 0.3, type: 'percent' }
  },
  attack_boost: {
    id: 'attack_boost',
    name: '狂暴药剂',
    icon: '💪',
    category: 'buff',
    effect: { attackBoost: 0.2, duration: 300 }
  },
  revive_scroll: {
    id: 'revive_scroll',
    name: '复活卷轴',
    icon: '📜',
    category: 'revive',
    effect: { revive: true, healPercent: 0.5 }
  }
};

export function useGame(mapData, user) {
  const baseMaxHp = user?.maxHp || 100;
  const baseAttack = user?.attack || 10;
  const baseDefense = user?.defense || 0;
  
  const [playerPos, setPlayerPos] = useState(null);
  const [hp, setHp] = useState(baseMaxHp);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [timeUsed, setTimeUsed] = useState(0);
  const [damageFlash, setDamageFlash] = useState(false);
  const [buffs, setBuffs] = useState({
    attackBoost: 0
  });
  const [wasRevived, setWasRevived] = useState(false);
  const [monsters, setMonsters] = useState([]);
  
  const timerRef = useRef(null);
  const playerPosRef = useRef(null);
  const hpRef = useRef(baseMaxHp);
  const buffsRef = useRef({ attackBoost: 0 });
  const gameEndedRef = useRef(false);
  const externalHandlersRef = useRef(null);
  const monsterTimersRef = useRef([]);
  const monstersRef = useRef([]);

  const currentMaxHp = baseMaxHp;
  const currentAttack = Math.floor(baseAttack * (1 + buffs.attackBoost));
  const currentDefense = baseDefense;

  useEffect(() => {
    hpRef.current = hp;
  }, [hp]);

  useEffect(() => {
    buffsRef.current = { ...buffs };
  }, [buffs.attackBoost]);

  useEffect(() => {
    if (mapData) {
      resetGame();
    }
  }, [mapData, baseMaxHp]);

  useEffect(() => {
    if (playerPos) {
      playerPosRef.current = playerPos;
    }
  }, [playerPos]);

  const clearMonsterTimers = useCallback(() => {
    monsterTimersRef.current.forEach(timer => {
      if (timer) clearInterval(timer);
    });
    monsterTimersRef.current = [];
  }, []);

  const resetGame = useCallback(() => {
    if (mapData) {
      setPlayerPos({ ...mapData.startPos });
      setHp(baseMaxHp);
      hpRef.current = baseMaxHp;
      setIsPlaying(false);
      setIsPaused(false);
      setIsGameOver(false);
      setIsWin(false);
      setTimeUsed(0);
      setBuffs({ attackBoost: 0 });
      buffsRef.current = { attackBoost: 0 };
      setWasRevived(false);
      gameEndedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      clearMonsterTimers();
      const initialMonsters = mapData.monsters ? mapData.monsters.map(m => ({ ...m })) : [];
      setMonsters(initialMonsters);
      monstersRef.current = initialMonsters;
    }
  }, [mapData, baseMaxHp, clearMonsterTimers]);

  const moveMonster = useCallback((monster, onRevive, hasReviveItem) => {
    if (gameEndedRef.current) return;
    
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 }
    ];
    
    let newX = monster.x;
    let newY = monster.y;
    
    const preferredDirs = [monster.direction, (monster.direction + 1) % 4, (monster.direction + 3) % 4, (monster.direction + 2) % 4];
    
    for (const dirIdx of preferredDirs) {
      const dir = directions[dirIdx];
      const testX = monster.x + dir.dx;
      const testY = monster.y + dir.dy;
      
      if (mapData && testX >= 0 && testX < mapData.width && testY >= 0 && testY < mapData.height) {
        const tile = mapData.map[testY][testX];
        if (tile !== TILE_TYPES.WALL && tile !== TILE_TYPES.TRAP) {
          newX = testX;
          newY = testY;
          monster.direction = dirIdx;
          break;
        }
      }
    }
    
    const updatedMonster = { ...monster, x: newX, y: newY };
    
    if (playerPosRef.current) {
      const playerX = playerPosRef.current.x;
      const playerY = playerPosRef.current.y;
      
      if (newX === playerX && newY === playerY) {
        const baseDamage = monster.damage;
        const damageResult = takeDamage(baseDamage);
        
        setDamageFlash(true);
        setTimeout(() => setDamageFlash(false), 300);
        
        if (damageResult.isDead) {
          if (!wasRevived && hasReviveItem) {
            setWasRevived(true);
            if (onRevive) {
              const reviveHp = Math.floor(currentMaxHp * 0.5);
              setHp(reviveHp);
              hpRef.current = reviveHp;
              gameEndedRef.current = false;
              onRevive();
            }
          } else {
            gameEndedRef.current = true;
            setIsGameOver(true);
            setIsPlaying(false);
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            clearMonsterTimers();
          }
        }
      }
    }
    
    return updatedMonster;
  }, [mapData, takeDamage, wasRevived, currentMaxHp, clearMonsterTimers]);

  const startMonsterMovement = useCallback((onRevive, hasReviveItem) => {
    clearMonsterTimers();
    
    monstersRef.current.forEach((monster, index) => {
      const timer = setInterval(() => {
        if (gameEndedRef.current || isPaused) return;
        
        setMonsters(prevMonsters => {
          const newMonsters = [...prevMonsters];
          if (newMonsters[index]) {
            const movedMonster = moveMonster(newMonsters[index], onRevive, hasReviveItem);
            if (movedMonster) {
              newMonsters[index] = movedMonster;
              monstersRef.current = newMonsters;
            }
          }
          return newMonsters;
        });
      }, monster.moveInterval || 1500);
      
      monsterTimersRef.current.push(timer);
    });
  }, [clearMonsterTimers, moveMonster, isPaused]);

  const startGame = useCallback(() => {
    if (!isPlaying && !isGameOver) {
      setIsPlaying(true);
      timerRef.current = setInterval(() => {
        setTimeUsed(prev => prev + 1);
      }, 1000);
      
      if (externalHandlersRef.current?.onRevive && externalHandlersRef.current?.hasReviveItem !== undefined) {
        startMonsterMovement(externalHandlersRef.current.onRevive, externalHandlersRef.current.hasReviveItem);
      } else {
        startMonsterMovement();
      }
    }
  }, [isPlaying, isGameOver, startMonsterMovement]);

  const togglePause = useCallback(() => {
    if (isPlaying && !isGameOver) {
      setIsPaused(prev => !prev);
    }
  }, [isPlaying, isGameOver]);

  const canMoveTo = useCallback((x, y) => {
    if (!mapData) return false;
    if (x < 0 || x >= mapData.width || y < 0 || y >= mapData.height) return false;
    const tile = mapData.map[y][x];
    return tile !== TILE_TYPES.WALL;
  }, [mapData]);

  const getTileType = useCallback((x, y) => {
    if (!mapData || x < 0 || x >= mapData.width || y < 0 || y >= mapData.height) {
      return TILE_TYPES.WALL;
    }
    return mapData.map[y][x];
  }, [mapData]);

  const useItem = useCallback((itemId) => {
    const item = ITEM_DEFS[itemId];
    if (!item) return { success: false, message: '道具不存在' };

    const effect = item.effect;

    if (item.category === 'heal') {
      const healAmount = Math.floor(currentMaxHp * effect.heal);
      const actualHeal = Math.min(currentMaxHp - hpRef.current, healAmount);
      if (actualHeal <= 0) {
        return { success: false, message: '生命值已满' };
      }
      const newHp = hpRef.current + actualHeal;
      setHp(newHp);
      hpRef.current = newHp;
      return { success: true, type: 'heal', healAmount: actualHeal };
    }

    if (item.category === 'buff') {
      if (effect.attackBoost && buffsRef.current.attackBoost < effect.attackBoost) {
        setBuffs({ attackBoost: effect.attackBoost });
        buffsRef.current = { attackBoost: effect.attackBoost };
        return { success: true, type: 'buff', buff: effect };
      } else if (effect.attackBoost && buffsRef.current.attackBoost >= effect.attackBoost) {
        return { success: false, message: '已有更强的增益效果' };
      }
      return { success: true, type: 'buff', buff: effect };
    }

    if (item.category === 'revive') {
      return { success: true, type: 'revive', effect };
    }

    return { success: false, message: '无法使用此道具' };
  }, [currentMaxHp]);

  const takeDamage = useCallback((baseDamage) => {
    let damage = calculateDamage(baseDamage, currentDefense);

    if (damage > 0) {
      const newHp = Math.max(0, hpRef.current - damage);
      setHp(newHp);
      hpRef.current = newHp;
      
      if (newHp <= 0) {
        return { isDead: true, damage };
      }
    }

    return { isDead: false, damage };
  }, [currentDefense]);

  const checkCollision = useCallback((x, y, onRevive, hasReviveItem) => {
    if (gameEndedRef.current) return {};
    
    const tile = getTileType(x, y);
    
    if (tile === TILE_TYPES.TRAP) {
      const baseDamage = 25;
      const damageResult = takeDamage(baseDamage);
      
      setDamageFlash(true);
      setTimeout(() => setDamageFlash(false), 300);
      
      if (damageResult.isDead) {
        if (!wasRevived && hasReviveItem) {
          setWasRevived(true);
          if (onRevive) {
            const reviveHp = Math.floor(currentMaxHp * 0.5);
            setHp(reviveHp);
            hpRef.current = reviveHp;
            gameEndedRef.current = false;
            onRevive();
            return { revived: true, damage: baseDamage };
          }
        }
        
        gameEndedRef.current = true;
        setIsGameOver(true);
        setIsPlaying(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return { gameOver: true, win: false };
      }
      
      return { damaged: true, damage: baseDamage };
    }
    
    if (tile === TILE_TYPES.END) {
      gameEndedRef.current = true;
      setIsWin(true);
      setIsGameOver(true);
      setIsPlaying(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return { gameOver: true, win: true };
    }
    
    return {};
  }, [getTileType, takeDamage, wasRevived, currentMaxHp]);

  const movePlayer = useCallback((dx, dy, onRevive, hasReviveItem) => {
    if (!isPlaying || isPaused || isGameOver || !playerPosRef.current) return null;
    
    const newX = playerPosRef.current.x + dx;
    const newY = playerPosRef.current.y + dy;
    
    if (canMoveTo(newX, newY)) {
      setPlayerPos({ x: newX, y: newY });
      playerPosRef.current = { x: newX, y: newY };
      
      const collision = checkCollision(newX, newY, onRevive, hasReviveItem);
      return collision;
    }
    
    return null;
  }, [isPlaying, isPaused, isGameOver, canMoveTo, checkCollision]);

  const setExternalHandlers = useCallback((handlers) => {
    externalHandlersRef.current = handlers;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isPlaying || isPaused || isGameOver) return;
      
      let dx = 0, dy = 0;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          dy = -1;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          dy = 1;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          dx = -1;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          dx = 1;
          break;
        default:
          return;
      }
      
      e.preventDefault();
      
      if (externalHandlersRef.current?.onRevive && externalHandlersRef.current?.hasReviveItem !== undefined) {
        movePlayer(dx, dy, externalHandlersRef.current.onRevive, externalHandlersRef.current.hasReviveItem);
      } else {
        movePlayer(dx, dy);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isPaused, isGameOver, movePlayer]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    playerPos,
    hp,
    maxHp: currentMaxHp,
    attack: currentAttack,
    defense: currentDefense,
    buffs,
    wasRevived,
    isPlaying,
    isPaused,
    isGameOver,
    isWin,
    timeUsed,
    damageFlash,
    monsters,
    startGame,
    resetGame,
    togglePause,
    movePlayer,
    setExternalHandlers,
    getTileType,
    useItem
  };
}
