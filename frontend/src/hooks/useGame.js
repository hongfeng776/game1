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
  hp_potion_small: {
    id: 'hp_potion_small',
    name: '小型生命药水',
    icon: '🧪',
    category: 'heal',
    effect: { heal: 0.3, type: 'percent' }
  },
  hp_potion_medium: {
    id: 'hp_potion_medium',
    name: '中型生命药水',
    icon: '🧴',
    category: 'heal',
    effect: { heal: 0.6, type: 'percent' }
  },
  hp_potion_large: {
    id: 'hp_potion_large',
    name: '大型生命药水',
    icon: '⚗️',
    category: 'heal',
    effect: { heal: 1.0, type: 'percent' }
  },
  attack_boost: {
    id: 'attack_boost',
    name: '狂暴药剂',
    icon: '💪',
    category: 'buff',
    effect: { attackBoost: 0.5, duration: 'level' }
  },
  defense_boost: {
    id: 'defense_boost',
    name: '铁壁药剂',
    icon: '🛡️',
    category: 'buff',
    effect: { defenseBoost: 0.5, duration: 'level' }
  },
  revive: {
    id: 'revive',
    name: '复活卷轴',
    icon: '📜',
    category: 'revive',
    effect: { revive: true, healPercent: 0.5 }
  },
  speed_boost: {
    id: 'speed_boost',
    name: '疾风药剂',
    icon: '💨',
    category: 'buff',
    effect: { speedBoost: 0.3, duration: 'level' }
  },
  shield: {
    id: 'shield',
    name: '护盾水晶',
    icon: '💎',
    category: 'shield',
    effect: { shield: 50 }
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
  const [shield, setShield] = useState(0);
  const [buffs, setBuffs] = useState({
    attackBoost: 0,
    defenseBoost: 0,
    speedBoost: 0
  });
  const [wasRevived, setWasRevived] = useState(false);
  
  const timerRef = useRef(null);
  const playerPosRef = useRef(null);
  const hpRef = useRef(baseMaxHp);
  const shieldRef = useRef(0);
  const buffsRef = useRef({ attackBoost: 0, defenseBoost: 0, speedBoost: 0 });
  const gameEndedRef = useRef(false);
  const externalHandlersRef = useRef(null);

  const currentMaxHp = baseMaxHp;
  const currentAttack = Math.floor(baseAttack * (1 + buffs.attackBoost));
  const currentDefense = Math.floor(baseDefense * (1 + buffs.defenseBoost));

  useEffect(() => {
    hpRef.current = hp;
  }, [hp]);

  useEffect(() => {
    shieldRef.current = shield;
  }, [shield]);

  useEffect(() => {
    buffsRef.current = { ...buffs };
  }, [buffs.attackBoost, buffs.defenseBoost, buffs.speedBoost]);

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
      setShield(0);
      shieldRef.current = 0;
      setBuffs({ attackBoost: 0, defenseBoost: 0, speedBoost: 0 });
      buffsRef.current = { attackBoost: 0, defenseBoost: 0, speedBoost: 0 };
      setWasRevived(false);
      gameEndedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [mapData, baseMaxHp]);

  const startGame = useCallback(() => {
    if (!isPlaying && !isGameOver) {
      setIsPlaying(true);
      timerRef.current = setInterval(() => {
        setTimeUsed(prev => prev + 1);
      }, 1000);
    }
  }, [isPlaying, isGameOver]);

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
      const currentBuffs = { ...buffsRef.current };
      let updated = false;
      
      if (effect.attackBoost && currentBuffs.attackBoost < effect.attackBoost) {
        currentBuffs.attackBoost = effect.attackBoost;
        updated = true;
      }
      if (effect.defenseBoost && currentBuffs.defenseBoost < effect.defenseBoost) {
        currentBuffs.defenseBoost = effect.defenseBoost;
        updated = true;
      }
      if (effect.speedBoost && currentBuffs.speedBoost < effect.speedBoost) {
        currentBuffs.speedBoost = effect.speedBoost;
        updated = true;
      }
      
      if (!updated) {
        return { success: false, message: '已有更强的增益效果' };
      }
      
      setBuffs({ ...currentBuffs });
      buffsRef.current = { ...currentBuffs };
      return { success: true, type: 'buff', buff: effect };
    }

    if (item.category === 'shield') {
      const newShield = shieldRef.current + effect.shield;
      setShield(newShield);
      shieldRef.current = newShield;
      return { success: true, type: 'shield', shieldAmount: effect.shield };
    }

    if (item.category === 'revive') {
      return { success: true, type: 'revive', effect };
    }

    return { success: false, message: '无法使用此道具' };
  }, [currentMaxHp]);

  const takeDamage = useCallback((baseDamage) => {
    const defense = Math.floor(baseDefense * (1 + buffsRef.current.defenseBoost));
    let damage = calculateDamage(baseDamage, defense);
    
    let shieldAbsorbed = 0;
    if (shieldRef.current > 0) {
      shieldAbsorbed = Math.min(shieldRef.current, damage);
      const newShield = shieldRef.current - shieldAbsorbed;
      setShield(newShield);
      shieldRef.current = newShield;
      damage -= shieldAbsorbed;
    }

    if (damage > 0) {
      const newHp = Math.max(0, hpRef.current - damage);
      setHp(newHp);
      hpRef.current = newHp;
      
      if (newHp <= 0) {
        return { isDead: true, damage, shieldAbsorbed };
      }
    }

    return { isDead: false, damage, shieldAbsorbed };
  }, [baseDefense]);

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
            setShield(0);
            shieldRef.current = 0;
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
      
      return { damaged: true, damage: baseDamage, shieldAbsorbed: damageResult.shieldAbsorbed };
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
    shield,
    buffs,
    wasRevived,
    isPlaying,
    isPaused,
    isGameOver,
    isWin,
    timeUsed,
    damageFlash,
    startGame,
    resetGame,
    togglePause,
    movePlayer,
    setExternalHandlers,
    getTileType,
    useItem
  };
}
