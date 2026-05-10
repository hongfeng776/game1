const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const CHAPTERS = [
  {
    id: 1,
    name: '新手村',
    description: '冒险的起点',
    icon: '🏡',
    unlocked: true,
    levels: [1, 2, 3, 4, 5]
  },
  {
    id: 2,
    name: '森林深处',
    description: '神秘的绿色迷宫',
    icon: '🌲',
    unlocked: true,
    levels: [6, 7, 8, 9, 10]
  },
  {
    id: 3,
    name: '地下洞穴',
    description: '危险的地下世界',
    icon: '🕳️',
    unlocked: false,
    levels: [11, 12, 13, 14, 15]
  }
];

const DIFFICULTY_CONFIG = {
  easy: {
    id: 'easy',
    name: '简单',
    description: '适合新手玩家体验',
    icon: '😊',
    monsterMultiplier: 0.5,
    monsterSpeedMultiplier: 0.7,
    coinMultiplier: 1.0,
    color: '#4CAF50',
    monsterStrength: '较弱',
    monsterStrengthDesc: '怪物数量仅为普通难度的50%，移动速度较慢，伤害较低',
    rewardDesc: '金币奖励为基础值的100%，适合熟悉游戏机制'
  },
  normal: {
    id: 'normal',
    name: '普通',
    description: '标准难度，均衡的挑战与奖励',
    icon: '😐',
    monsterMultiplier: 1.0,
    monsterSpeedMultiplier: 1.0,
    coinMultiplier: 1.5,
    color: '#2196F3',
    monsterStrength: '普通',
    monsterStrengthDesc: '标准怪物数量和移动速度，需要一定的操作技巧',
    rewardDesc: '金币奖励为基础值的150%，推荐大多数玩家选择'
  },
  hard: {
    id: 'hard',
    name: '困难',
    description: '高难度挑战，丰厚奖励',
    icon: '😈',
    monsterMultiplier: 1.5,
    monsterSpeedMultiplier: 1.3,
    coinMultiplier: 2.0,
    color: '#f44336',
    monsterStrength: '强力',
    monsterStrengthDesc: '怪物数量为普通难度的150%，移动速度提升30%，需要高超的反应能力',
    rewardDesc: '金币奖励翻倍（200%），首次通关任意关卡还可获得稀有道具奖励！'
  }
};

const MONSTER_TYPES = {
  slime: {
    id: 'slime',
    name: '史莱姆',
    icon: '🟢',
    damage: 15,
    baseMoveInterval: 1500
  },
  bat: {
    id: 'bat',
    name: '蝙蝠',
    icon: '🦇',
    damage: 20,
    baseMoveInterval: 1200
  },
  ghost: {
    id: 'ghost',
    name: '幽灵',
    icon: '👻',
    damage: 25,
    baseMoveInterval: 1000
  }
};

function getDefaultMonsters(levelId) {
  const level = LEVEL_MAPS[levelId];
  if (!level) return [];
  
  const emptyTiles = [];
  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      const tile = level.map[y][x];
      if (tile === 0) {
        emptyTiles.push({ x, y });
      }
    }
  }
  
  const distFromStart = (pos) => {
    const dx = Math.abs(pos.x - level.startPos.x);
    const dy = Math.abs(pos.y - level.startPos.y);
    return dx + dy;
  };
  
  const distFromEnd = (pos) => {
    const dx = Math.abs(pos.x - level.endPos.x);
    const dy = Math.abs(pos.y - level.endPos.y);
    return dx + dy;
  };
  
  const safeTiles = emptyTiles.filter(pos => 
    distFromStart(pos) > 2 && distFromEnd(pos) > 2
  );
  
  const baseMonsterCount = Math.min(3 + Math.floor(levelId / 2), Math.floor(safeTiles.length * 0.3));
  const monsterTypes = Object.keys(MONSTER_TYPES);
  
  const monsters = [];
  const usedPositions = new Set();
  
  for (let i = 0; i < baseMonsterCount; i++) {
    if (safeTiles.length === 0) break;
    
    const randomIndex = Math.floor(Math.random() * safeTiles.length);
    const pos = safeTiles[randomIndex];
    const posKey = `${pos.x}-${pos.y}`;
    
    if (usedPositions.has(posKey)) continue;
    usedPositions.add(posKey);
    
    const monsterTypeKey = monsterTypes[i % monsterTypes.length];
    const monsterType = MONSTER_TYPES[monsterTypeKey];
    
    monsters.push({
      id: `monster-${i}`,
      type: monsterTypeKey,
      name: monsterType.name,
      icon: monsterType.icon,
      damage: monsterType.damage,
      baseMoveInterval: monsterType.baseMoveInterval,
      x: pos.x,
      y: pos.y,
      direction: Math.floor(Math.random() * 4)
    });
    
    safeTiles.splice(randomIndex, 1);
  }
  
  return monsters;
}

function applyDifficultyToMonsters(monsters, difficulty, levelId) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.normal;
  const level = LEVEL_MAPS[levelId];
  
  if (!level || monsters.length === 0) {
    return monsters.map(monster => ({
      ...monster,
      moveInterval: Math.floor(monster.baseMoveInterval / config.monsterSpeedMultiplier)
    }));
  }
  
  const baseMonsterCount = monsters.length;
  const adjustedMonsterCount = Math.ceil(baseMonsterCount * config.monsterMultiplier);
  const maxMonsterCount = Math.floor(level.width * level.height * 0.15);
  const finalMonsterCount = Math.min(adjustedMonsterCount, maxMonsterCount);
  
  let adjustedMonsters = [...monsters];
  const usedPositions = new Set();
  monsters.forEach(m => usedPositions.add(`${m.x}-${m.y}`));
  
  if (config.monsterMultiplier > 1 && baseMonsterCount > 0) {
    const positionsToAvoid = new Set();
    positionsToAvoid.add(`${level.startPos.x}-${level.startPos.y}`);
    positionsToAvoid.add(`${level.endPos.x}-${level.endPos.y}`);
    
    for (let i = 0; i < 3; i++) {
      positionsToAvoid.add(`${level.startPos.x + i}-${level.startPos.y}`);
      positionsToAvoid.add(`${level.startPos.x - i}-${level.startPos.y}`);
      positionsToAvoid.add(`${level.startPos.x}-${level.startPos.y + i}`);
      positionsToAvoid.add(`${level.startPos.x}-${level.startPos.y - i}`);
      positionsToAvoid.add(`${level.endPos.x + i}-${level.endPos.y}`);
      positionsToAvoid.add(`${level.endPos.x - i}-${level.endPos.y}`);
      positionsToAvoid.add(`${level.endPos.x}-${level.endPos.y + i}`);
      positionsToAvoid.add(`${level.endPos.x}-${level.endPos.y - i}`);
    }
    
    const directionOffsets = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
      { dx: 1, dy: 1 },
      { dx: -1, dy: -1 },
      { dx: 1, dy: -1 },
      { dx: -1, dy: 1 }
    ];
    
    let monsterIndex = baseMonsterCount;
    let attempts = 0;
    const maxAttempts = finalMonsterCount * 10;
    
    while (adjustedMonsters.length < finalMonsterCount && attempts < maxAttempts) {
      const originalMonster = adjustedMonsters[monsterIndex % baseMonsterCount];
      let placed = false;
      
      for (const offset of directionOffsets) {
        if (placed) break;
        
        const newX = originalMonster.x + offset.dx;
        const newY = originalMonster.y + offset.dy;
        const posKey = `${newX}-${newY}`;
        
        if (newX >= 0 && newX < level.width && 
            newY >= 0 && newY < level.height &&
            !usedPositions.has(posKey) && 
            !positionsToAvoid.has(posKey)) {
          const tile = level.map[newY][newX];
          if (tile === 0 || tile === 2 || tile === 3) {
            adjustedMonsters.push({
              ...originalMonster,
              id: `monster-${monsterIndex}`,
              x: newX,
              y: newY,
              direction: Math.floor(Math.random() * 4)
            });
            usedPositions.add(posKey);
            placed = true;
            monsterIndex++;
          }
        }
      }
      
      if (!placed) {
        for (let y = 1; y < level.height - 1 && !placed; y++) {
          for (let x = 1; x < level.width - 1 && !placed; x++) {
            const posKey = `${x}-${y}`;
            if (!usedPositions.has(posKey) && !positionsToAvoid.has(posKey)) {
              const tile = level.map[y][x];
              if (tile === 0) {
                adjustedMonsters.push({
                  ...originalMonster,
                  id: `monster-${monsterIndex}`,
                  x: x,
                  y: y,
                  direction: Math.floor(Math.random() * 4)
                });
                usedPositions.add(posKey);
                placed = true;
                monsterIndex++;
              }
            }
          }
        }
      }
      
      attempts++;
    }
  } else if (config.monsterMultiplier < 1) {
    adjustedMonsters = monsters.slice(0, finalMonsterCount);
  }
  
  return adjustedMonsters.map(monster => ({
    ...monster,
    moveInterval: Math.floor(monster.baseMoveInterval / config.monsterSpeedMultiplier)
  }));
}

const LEVEL_MAPS = {
  1: {
    id: 1,
    chapterId: 1,
    name: '第1关 - 新手教学',
    width: 10,
    height: 8,
    startPos: { x: 1, y: 1 },
    endPos: { x: 8, y: 6 },
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 2, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 0, 0, 4, 0, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 4, 0, 1],
      [1, 0, 0, 0, 4, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 3, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    coins: 100,
    experience: 50,
    timeLimit: 120
  },
  2: {
    id: 2,
    chapterId: 1,
    name: '第2关 - 初试身手',
    width: 12,
    height: 10,
    startPos: { x: 1, y: 1 },
    endPos: { x: 10, y: 8 },
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 0, 0, 4, 0, 1, 0, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 4, 1],
      [1, 0, 4, 0, 0, 0, 1, 0, 0, 1, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 4, 0, 0, 1],
      [1, 1, 0, 0, 0, 0, 4, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    coins: 150,
    experience: 80,
    timeLimit: 150
  },
  3: {
    id: 3,
    chapterId: 1,
    name: '第3关 - 障碍重重',
    width: 12,
    height: 10,
    startPos: { x: 1, y: 8 },
    endPos: { x: 10, y: 1 },
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 4, 0, 0, 0, 4, 0, 0, 3, 1],
      [1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 1],
      [1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1],
      [1, 0, 0, 0, 0, 4, 0, 0, 1, 0, 0, 1],
      [1, 0, 4, 0, 1, 0, 0, 4, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1],
      [1, 2, 0, 1, 0, 0, 0, 0, 4, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    coins: 200,
    experience: 100,
    timeLimit: 180
  },
  4: {
    id: 4,
    chapterId: 1,
    name: '第4关 - 迷宫探索',
    width: 14,
    height: 12,
    startPos: { x: 1, y: 1 },
    endPos: { x: 12, y: 10 },
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 2, 0, 0, 1, 0, 0, 4, 0, 0, 1, 0, 0, 1],
      [1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 4, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 4, 0, 0, 1, 0, 1],
      [1, 1, 0, 1, 0, 0, 4, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 4, 0, 1],
      [1, 0, 4, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 4, 0, 0, 0, 0, 1, 1],
      [1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 4, 0, 0, 1],
      [1, 0, 4, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 3, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    coins: 250,
    experience: 120,
    timeLimit: 200
  },
  5: {
    id: 5,
    chapterId: 1,
    name: '第5关 - 章节Boss',
    width: 14,
    height: 12,
    startPos: { x: 1, y: 1 },
    endPos: { x: 12, y: 10 },
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 2, 0, 4, 0, 0, 4, 0, 0, 4, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 4, 0, 1],
      [1, 4, 0, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 1],
      [1, 0, 0, 1, 0, 1, 0, 0, 4, 0, 0, 0, 4, 1],
      [1, 0, 4, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 4, 0, 0, 0, 0, 0, 4, 0, 0, 1],
      [1, 4, 1, 0, 0, 0, 4, 0, 1, 0, 0, 0, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 4, 0, 4, 0, 1],
      [1, 0, 4, 0, 0, 4, 0, 1, 0, 0, 1, 0, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 0, 4, 0, 0, 0, 3, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    coins: 500,
    experience: 200,
    timeLimit: 240
  },
  6: {
    id: 6,
    chapterId: 2,
    name: '第6关 - 森林入口',
    width: 14,
    height: 12,
    startPos: { x: 1, y: 10 },
    endPos: { x: 12, y: 1 },
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 0, 3, 1],
      [1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 4, 0, 0, 1],
      [1, 4, 0, 0, 4, 0, 0, 1, 4, 0, 0, 0, 1, 1],
      [1, 0, 0, 1, 0, 0, 4, 0, 0, 0, 0, 4, 0, 1],
      [1, 0, 4, 0, 0, 1, 0, 0, 1, 4, 0, 0, 0, 1],
      [1, 0, 0, 0, 4, 0, 0, 4, 0, 0, 1, 0, 0, 1],
      [1, 4, 1, 0, 0, 0, 1, 0, 0, 0, 0, 4, 1, 1],
      [1, 0, 0, 0, 1, 4, 0, 0, 4, 1, 0, 0, 0, 1],
      [1, 0, 4, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 2, 0, 1, 0, 4, 0, 0, 0, 4, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    coins: 300,
    experience: 150,
    timeLimit: 220
  },
  7: {
    id: 7,
    chapterId: 2,
    name: '第7关 - 迷雾森林',
    width: 16,
    height: 14,
    startPos: { x: 1, y: 1 },
    endPos: { x: 14, y: 12 },
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 2, 0, 0, 1, 0, 4, 0, 0, 1, 0, 0, 4, 0, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 4, 1],
      [1, 4, 0, 0, 0, 1, 4, 0, 0, 0, 4, 0, 0, 1, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 4, 0, 0, 1],
      [1, 0, 4, 0, 0, 4, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 4, 0, 0, 4, 0, 0, 4, 0, 1],
      [1, 4, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      [1, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 4, 0, 0, 1, 1],
      [1, 0, 4, 1, 0, 0, 4, 0, 0, 0, 1, 0, 0, 4, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 1, 4, 0, 0, 1, 0, 0, 1],
      [1, 4, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 3, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    coins: 350,
    experience: 180,
    timeLimit: 260
  },
  8: {
    id: 8,
    chapterId: 2,
    name: '第8关 - 古树迷宫',
    width: 16,
    height: 14,
    startPos: { x: 1, y: 12 },
    endPos: { x: 14, y: 1 },
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 4, 0, 0, 4, 0, 0, 4, 0, 0, 4, 0, 0, 3, 1],
      [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1],
      [1, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 4, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 0, 4, 1, 0, 0, 1, 0, 0, 1, 1],
      [1, 0, 0, 4, 0, 0, 1, 0, 0, 0, 4, 0, 0, 4, 0, 1],
      [1, 4, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 0, 4, 0, 0, 4, 0, 0, 0, 1, 1],
      [1, 0, 0, 4, 0, 0, 1, 0, 1, 0, 0, 1, 4, 0, 0, 1],
      [1, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 0, 4, 0, 0, 1, 0, 0, 0, 4, 1],
      [1, 0, 0, 4, 0, 0, 1, 0, 0, 4, 0, 4, 0, 1, 0, 1],
      [1, 2, 0, 0, 0, 4, 0, 0, 1, 0, 0, 0, 4, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    coins: 400,
    experience: 200,
    timeLimit: 280
  },
  9: {
    id: 9,
    chapterId: 2,
    name: '第9关 - 毒蘑菇陷阱',
    width: 16,
    height: 14,
    startPos: { x: 1, y: 1 },
    endPos: { x: 14, y: 12 },
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 2, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 4, 1],
      [1, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
      [1, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 4, 1],
      [1, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
      [1, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 4, 1],
      [1, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    coins: 450,
    experience: 220,
    timeLimit: 300
  },
  10: {
    id: 10,
    chapterId: 2,
    name: '第10关 - 森林守护',
    width: 16,
    height: 14,
    startPos: { x: 1, y: 12 },
    endPos: { x: 14, y: 1 },
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 3, 1],
      [1, 0, 0, 1, 0, 0, 1, 4, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 4, 0, 0, 4, 0, 0, 0, 4, 0, 0, 4, 0, 0, 0, 1],
      [1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 4, 0, 1, 1],
      [1, 0, 0, 4, 0, 0, 4, 0, 0, 4, 0, 0, 0, 4, 0, 1],
      [1, 4, 0, 0, 1, 0, 0, 0, 1, 0, 0, 4, 1, 0, 0, 1],
      [1, 0, 1, 4, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 1, 1],
      [1, 0, 0, 0, 0, 1, 0, 1, 4, 1, 0, 0, 4, 0, 0, 1],
      [1, 4, 0, 4, 0, 0, 0, 0, 0, 0, 4, 0, 0, 4, 0, 1],
      [1, 0, 1, 0, 1, 4, 1, 0, 4, 0, 0, 1, 0, 0, 4, 1],
      [1, 0, 0, 4, 0, 0, 0, 4, 0, 0, 4, 0, 4, 0, 0, 1],
      [1, 2, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    coins: 600,
    experience: 250,
    timeLimit: 320
  }
};

const MAX_INVENTORY_SLOTS = 10;
const MAX_ITEMS_PER_TYPE = 5;
const MAX_CARRY_ITEMS = 2;

const ITEMS = {
  hp_potion: {
    id: 'hp_potion',
    name: '生命药水',
    icon: '�',
    type: 'consumable',
    category: 'heal',
    description: '恢复 30% 最大生命值',
    effect: { heal: 0.3, type: 'percent' },
    rarity: 'common',
    stackable: true,
    maxStack: MAX_ITEMS_PER_TYPE
  },
  attack_boost: {
    id: 'attack_boost',
    name: '狂暴药剂',
    icon: '💪',
    type: 'consumable',
    category: 'buff',
    description: '使用后 5 分钟内攻击力 +20%',
    effect: { attackBoost: 0.2, duration: 300 },
    rarity: 'uncommon',
    stackable: true,
    maxStack: MAX_ITEMS_PER_TYPE
  },
  revive_scroll: {
    id: 'revive_scroll',
    name: '复活卷轴',
    icon: '📜',
    type: 'consumable',
    category: 'revive',
    description: '死亡时原地复活并恢复 50% 生命值',
    effect: { revive: true, healPercent: 0.5 },
    rarity: 'rare',
    stackable: true,
    maxStack: MAX_ITEMS_PER_TYPE
  }
};

const SKINS = {
  default: {
    id: 'default',
    name: '经典法师',
    icon: '🧙',
    description: '初始皮肤，经典的法师造型',
    rarity: 'common',
    type: 'common',
    price: 0,
    unlocked: true,
    color: '#667eea',
    isSpecial: false
  },
  fire_mage: {
    id: 'fire_mage',
    name: '火焰法师',
    icon: '🧙‍♂️',
    description: '炽热的火焰法师，全身散发着火焰的气息',
    rarity: 'common',
    type: 'common',
    price: 500,
    unlocked: false,
    color: '#FF6B6B',
    isSpecial: false
  },
  ice_mage: {
    id: 'ice_mage',
    name: '冰霜法师',
    icon: '🧙‍♀️',
    description: '冰冷的冰霜法师，散发着寒气',
    rarity: 'common',
    type: 'common',
    price: 600,
    unlocked: false,
    color: '#4ECDC4',
    isSpecial: false
  },
  thunder_mage: {
    id: 'thunder_mage',
    name: '雷电法师',
    icon: '⚡',
    description: '掌控雷电的法师，身绕电光',
    rarity: 'common',
    type: 'common',
    price: 800,
    unlocked: false,
    color: '#FFD93D',
    isSpecial: false
  },
  nature_mage: {
    id: 'nature_mage',
    name: '自然法师',
    icon: '🌿',
    description: '与自然和谐共处的法师',
    rarity: 'common',
    type: 'common',
    price: 700,
    unlocked: false,
    color: '#4CAF50',
    isSpecial: false
  },
  shadow_mage: {
    id: 'shadow_mage',
    name: '暗影法师',
    icon: '🌙',
    description: '【稀有】连续签到7天解锁，神秘的暗影力量',
    rarity: 'rare',
    type: 'rare',
    price: 0,
    unlocked: false,
    requiredSignInDays: 7,
    color: '#9C27B0',
    isSpecial: true
  },
  golden_mage: {
    id: 'golden_mage',
    name: '黄金法师',
    icon: '👑',
    description: '【稀有】连续签到14天解锁，闪耀的黄金之身',
    rarity: 'rare',
    type: 'rare',
    price: 0,
    unlocked: false,
    requiredSignInDays: 14,
    color: '#FFD700',
    isSpecial: true
  },
  rainbow_mage: {
    id: 'rainbow_mage',
    name: '彩虹法师',
    icon: '🌈',
    description: '【稀有】连续签到21天解锁，七彩光芒的化身',
    rarity: 'rare',
    type: 'rare',
    price: 0,
    unlocked: false,
    requiredSignInDays: 21,
    color: 'linear-gradient(90deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #9C27B0)',
    isSpecial: true
  },
  cosmic_mage: {
    id: 'cosmic_mage',
    name: '宇宙法师',
    icon: '🌌',
    description: '【稀有】连续签到28天解锁，宇宙星辰的化身',
    rarity: 'rare',
    type: 'rare',
    price: 0,
    unlocked: false,
    requiredSignInDays: 28,
    color: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    isSpecial: true
  }
};

function getSkin(skinId) {
  return SKINS[skinId] || null;
}

function isSkinUnlocked(user, skinId) {
  const skin = getSkin(skinId);
  if (!skin) return false;
  
  if (skin.unlocked) return true;
  
  if (user.unlockedSkins && user.unlockedSkins.includes(skinId)) {
    return true;
  }
  
  if (skin.type === 'rare' && skin.requiredSignInDays) {
    if (user.signInStreak >= skin.requiredSignInDays) {
      if (!user.unlockedSkins) user.unlockedSkins = [];
      if (!user.unlockedSkins.includes(skinId)) {
        user.unlockedSkins.push(skinId);
      }
      return true;
    }
  }
  
  return false;
}

function getMaxInventorySlots() {
  return MAX_INVENTORY_SLOTS;
}

const ACHIEVEMENTS = {
  first_level: {
    id: 'first_level',
    name: '初出茅庐',
    description: '完成第一个关卡',
    icon: '🎯',
    reward: { itemId: 'hp_potion', quantity: 2 },
    check: (user, levels) => levels.filter(l => l.isCompleted).length >= 1
  },
  ten_levels: {
    id: 'ten_levels',
    name: '勇往直前',
    description: '完成 10 个关卡',
    icon: '🏆',
    reward: { itemId: 'hp_potion', quantity: 3 },
    check: (user, levels) => levels.filter(l => l.isCompleted).length >= 10
  },
  all_stars: {
    id: 'all_stars',
    name: '完美收集',
    description: '获得 30 颗星星',
    icon: '⭐',
    reward: { itemId: 'revive_scroll', quantity: 2 },
    check: (user, levels) => user.totalStars >= 30
  },
  level_5: {
    id: 'level_5',
    name: '崭露头角',
    description: '角色达到 5 级',
    icon: '🌟',
    reward: { itemId: 'hp_potion', quantity: 3 },
    check: (user, levels) => user.level >= 5
  },
  level_10: {
    id: 'level_10',
    name: '小有所成',
    description: '角色达到 10 级',
    icon: '💎',
    reward: { itemId: 'attack_boost', quantity: 2 },
    check: (user, levels) => user.level >= 10
  }
};

const ALL_DAILY_TASKS = [
  {
    id: 'complete_level',
    name: '勇者试炼',
    description: '完成任意1个关卡',
    icon: '🎯',
    target: 1,
    reward: {
      coins: 100,
      experience: 50
    },
    trackType: 'level_complete'
  },
  {
    id: 'complete_level_3',
    name: '挑战极限',
    description: '完成任意3个关卡',
    icon: '🏆',
    target: 3,
    reward: {
      coins: 250,
      experience: 120
    },
    trackType: 'level_complete'
  },
  {
    id: 'use_item',
    name: '道具达人',
    description: '在游戏中使用任意1个道具',
    icon: '🧪',
    target: 1,
    reward: {
      coins: 80,
      experience: 30
    },
    trackType: 'item_use'
  },
  {
    id: 'use_item_3',
    name: '道具大师',
    description: '在游戏中使用任意3个道具',
    icon: '💎',
    target: 3,
    reward: {
      coins: 200,
      experience: 80
    },
    trackType: 'item_use'
  },
  {
    id: 'daily_signin',
    name: '每日报到',
    description: '完成当日签到',
    icon: '📅',
    target: 1,
    reward: {
      coins: 50,
      experience: 20
    },
    trackType: 'signin'
  },
  {
    id: 'collect_coins',
    name: '金币收集者',
    description: '在游戏中获得200金币',
    icon: '💰',
    target: 200,
    reward: {
      coins: 100,
      experience: 40
    },
    trackType: 'coins_earned'
  },
  {
    id: 'gain_experience',
    name: '经验积累者',
    description: '在游戏中获得100经验',
    icon: '⚡',
    target: 100,
    reward: {
      coins: 120,
      experience: 50
    },
    trackType: 'exp_earned'
  },
  {
    id: 'perfect_level',
    name: '完美通关',
    description: '完成任意1个关卡并获得3星评价',
    icon: '⭐',
    target: 1,
    reward: {
      coins: 150,
      experience: 80
    },
    trackType: 'perfect_level'
  }
];

const DAILY_TASKS = [
  {
    id: 'complete_level',
    name: '勇者试炼',
    description: '完成任意1个关卡',
    icon: '🎯',
    target: 1,
    reward: {
      coins: 100,
      experience: 50
    },
    trackType: 'level_complete'
  },
  {
    id: 'use_item',
    name: '道具达人',
    description: '在游戏中使用任意1个道具',
    icon: '🧪',
    target: 1,
    reward: {
      coins: 80,
      experience: 30
    },
    trackType: 'item_use'
  },
  {
    id: 'daily_signin',
    name: '每日报到',
    description: '完成当日签到',
    icon: '📅',
    target: 1,
    reward: {
      coins: 50,
      experience: 20
    },
    trackType: 'signin'
  }
];

function getTodayDate() {
  return new Date().toDateString();
}

function getDefaultDailyTasks() {
  const today = getTodayDate();
  return DAILY_TASKS.map(task => ({
    ...task,
    progress: 0,
    isCompleted: false,
    isClaimed: false,
    lastUpdateDate: today
  }));
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getRandomDailyTasks(count = 3) {
  const shuffled = shuffleArray(ALL_DAILY_TASKS);
  const selected = [];
  const usedTypes = new Set();
  
  for (const task of shuffled) {
    if (selected.length >= count) break;
    
    if (!usedTypes.has(task.trackType)) {
      selected.push(task);
      usedTypes.add(task.trackType);
    }
  }
  
  while (selected.length < count) {
    const available = shuffled.filter(t => !selected.includes(t));
    if (available.length === 0) break;
    selected.push(available[Math.floor(Math.random() * available.length)]);
  }
  
  return selected;
}

function checkAndResetDailyTasks(user) {
  const today = getTodayDate();
  
  if (!user.dailyTasks || !user.lastDailyTaskDate || user.lastDailyTaskDate !== today) {
    user.dailyTasks = getDefaultDailyTasks();
    user.lastDailyTaskDate = today;
    user.dailyTaskRefreshCount = 1;
    user.lastDailyTaskRefreshDate = today;
  }
  
  if (!user.dailyTaskRefreshCount || user.dailyTaskRefreshCount === undefined) {
    user.dailyTaskRefreshCount = 1;
  }
  
  if (!user.lastDailyTaskRefreshDate || user.lastDailyTaskRefreshDate !== today) {
    user.dailyTaskRefreshCount = 1;
    user.lastDailyTaskRefreshDate = today;
  }
  
  return user.dailyTasks;
}

function updateTaskProgress(user, trackType, amount = 1) {
  const tasks = checkAndResetDailyTasks(user);
  let updated = false;
  
  tasks.forEach(task => {
    if (task.trackType === trackType && !task.isCompleted) {
      const newProgress = Math.min(task.progress + amount, task.target);
      if (newProgress !== task.progress) {
        task.progress = newProgress;
        task.isCompleted = task.progress >= task.target;
        updated = true;
      }
    }
  });
  
  return updated;
}

const mockData = {
  user: {
    id: 1,
    nickname: '小玩家',
    avatar: '',
    level: 1,
    experience: 0,
    nextLevelExp: 100,
    coins: 500,
    diamonds: 10,
    totalStars: 0,
    completedLevels: 0,
    achievementCount: 0,
    maxHp: 100,
    attack: 10,
    defense: 5,
    speed: 1,
    hp: 100,
    attributeLevels: {
      hp: 1,
      attack: 1,
      defense: 1,
      speed: 1
    },
    inventory: {
      hp_potion: 3,
      attack_boost: 2,
      revive_scroll: 1
    },
    carriedItems: [],
    lastSignInDate: null,
    signInStreak: 0,
    lastSupplementalMonth: null,
    freeSupplementalCount: 1,
    completedAchievements: [],
    previousLevel: 1,
    hasFirstHardClearReward: false,
    currentSkin: 'default',
    unlockedSkins: ['default'],
    dailyTasks: null,
    lastDailyTaskDate: null,
    dailyTaskRefreshCount: 1,
    lastDailyTaskRefreshDate: null
  },
  levels: [],
  chapters: JSON.parse(JSON.stringify(CHAPTERS)),
  settings: {
    musicVolume: 80,
    sfxVolume: 70,
    language: 'zh-CN',
    notifications: true,
    vibration: true
  }
};

Object.keys(LEVEL_MAPS).forEach(levelId => {
  const id = parseInt(levelId);
  const map = LEVEL_MAPS[id];
  const chapter = CHAPTERS.find(c => c.levels.includes(id));
  mockData.levels.push({
    id: id,
    chapterId: chapter ? chapter.id : 1,
    name: map.name,
    stars: 0,
    isCompleted: false,
    isUnlocked: id === 1,
    bestTime: null
  });
});

const mockPlayers = [
  {
    id: 1,
    nickname: '战神阿瑞斯',
    avatar: '',
    level: 45,
    experience: 4500,
    nextLevelExp: 1000,
    coins: 95000,
    diamonds: 850,
    totalStars: 250,
    completedLevels: 85,
    achievementCount: 35,
    maxHp: 850,
    attack: 125,
    defense: 85,
    speed: 2.1,
    hp: 850,
    attributeLevels: {
      hp: 45,
      attack: 42,
      defense: 40,
      speed: 38
    },
    inventory: {},
    carriedItems: [],
    lastSignInDate: null,
    signInStreak: 0,
    lastSupplementalMonth: null,
    freeSupplementalCount: 1,
    completedAchievements: [],
    previousLevel: 45,
    hasFirstHardClearReward: true,
    currentSkin: 'cosmic_mage',
    unlockedSkins: ['default', 'fire_mage', 'ice_mage', 'thunder_mage', 'nature_mage', 'shadow_mage', 'golden_mage', 'rainbow_mage', 'cosmic_mage']
  },
  {
    id: 2,
    nickname: '雷霆战神',
    avatar: '',
    level: 38,
    experience: 3800,
    nextLevelExp: 1000,
    coins: 78000,
    diamonds: 620,
    totalStars: 210,
    completedLevels: 72,
    achievementCount: 28,
    maxHp: 720,
    attack: 105,
    defense: 72,
    speed: 1.9,
    hp: 720,
    attributeLevels: {
      hp: 38,
      attack: 35,
      defense: 33,
      speed: 32
    },
    inventory: {},
    carriedItems: [],
    lastSignInDate: null,
    signInStreak: 0,
    lastSupplementalMonth: null,
    freeSupplementalCount: 1,
    completedAchievements: [],
    previousLevel: 38,
    hasFirstHardClearReward: true,
    currentSkin: 'rainbow_mage',
    unlockedSkins: ['default', 'fire_mage', 'ice_mage', 'thunder_mage', 'nature_mage', 'shadow_mage', 'golden_mage', 'rainbow_mage']
  },
  {
    id: 3,
    nickname: '暗影猎手',
    avatar: '',
    level: 32,
    experience: 3200,
    nextLevelExp: 1000,
    coins: 65000,
    diamonds: 480,
    totalStars: 180,
    completedLevels: 62,
    achievementCount: 22,
    maxHp: 620,
    attack: 90,
    defense: 62,
    speed: 1.7,
    hp: 620,
    attributeLevels: {
      hp: 32,
      attack: 30,
      defense: 28,
      speed: 27
    },
    inventory: {},
    carriedItems: [],
    lastSignInDate: null,
    signInStreak: 0,
    lastSupplementalMonth: null,
    freeSupplementalCount: 1,
    completedAchievements: [],
    previousLevel: 32,
    hasFirstHardClearReward: true,
    currentSkin: 'golden_mage',
    unlockedSkins: ['default', 'fire_mage', 'ice_mage', 'thunder_mage', 'nature_mage', 'shadow_mage', 'golden_mage']
  },
  {
    id: 4,
    nickname: '冰霜女王',
    avatar: '',
    level: 28,
    experience: 2800,
    nextLevelExp: 1000,
    coins: 56000,
    diamonds: 420,
    totalStars: 155,
    completedLevels: 55,
    achievementCount: 18,
    maxHp: 540,
    attack: 80,
    defense: 55,
    speed: 1.6,
    hp: 540,
    attributeLevels: {
      hp: 28,
      attack: 26,
      defense: 25,
      speed: 24
    },
    inventory: {},
    carriedItems: [],
    lastSignInDate: null,
    signInStreak: 0,
    lastSupplementalMonth: null,
    freeSupplementalCount: 1,
    completedAchievements: [],
    previousLevel: 28,
    hasFirstHardClearReward: true,
    currentSkin: 'ice_mage',
    unlockedSkins: ['default', 'fire_mage', 'ice_mage', 'thunder_mage', 'nature_mage', 'shadow_mage']
  },
  {
    id: 5,
    nickname: '火焰大师',
    avatar: '',
    level: 25,
    experience: 2500,
    nextLevelExp: 1000,
    coins: 50000,
    diamonds: 380,
    totalStars: 140,
    completedLevels: 48,
    achievementCount: 15,
    maxHp: 480,
    attack: 72,
    defense: 50,
    speed: 1.5,
    hp: 480,
    attributeLevels: {
      hp: 25,
      attack: 24,
      defense: 22,
      speed: 22
    },
    inventory: {},
    carriedItems: [],
    lastSignInDate: null,
    signInStreak: 0,
    lastSupplementalMonth: null,
    freeSupplementalCount: 1,
    completedAchievements: [],
    previousLevel: 25,
    hasFirstHardClearReward: true,
    currentSkin: 'fire_mage',
    unlockedSkins: ['default', 'fire_mage', 'ice_mage', 'thunder_mage', 'nature_mage']
  },
  {
    id: 6,
    nickname: '自然守护者',
    avatar: '',
    level: 22,
    experience: 2200,
    nextLevelExp: 1000,
    coins: 44000,
    diamonds: 320,
    totalStars: 125,
    completedLevels: 42,
    achievementCount: 13,
    maxHp: 430,
    attack: 65,
    defense: 45,
    speed: 1.45,
    hp: 430,
    attributeLevels: {
      hp: 22,
      attack: 21,
      defense: 20,
      speed: 19
    },
    inventory: {},
    carriedItems: [],
    lastSignInDate: null,
    signInStreak: 0,
    lastSupplementalMonth: null,
    freeSupplementalCount: 1,
    completedAchievements: [],
    previousLevel: 22,
    hasFirstHardClearReward: true,
    currentSkin: 'nature_mage',
    unlockedSkins: ['default', 'fire_mage', 'ice_mage', 'thunder_mage', 'nature_mage']
  },
  {
    id: 7,
    nickname: '闪电侠',
    avatar: '',
    level: 20,
    experience: 2000,
    nextLevelExp: 1000,
    coins: 40000,
    diamonds: 300,
    totalStars: 115,
    completedLevels: 38,
    achievementCount: 12,
    maxHp: 400,
    attack: 60,
    defense: 42,
    speed: 1.5,
    hp: 400,
    attributeLevels: {
      hp: 20,
      attack: 19,
      defense: 18,
      speed: 20
    },
    inventory: {},
    carriedItems: [],
    lastSignInDate: null,
    signInStreak: 0,
    lastSupplementalMonth: null,
    freeSupplementalCount: 1,
    completedAchievements: [],
    previousLevel: 20,
    hasFirstHardClearReward: true,
    currentSkin: 'thunder_mage',
    unlockedSkins: ['default', 'fire_mage', 'ice_mage', 'thunder_mage']
  },
  {
    id: 8,
    nickname: '勇敢的心',
    avatar: '',
    level: 18,
    experience: 1800,
    nextLevelExp: 1000,
    coins: 36000,
    diamonds: 280,
    totalStars: 105,
    completedLevels: 35,
    achievementCount: 10,
    maxHp: 360,
    attack: 55,
    defense: 40,
    speed: 1.35,
    hp: 360,
    attributeLevels: {
      hp: 18,
      attack: 17,
      defense: 16,
      speed: 15
    },
    inventory: {},
    carriedItems: [],
    lastSignInDate: null,
    signInStreak: 0,
    lastSupplementalMonth: null,
    freeSupplementalCount: 1,
    completedAchievements: [],
    previousLevel: 18,
    hasFirstHardClearReward: true,
    currentSkin: 'fire_mage',
    unlockedSkins: ['default', 'fire_mage', 'ice_mage']
  },
  {
    id: 9,
    nickname: '新手冒险家',
    avatar: '',
    level: 15,
    experience: 1500,
    nextLevelExp: 1000,
    coins: 30000,
    diamonds: 220,
    totalStars: 90,
    completedLevels: 30,
    achievementCount: 8,
    maxHp: 300,
    attack: 45,
    defense: 35,
    speed: 1.3,
    hp: 300,
    attributeLevels: {
      hp: 15,
      attack: 14,
      defense: 13,
      speed: 12
    },
    inventory: {},
    carriedItems: [],
    lastSignInDate: null,
    signInStreak: 0,
    lastSupplementalMonth: null,
    freeSupplementalCount: 1,
    completedAchievements: [],
    previousLevel: 15,
    hasFirstHardClearReward: false,
    currentSkin: 'default',
    unlockedSkins: ['default', 'fire_mage']
  },
  {
    id: 10,
    nickname: '小菜鸟',
    avatar: '',
    level: 12,
    experience: 1200,
    nextLevelExp: 1000,
    coins: 24000,
    diamonds: 180,
    totalStars: 75,
    completedLevels: 25,
    achievementCount: 6,
    maxHp: 250,
    attack: 38,
    defense: 30,
    speed: 1.25,
    hp: 250,
    attributeLevels: {
      hp: 12,
      attack: 11,
      defense: 10,
      speed: 9
    },
    inventory: {},
    carriedItems: [],
    lastSignInDate: null,
    signInStreak: 0,
    lastSupplementalMonth: null,
    freeSupplementalCount: 1,
    completedAchievements: [],
    previousLevel: 12,
    hasFirstHardClearReward: false,
    currentSkin: 'default',
    unlockedSkins: ['default']
  },
  {
    id: 11,
    nickname: '潜力新星',
    avatar: '',
    level: 10,
    experience: 1000,
    nextLevelExp: 1000,
    coins: 20000,
    diamonds: 150,
    totalStars: 60,
    completedLevels: 20,
    achievementCount: 5,
    maxHp: 220,
    attack: 33,
    defense: 26,
    speed: 1.2,
    hp: 220,
    attributeLevels: {
      hp: 10,
      attack: 9,
      defense: 8,
      speed: 8
    },
    inventory: {},
    carriedItems: [],
    lastSignInDate: null,
    signInStreak: 0,
    lastSupplementalMonth: null,
    freeSupplementalCount: 1,
    completedAchievements: [],
    previousLevel: 10,
    hasFirstHardClearReward: false,
    currentSkin: 'default',
    unlockedSkins: ['default']
  },
  {
    id: 12,
    nickname: '初露锋芒',
    avatar: '',
    level: 8,
    experience: 800,
    nextLevelExp: 1000,
    coins: 16000,
    diamonds: 120,
    totalStars: 50,
    completedLevels: 16,
    achievementCount: 4,
    maxHp: 180,
    attack: 28,
    defense: 22,
    speed: 1.15,
    hp: 180,
    attributeLevels: {
      hp: 8,
      attack: 7,
      defense: 6,
      speed: 6
    },
    inventory: {},
    carriedItems: [],
    lastSignInDate: null,
    signInStreak: 0,
    lastSupplementalMonth: null,
    freeSupplementalCount: 1,
    completedAchievements: [],
    previousLevel: 8,
    hasFirstHardClearReward: false,
    currentSkin: 'default',
    unlockedSkins: ['default']
  }
];

const mockPlayersPool = [
  '游戏达人', '快乐玩家', '高手如云', '独孤求败', '一代宗师',
  '武林盟主', '江湖侠士', '侠客行', '笑傲江湖', '神雕侠侣',
  '倚天屠龙', '天龙八部', '射雕英雄', '碧血剑', '鹿鼎记',
  '风云再起', '战无不胜', '攻无不克', '百战百胜', '天下无双',
  '绝世高手', '隐世高人', '武林神话', '传奇人物', '千古一帝',
  '王者归来', '不败神话', '至尊强者', '巅峰王者', '荣耀王者'
];

function generateRandomPlayer(id) {
  const nickname = mockPlayersPool[(id - 1) % mockPlayersPool.length] + (Math.floor(id / 30) > 0 ? id : '');
  const level = Math.max(1, 45 - Math.floor(id / 2));
  const completedLevels = Math.max(1, 85 - Math.floor(id * 2));
  const totalStars = Math.max(3, 250 - Math.floor(id * 5));
  
  return {
    id,
    nickname,
    avatar: '',
    level,
    experience: level * 100,
    nextLevelExp: 1000,
    coins: Math.max(500, 95000 - id * 2000),
    diamonds: Math.max(10, 850 - id * 15),
    totalStars,
    completedLevels,
    achievementCount: Math.max(1, 35 - Math.floor(id / 2)),
    maxHp: Math.max(100, 850 - id * 15),
    attack: Math.max(10, 125 - id * 2),
    defense: Math.max(5, 85 - id * 1.5),
    speed: Math.max(1, 2.1 - id * 0.02),
    hp: Math.max(100, 850 - id * 15),
    attributeLevels: {
      hp: Math.max(1, 45 - Math.floor(id / 2)),
      attack: Math.max(1, 42 - Math.floor(id / 2)),
      defense: Math.max(1, 40 - Math.floor(id / 2)),
      speed: Math.max(1, 38 - Math.floor(id / 2))
    },
    inventory: {},
    carriedItems: [],
    lastSignInDate: null,
    signInStreak: 0,
    lastSupplementalMonth: null,
    freeSupplementalCount: 1,
    completedAchievements: [],
    previousLevel: level,
    hasFirstHardClearReward: id <= 10,
    currentSkin: 'default',
    unlockedSkins: ['default']
  };
}

for (let i = 13; i <= 120; i++) {
  mockPlayers.push(generateRandomPlayer(i));
}

function getLevelExpRequirement(level) {
  return 100 + (level - 1) * 50;
}

function getMaxHp(level) {
  return 100 + (level - 1) * 10;
}

function getAttack(level) {
  return 10 + (level - 1) * 2;
}

function getDefense(level) {
  return 5 + (level - 1) * 1;
}

function getSpeed(level) {
  return 1 + Math.floor((level - 1) / 5) * 0.1;
}

function getAttributeCost(attributeType, currentLevel) {
  const baseCosts = {
    hp: 50,
    attack: 80,
    defense: 70,
    speed: 100
  };
  const baseCost = baseCosts[attributeType] || 50;
  return Math.floor(baseCost * Math.pow(1.15, currentLevel - 1));
}

function getHpByAttributeLevel(level) {
  return 100 + (level - 1) * 20 + Math.floor((level - 1) * (level - 1) * 2);
}

function getAttackByAttributeLevel(level) {
  return 10 + (level - 1) * 5 + Math.floor((level - 1) * (level - 1) * 0.5);
}

function getDefenseByAttributeLevel(level) {
  return 5 + (level - 1) * 3 + Math.floor((level - 1) * (level - 1) * 0.3);
}

function getSpeedByAttributeLevel(level) {
  return 1 + (level - 1) * 0.05 + Math.floor((level - 1) / 5) * 0.1;
}

function calculateBaseAttributes(user) {
  const { attributeLevels } = user;
  return {
    maxHp: getHpByAttributeLevel(attributeLevels.hp),
    attack: getAttackByAttributeLevel(attributeLevels.attack),
    defense: getDefenseByAttributeLevel(attributeLevels.defense),
    speed: getSpeedByAttributeLevel(attributeLevels.speed)
  };
}

function upgradeAttribute(user, attributeType) {
  const validAttributes = ['hp', 'attack', 'defense', 'speed'];
  if (!validAttributes.includes(attributeType)) {
    return { success: false, message: '无效的属性类型' };
  }

  const currentLevel = user.attributeLevels[attributeType];
  const maxLevel = 50;
  if (currentLevel >= maxLevel) {
    return { success: false, message: '属性已达最高等级' };
  }

  const cost = getAttributeCost(attributeType, currentLevel);
  if (user.coins < cost) {
    return { success: false, message: '金币不足' };
  }

  user.coins -= cost;
  user.attributeLevels[attributeType] += 1;

  const newAttributes = calculateBaseAttributes(user);
  user.maxHp = newAttributes.maxHp;
  user.attack = newAttributes.attack;
  user.defense = newAttributes.defense;
  user.speed = newAttributes.speed;
  user.hp = user.maxHp;

  return {
    success: true,
    data: {
      attributeType,
      newLevel: user.attributeLevels[attributeType],
      cost,
      remainingCoins: user.coins,
      newAttributes: {
        maxHp: user.maxHp,
        attack: user.attack,
        defense: user.defense,
        speed: user.speed
      }
    }
  };
}

function checkLevelUp(user) {
  let leveledUp = false;
  while (user.experience >= user.nextLevelExp) {
    user.experience -= user.nextLevelExp;
    user.level++;
    user.nextLevelExp = getLevelExpRequirement(user.level);
    leveledUp = true;
  }
  return leveledUp;
}

function getItem(itemId) {
  return ITEMS[itemId] || null;
}

function getInventoryCount(user, itemId) {
  return user.inventory[itemId] || 0;
}

function addItemToInventory(user, itemId, quantity = 1) {
  const item = getItem(itemId);
  if (!item) return { success: false, message: '道具不存在' };
  
  const currentTypes = Object.keys(user.inventory).filter(k => user.inventory[k] > 0);
  const isNewType = !user.inventory[itemId] || user.inventory[itemId] === 0;
  
  if (isNewType && currentTypes.length >= MAX_INVENTORY_SLOTS) {
    return { success: false, message: '背包已满' };
  }
  
  if (!user.inventory[itemId]) {
    user.inventory[itemId] = 0;
  }
  
  const newQuantity = Math.min(
    user.inventory[itemId] + quantity,
    MAX_ITEMS_PER_TYPE
  );
  
  user.inventory[itemId] = newQuantity;
  
  return { success: true, quantity: user.inventory[itemId] };
}

function removeItemFromInventory(user, itemId, quantity = 1) {
  if (!user.inventory[itemId] || user.inventory[itemId] < quantity) {
    return { success: false, message: '道具数量不足' };
  }
  
  user.inventory[itemId] -= quantity;
  if (user.inventory[itemId] <= 0) {
    delete user.inventory[itemId];
  }
  
  return { success: true, remaining: user.inventory[itemId] || 0 };
}

function generateRandomDrops(levelId) {
  const drops = [];
  
  if (Math.random() < 0.3) {
    const possibleDrops = [
      { itemId: 'hp_potion', weight: 50 },
      { itemId: 'attack_boost', weight: 35 },
      { itemId: 'revive_scroll', weight: 15 }
    ];
    
    const totalWeight = possibleDrops.reduce((sum, d) => sum + d.weight, 0);
    let random = Math.random() * totalWeight;
    
    let selectedDrop = possibleDrops[0];
    for (const drop of possibleDrops) {
      random -= drop.weight;
      if (random <= 0) {
        selectedDrop = drop;
        break;
      }
    }
    
    drops.push({
      itemId: selectedDrop.itemId,
      item: getItem(selectedDrop.itemId),
      quantity: 1
    });
  }
  
  return drops;
}

function applyDropsToInventory(user, drops) {
  const applied = [];
  drops.forEach(drop => {
    const result = addItemToInventory(user, drop.itemId, drop.quantity);
    if (result.success) {
      applied.push(drop);
    }
  });
  return applied;
}

function calculateStars(timeUsed, timeLimit, hpLeft, maxHp) {
  const timeRatio = (timeLimit - timeUsed) / timeLimit;
  const hpRatio = hpLeft / maxHp;
  
  let stars = 1;
  if (timeRatio > 0.5 && hpRatio > 0.5) {
    stars = 3;
  } else if (timeRatio > 0.25 || hpRatio > 0.25) {
    stars = 2;
  }
  
  return stars;
}

app.get('/api/user', (req, res) => {
  res.json({ success: true, data: mockData.user });
});

app.get('/api/hero', (req, res) => {
  const user = mockData.user;
  const heroInfo = {
    nickname: user.nickname,
    level: user.level,
    coins: user.coins,
    diamonds: user.diamonds,
    currentAttributes: {
      maxHp: user.maxHp,
      attack: user.attack,
      defense: user.defense,
      speed: user.speed
    },
    attributeLevels: user.attributeLevels,
    nextUpgradeCosts: {
      hp: getAttributeCost('hp', user.attributeLevels.hp),
      attack: getAttributeCost('attack', user.attributeLevels.attack),
      defense: getAttributeCost('defense', user.attributeLevels.defense),
      speed: getAttributeCost('speed', user.attributeLevels.speed)
    },
    nextLevelBonuses: {
      hp: getHpByAttributeLevel(user.attributeLevels.hp + 1) - user.maxHp,
      attack: getAttackByAttributeLevel(user.attributeLevels.attack + 1) - user.attack,
      defense: getDefenseByAttributeLevel(user.attributeLevels.defense + 1) - user.defense,
      speed: getSpeedByAttributeLevel(user.attributeLevels.speed + 1) - user.speed
    },
    maxLevel: 50
  };
  res.json({ success: true, data: heroInfo });
});

app.post('/api/hero/upgrade', (req, res) => {
  const { attributeType } = req.body;
  const user = mockData.user;
  const result = upgradeAttribute(user, attributeType);
  
  if (!result.success) {
    return res.status(400).json(result);
  }
  
  const updatedInfo = {
    ...result.data,
    nextUpgradeCosts: {
      hp: getAttributeCost('hp', user.attributeLevels.hp),
      attack: getAttributeCost('attack', user.attributeLevels.attack),
      defense: getAttributeCost('defense', user.attributeLevels.defense),
      speed: getAttributeCost('speed', user.attributeLevels.speed)
    },
    nextLevelBonuses: {
      hp: user.attributeLevels.hp < 50 ? getHpByAttributeLevel(user.attributeLevels.hp + 1) - user.maxHp : 0,
      attack: user.attributeLevels.attack < 50 ? getAttackByAttributeLevel(user.attributeLevels.attack + 1) - user.attack : 0,
      defense: user.attributeLevels.defense < 50 ? getDefenseByAttributeLevel(user.attributeLevels.defense + 1) - user.defense : 0,
      speed: user.attributeLevels.speed < 50 ? getSpeedByAttributeLevel(user.attributeLevels.speed + 1) - user.speed : 0
    }
  };
  
  res.json({ success: true, data: updatedInfo });
});

app.get('/api/inventory', (req, res) => {
  const user = mockData.user;
  const inventoryList = Object.keys(user.inventory).map(itemId => ({
    itemId,
    item: getItem(itemId),
    quantity: user.inventory[itemId]
  })).filter(inv => inv.quantity > 0);
  
  const maxSlots = getMaxInventorySlots();
  
  res.json({
    success: true,
    data: {
      items: inventoryList,
      maxSlots,
      usedSlots: inventoryList.length,
      maxItemsPerType: MAX_ITEMS_PER_TYPE,
      maxCarryItems: MAX_CARRY_ITEMS,
      carriedItems: user.carriedItems || []
    }
  });
});

app.get('/api/items', (req, res) => {
  res.json({ success: true, data: Object.values(ITEMS) });
});

app.post('/api/inventory/add', (req, res) => {
  const { itemId, quantity = 1 } = req.body;
  const user = mockData.user;
  
  const result = addItemToInventory(user, itemId, quantity);
  
  if (!result.success) {
    return res.status(400).json(result);
  }
  
  res.json({ success: true, data: { itemId, quantity: result.quantity } });
});

app.post('/api/inventory/use', (req, res) => {
  const { itemId, quantity = 1 } = req.body;
  const user = mockData.user;
  
  const item = getItem(itemId);
  if (!item) {
    return res.status(400).json({ success: false, message: '道具不存在' });
  }
  
  if (item.type !== 'consumable') {
    return res.status(400).json({ success: false, message: '该道具不可使用' });
  }
  
  const removeResult = removeItemFromInventory(user, itemId, quantity);
  if (!removeResult.success) {
    return res.status(400).json(removeResult);
  }
  
  const taskUpdated = updateTaskProgress(user, 'item_use', quantity);
  
  res.json({
    success: true,
    data: {
      itemId,
      item,
      remaining: removeResult.remaining,
      effect: item.effect,
      taskUpdated
    }
  });
});

app.post('/api/inventory/carry', (req, res) => {
  const { itemIds } = req.body;
  const user = mockData.user;
  
  if (!Array.isArray(itemIds)) {
    return res.status(400).json({ success: false, message: '参数错误' });
  }
  
  if (itemIds.length > MAX_CARRY_ITEMS) {
    return res.status(400).json({ success: false, message: `最多携带 ${MAX_CARRY_ITEMS} 个道具` });
  }
  
  for (const itemId of itemIds) {
    const count = getInventoryCount(user, itemId);
    if (count <= 0) {
      return res.status(400).json({ success: false, message: `道具 ${itemId} 不存在` });
    }
  }
  
  const uniqueIds = [...new Set(itemIds)];
  if (uniqueIds.length !== itemIds.length) {
    return res.status(400).json({ success: false, message: '不能携带相同道具' });
  }
  
  user.carriedItems = itemIds;
  
  res.json({
    success: true,
    data: {
      carriedItems: itemIds
    }
  });
});

app.get('/api/inventory/carry', (req, res) => {
  const user = mockData.user;
  
  res.json({
    success: true,
    data: {
      carriedItems: user.carriedItems || [],
      maxCarryItems: MAX_CARRY_ITEMS
    }
  });
});

app.post('/api/user/update', (req, res) => {
  Object.assign(mockData.user, req.body);
  const leveledUp = checkLevelUp(mockData.user);
  res.json({ success: true, data: mockData.user, leveledUp });
});

app.get('/api/chapters', (req, res) => {
  const chaptersWithProgress = mockData.chapters.map(chapter => {
    const chapterLevels = mockData.levels.filter(l => chapter.levels.includes(l.id));
    const completedCount = chapterLevels.filter(l => l.isCompleted).length;
    const totalStars = chapterLevels.reduce((sum, l) => sum + l.stars, 0);
    const maxStars = chapterLevels.length * 3;
    
    return {
      ...chapter,
      progress: {
        completed: completedCount,
        total: chapterLevels.length,
        stars: totalStars,
        maxStars: maxStars
      }
    };
  });
  
  res.json({ success: true, data: chaptersWithProgress });
});

app.get('/api/levels', (req, res) => {
  const chapterId = req.query.chapterId ? parseInt(req.query.chapterId) : null;
  let levels = mockData.levels;
  
  if (chapterId) {
    levels = levels.filter(l => l.chapterId === chapterId);
  }
  
  res.json({ success: true, data: levels });
});

app.get('/api/difficulties', (req, res) => {
  res.json({ success: true, data: Object.values(DIFFICULTY_CONFIG) });
});

app.get('/api/level/map/:levelId', (req, res) => {
  const levelId = parseInt(req.params.levelId);
  const difficulty = req.query.difficulty || 'normal';
  const map = LEVEL_MAPS[levelId];
  
  if (!map) {
    return res.status(404).json({ success: false, message: '关卡不存在' });
  }
  
  const difficultyConfig = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.normal;
  const baseMonsters = getDefaultMonsters(levelId);
  const monsters = applyDifficultyToMonsters(baseMonsters, difficulty, levelId);
  
  const adjustedMap = {
    ...map,
    difficulty,
    difficultyConfig,
    monsters,
    coins: Math.floor(map.coins * difficultyConfig.coinMultiplier)
  };
  
  res.json({ success: true, data: adjustedMap });
});

app.get('/api/settings', (req, res) => {
  res.json({ success: true, data: mockData.settings });
});

app.post('/api/settings', (req, res) => {
  Object.assign(mockData.settings, req.body);
  res.json({ success: true, data: mockData.settings });
});

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}`;
}

function checkAndResetSupplementalCount(user) {
  const currentMonth = getCurrentMonth();
  if (user.lastSupplementalMonth !== currentMonth) {
    user.lastSupplementalMonth = currentMonth;
    user.freeSupplementalCount = 1;
  }
}

function getDaysDiff(dateStr1, dateStr2) {
  const date1 = new Date(dateStr1);
  const date2 = new Date(dateStr2);
  date1.setHours(0, 0, 0, 0);
  date2.setHours(0, 0, 0, 0);
  const diffTime = date1.getTime() - date2.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function canSupplementalSignIn(user) {
  checkAndResetSupplementalCount(user);
  
  const today = new Date().toDateString();
  
  if (user.lastSignInDate === today) {
    return false;
  }
  
  if (user.lastSignInDate === null || user.signInStreak === 0) {
    return false;
  }
  
  const daysDiff = getDaysDiff(today, user.lastSignInDate);
  
  if (daysDiff < 1 || daysDiff > 3) {
    return false;
  }
  
  return user.freeSupplementalCount > 0;
}

function getSupplementalInfo(user) {
  checkAndResetSupplementalCount(user);
  
  const today = new Date().toDateString();
  const daysSinceLastSignIn = user.lastSignInDate ? getDaysDiff(today, user.lastSignInDate) : null;
  
  return {
    canSupplemental: canSupplementalSignIn(user),
    freeCount: user.freeSupplementalCount,
    maxFreeCount: 1,
    daysSinceLastSignIn
  };
}

app.get('/api/signin/status', (req, res) => {
  const user = mockData.user;
  const today = new Date().toDateString();
  const canSignIn = user.lastSignInDate !== today;
  
  res.json({
    success: true,
    data: {
      canSignIn,
      lastSignInDate: user.lastSignInDate,
      streak: user.signInStreak,
      todayRewards: getTodaySignInRewards(user.signInStreak + 1),
      supplemental: getSupplementalInfo(user),
      nextMonthRewards: getNextMonthRewards()
    }
  });
});

const SPECIAL_REWARD_DAYS = [7, 14, 21, 28];

const SIGNIN_REWARDS = {
  1: { itemId: 'hp_potion', quantity: 2, coins: 50 },
  2: { itemId: 'hp_potion', quantity: 3, coins: 100 },
  3: { itemId: 'hp_potion', quantity: 2, coins: 100 },
  4: { itemId: 'attack_boost', quantity: 1, coins: 150 },
  5: { itemId: 'hp_potion', quantity: 2, coins: 200 },
  6: { itemId: 'attack_boost', quantity: 1, coins: 200 },
  7: { itemId: 'revive_scroll', quantity: 1, coins: 500 },
  14: { itemId: 'attack_boost', quantity: 2, coins: 300 },
  21: { itemId: 'hp_potion', quantity: 5, coins: 400 },
  28: { itemId: 'revive_scroll', quantity: 2, coins: 1000 }
};

function isSpecialRewardDay(streakDay) {
  return SPECIAL_REWARD_DAYS.includes(streakDay);
}

function getTodaySignInRewards(streakDay) {
  if (SIGNIN_REWARDS[streakDay]) {
    return [SIGNIN_REWARDS[streakDay]];
  }
  
  const weekCycle = ((streakDay - 1) % 7) + 1;
  if (SIGNIN_REWARDS[weekCycle]) {
    return [SIGNIN_REWARDS[weekCycle]];
  }
  
  return [SIGNIN_REWARDS[1]];
}

function getNextMonthRewards() {
  const specialDays = [7, 14, 21, 28];
  return specialDays.map(day => {
    const reward = SIGNIN_REWARDS[day];
    const item = getItem(reward.itemId);
    return {
      day,
      coins: reward.coins,
      item: {
        id: reward.itemId,
        name: item?.name || '道具',
        icon: item?.icon || '🎁',
        quantity: reward.quantity
      }
    };
  });
}

app.post('/api/signin', (req, res) => {
  const user = mockData.user;
  const today = new Date().toDateString();
  
  if (user.lastSignInDate === today) {
    return res.status(400).json({ success: false, message: '今天已签到过了' });
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (user.lastSignInDate === yesterday.toDateString()) {
    user.signInStreak++;
  } else {
    user.signInStreak = 1;
  }
  
  user.lastSignInDate = today;
  
  const taskUpdated = updateTaskProgress(user, 'signin', 1);
  
  const rewards = getTodaySignInRewards(user.signInStreak);
  const appliedRewards = [];
  let totalCoins = 0;
  
  rewards.forEach(reward => {
    if (reward.itemId) {
      const result = addItemToInventory(user, reward.itemId, reward.quantity);
      if (result.success) {
        appliedRewards.push({
          itemId: reward.itemId,
          item: getItem(reward.itemId),
          quantity: reward.quantity
        });
      }
    }
    if (reward.coins) {
      totalCoins += reward.coins;
      user.coins += reward.coins;
    }
  });
  
  res.json({
    success: true,
    data: {
      streak: user.signInStreak,
      rewards: appliedRewards,
      coins: totalCoins,
      isSpecialReward: isSpecialRewardDay(user.signInStreak),
      taskUpdated,
      user: { ...user }
    }
  });
});

app.post('/api/signin/supplemental', (req, res) => {
  const user = mockData.user;
  const today = new Date().toDateString();
  
  if (!canSupplementalSignIn(user)) {
    return res.status(400).json({ 
      success: false, 
      message: '当前无法进行补签' 
    });
  }
  
  checkAndResetSupplementalCount(user);
  
  const daysDiff = getDaysDiff(today, user.lastSignInDate);
  const previousStreak = user.signInStreak;
  const daysRecovered = daysDiff;
  
  user.signInStreak = previousStreak + daysRecovered;
  user.lastSignInDate = today;
  user.freeSupplementalCount--;
  
  const taskUpdated = updateTaskProgress(user, 'signin', 1);
  
  const rewards = getTodaySignInRewards(user.signInStreak);
  const appliedRewards = [];
  let totalCoins = 0;
  
  rewards.forEach(reward => {
    if (reward.itemId) {
      const result = addItemToInventory(user, reward.itemId, reward.quantity);
      if (result.success) {
        appliedRewards.push({
          itemId: reward.itemId,
          item: getItem(reward.itemId),
          quantity: reward.quantity
        });
      }
    }
    if (reward.coins) {
      totalCoins += reward.coins;
      user.coins += reward.coins;
    }
  });
  
  res.json({
    success: true,
    data: {
      streak: user.signInStreak,
      previousStreak: previousStreak,
      daysRecovered: daysRecovered,
      rewards: appliedRewards,
      coins: totalCoins,
      isSupplemental: true,
      isSpecialReward: isSpecialRewardDay(user.signInStreak),
      taskUpdated,
      user: { ...user }
    }
  });
});

app.get('/api/daily-tasks', (req, res) => {
  const user = mockData.user;
  const tasks = checkAndResetDailyTasks(user);
  
  const completedCount = tasks.filter(t => t.isCompleted).length;
  const claimedCount = tasks.filter(t => t.isClaimed).length;
  const totalReward = tasks.reduce((sum, t) => sum + t.reward.coins, 0);
  const totalExp = tasks.reduce((sum, t) => sum + t.reward.experience, 0);
  const earnedCoins = tasks.filter(t => t.isClaimed).reduce((sum, t) => sum + t.reward.coins, 0);
  const earnedExp = tasks.filter(t => t.isClaimed).reduce((sum, t) => sum + t.reward.experience, 0);
  
  res.json({
    success: true,
    data: {
      tasks,
      refreshInfo: {
        available: user.dailyTaskRefreshCount > 0,
        remaining: user.dailyTaskRefreshCount,
        max: 1
      },
      summary: {
        total: tasks.length,
        completed: completedCount,
        claimed: claimedCount,
        totalReward,
        totalExp,
        earnedCoins,
        earnedExp
      },
      user: {
        coins: user.coins,
        experience: user.experience,
        level: user.level
      }
    }
  });
});

app.post('/api/daily-tasks/refresh', (req, res) => {
  const user = mockData.user;
  checkAndResetDailyTasks(user);
  
  if (user.dailyTaskRefreshCount <= 0) {
    return res.status(400).json({ 
      success: false, 
      message: '今日刷新次数已用完' 
    });
  }
  
  const claimedIds = user.dailyTasks.filter(t => t.isClaimed).map(t => t.id);
  
  const claimedTasks = user.dailyTasks.filter(t => t.isClaimed);
  const unclaimedTasks = user.dailyTasks.filter(t => !t.isClaimed);
  
  if (unclaimedTasks.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: '没有可刷新的任务，所有任务已领取' 
    });
  }
  
  const allIds = ALL_DAILY_TASKS.map(t => t.id);
  const currentIds = user.dailyTasks.map(t => t.id);
  const availableIds = allIds.filter(id => !currentIds.includes(id));
  
  if (availableIds.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: '没有更多任务可以刷新' 
    });
  }
  
  const randomAvailableId = availableIds[Math.floor(Math.random() * availableIds.length)];
  const newTaskTemplate = ALL_DAILY_TASKS.find(t => t.id === randomAvailableId);
  
  const today = getTodayDate();
  const newTask = {
    ...newTaskTemplate,
    progress: 0,
    isCompleted: false,
    isClaimed: false,
    lastUpdateDate: today
  };
  
  const tasksToRefresh = unclaimedTasks.filter(t => !t.isCompleted);
  
  if (tasksToRefresh.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: '没有可刷新的任务，未完成的任务已不存在' 
    });
  }
  
  const randomIndex = Math.floor(Math.random() * tasksToRefresh.length);
  const taskToReplace = tasksToRefresh[randomIndex];
  const replaceIndex = user.dailyTasks.findIndex(t => t.id === taskToReplace.id);
  
  const oldTask = user.dailyTasks[replaceIndex];
  user.dailyTasks[replaceIndex] = newTask;
  
  user.dailyTaskRefreshCount--;
  
  const tasks = user.dailyTasks;
  const completedCount = tasks.filter(t => t.isCompleted).length;
  const claimedCount = tasks.filter(t => t.isClaimed).length;
  const totalReward = tasks.reduce((sum, t) => sum + t.reward.coins, 0);
  const totalExp = tasks.reduce((sum, t) => sum + t.reward.experience, 0);
  const earnedCoins = tasks.filter(t => t.isClaimed).reduce((sum, t) => sum + t.reward.coins, 0);
  const earnedExp = tasks.filter(t => t.isClaimed).reduce((sum, t) => sum + t.reward.experience, 0);
  
  res.json({
    success: true,
    data: {
      tasks,
      oldTask,
      newTask,
      refreshInfo: {
        available: user.dailyTaskRefreshCount > 0,
        remaining: user.dailyTaskRefreshCount,
        max: 1
      },
      summary: {
        total: tasks.length,
        completed: completedCount,
        claimed: claimedCount,
        totalReward,
        totalExp,
        earnedCoins,
        earnedExp
      }
    }
  });
});

app.post('/api/daily-tasks/claim', (req, res) => {
  const { taskId } = req.body;
  const user = mockData.user;
  const tasks = checkAndResetDailyTasks(user);
  
  const task = tasks.find(t => t.id === taskId);
  
  if (!task) {
    return res.status(404).json({ success: false, message: '任务不存在' });
  }
  
  if (!task.isCompleted) {
    return res.status(400).json({ success: false, message: '任务尚未完成' });
  }
  
  if (task.isClaimed) {
    return res.status(400).json({ success: false, message: '奖励已领取' });
  }
  
  task.isClaimed = true;
  user.coins += task.reward.coins;
  user.experience += task.reward.experience;
  
  const leveledUp = checkLevelUp(user);
  
  res.json({
    success: true,
    data: {
      taskId,
      reward: task.reward,
      leveledUp,
      user: {
        coins: user.coins,
        experience: user.experience,
        level: user.level,
        nextLevelExp: user.nextLevelExp
      }
    }
  });
});

app.post('/api/daily-tasks/claim-all', (req, res) => {
  const user = mockData.user;
  const tasks = checkAndResetDailyTasks(user);
  
  const completedUnclaimed = tasks.filter(t => t.isCompleted && !t.isClaimed);
  
  if (completedUnclaimed.length === 0) {
    return res.status(400).json({ success: false, message: '没有可领取的奖励' });
  }
  
  let totalCoins = 0;
  let totalExp = 0;
  const claimedTasks = [];
  
  completedUnclaimed.forEach(task => {
    task.isClaimed = true;
    totalCoins += task.reward.coins;
    totalExp += task.reward.experience;
    claimedTasks.push({
      id: task.id,
      name: task.name,
      reward: task.reward
    });
  });
  
  user.coins += totalCoins;
  user.experience += totalExp;
  
  const leveledUp = checkLevelUp(user);
  
  res.json({
    success: true,
    data: {
      claimedCount: claimedTasks.length,
      totalCoins,
      totalExp,
      leveledUp,
      user: {
        coins: user.coins,
        experience: user.experience,
        level: user.level,
        nextLevelExp: user.nextLevelExp
      }
    }
  });
});

app.get('/api/achievements', (req, res) => {
  const user = mockData.user;
  const levels = mockData.levels;
  
  const achievementsList = Object.values(ACHIEVEMENTS).map(achievement => ({
    ...achievement,
    isCompleted: user.completedAchievements.includes(achievement.id),
    rewardItem: getItem(achievement.reward.itemId)
  }));
  
  res.json({
    success: true,
    data: {
      achievements: achievementsList,
      completedCount: user.completedAchievements.length,
      totalCount: Object.keys(ACHIEVEMENTS).length
    }
  });
});

function checkAchievements(user, levels) {
  const newAchievements = [];
  
  Object.values(ACHIEVEMENTS).forEach(achievement => {
    if (!user.completedAchievements.includes(achievement.id)) {
      if (achievement.check(user, levels)) {
        user.completedAchievements.push(achievement.id);
        user.achievementCount++;
        
        if (achievement.reward.itemId) {
          addItemToInventory(user, achievement.reward.itemId, achievement.reward.quantity);
        }
        if (achievement.reward.coins) {
          user.coins += achievement.reward.coins;
        }
        
        newAchievements.push({
          ...achievement,
          rewardItem: getItem(achievement.reward.itemId)
        });
      }
    }
  });
  
  return newAchievements;
}

app.post('/api/level/complete', (req, res) => {
  const { levelId, timeUsed, difficulty } = req.body;
  const level = mockData.levels.find(l => l.id === levelId);
  const map = LEVEL_MAPS[levelId];
  
  if (!level || !map) {
    return res.status(404).json({ success: false, message: '关卡不存在' });
  }
  
  const difficultyConfig = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.normal;
  const adjustedCoins = Math.floor(map.coins * difficultyConfig.coinMultiplier);
  const adjustedExp = Math.floor(map.experience * difficultyConfig.coinMultiplier);
  
  const user = mockData.user;
  const stars = calculateStars(timeUsed, map.timeLimit, user.hp, user.maxHp);
  const firstTime = !level.isCompleted;
  
  level.isCompleted = true;
  const previousStars = level.stars;
  level.stars = Math.max(level.stars, stars);
  if (!level.bestTime || timeUsed < level.bestTime) {
    level.bestTime = timeUsed;
  }
  
  const nextLevelId = levelId + 1;
  const nextLevel = mockData.levels.find(l => l.id === nextLevelId);
  if (nextLevel) {
    nextLevel.isUnlocked = true;
  }
  
  const nextChapter = mockData.chapters.find(c => 
    !c.unlocked && c.levels.includes(nextLevelId)
  );
  if (nextChapter) {
    nextChapter.unlocked = true;
  }
  
  if (firstTime) {
    user.totalStars += stars;
    user.experience += adjustedExp;
    user.coins += adjustedCoins;
  } else {
    const starDiff = Math.max(0, level.stars - previousStars);
    if (starDiff > 0) {
      user.totalStars += starDiff;
    }
    user.coins += adjustedCoins;
  }
  
  user.completedLevels = mockData.levels.filter(l => l.isCompleted).length;
  
  const taskUpdated = updateTaskProgress(user, 'level_complete', 1);
  
  const leveledUp = checkLevelUp(user);
  user.previousLevel = user.level;
  
  user.hp = user.maxHp;
  
  const drops = generateRandomDrops(levelId);
  const appliedDrops = applyDropsToInventory(user, drops);
  
  const newAchievements = checkAchievements(user, mockData.levels);
  
  let firstHardClearReward = null;
  if (difficulty === 'hard' && !user.hasFirstHardClearReward) {
    user.hasFirstHardClearReward = true;
    const hardRewardItemId = 'revive_scroll';
    const hardRewardQuantity = 2;
    const addResult = addItemToInventory(user, hardRewardItemId, hardRewardQuantity);
    if (addResult.success) {
      firstHardClearReward = {
        itemId: hardRewardItemId,
        item: getItem(hardRewardItemId),
        quantity: hardRewardQuantity,
        isFirstHardClear: true
      };
      if (appliedDrops.length > 0) {
        appliedDrops.push(firstHardClearReward);
      } else {
        appliedDrops.push(firstHardClearReward);
      }
    }
  }
  
  res.json({ 
    success: true, 
    data: {
      stars,
      coins: adjustedCoins,
      experience: firstTime ? adjustedExp : 0,
      firstTime,
      leveledUp,
      drops: appliedDrops,
      newAchievements,
      taskUpdated,
      maxInventorySlots: getMaxInventorySlots(),
      difficulty: difficultyConfig.id,
      difficultyName: difficultyConfig.name,
      coinMultiplier: difficultyConfig.coinMultiplier,
      monsterStrength: difficultyConfig.monsterStrength,
      firstHardClearReward,
      user: { ...user },
      levels: mockData.levels
    }
  });
});

app.post('/api/level/fail', (req, res) => {
  const { levelId } = req.body;
  const user = mockData.user;
  
  user.hp = user.maxHp;
  
  res.json({ 
    success: true, 
    data: {
      user: { ...user }
    }
  });
});

app.get('/api/skins', (req, res) => {
  const user = mockData.user;
  const skinsList = Object.values(SKINS).map(skin => {
    const unlocked = isSkinUnlocked(user, skin.id);
    const isWearing = user.currentSkin === skin.id;
    
    let unlockProgress = null;
    if (skin.type === 'rare' && skin.requiredSignInDays && !unlocked) {
      unlockProgress = {
        current: user.signInStreak,
        required: skin.requiredSignInDays,
        percentage: Math.min(100, Math.floor((user.signInStreak / skin.requiredSignInDays) * 100))
      };
    }
    
    return {
      ...skin,
      unlocked,
      isWearing,
      unlockProgress
    };
  });
  
  const commonSkins = skinsList.filter(s => s.type === 'common');
  const rareSkins = skinsList.filter(s => s.type === 'rare');
  
  res.json({
    success: true,
    data: {
      skins: skinsList,
      commonSkins,
      rareSkins,
      userCoins: user.coins,
      currentSkin: user.currentSkin,
      unlockedCount: skinsList.filter(s => s.unlocked).length,
      totalCount: skinsList.length
    }
  });
});

app.post('/api/skins/buy', (req, res) => {
  const { skinId } = req.body;
  const user = mockData.user;
  const skin = getSkin(skinId);
  
  if (!skin) {
    return res.status(404).json({ success: false, message: '皮肤不存在' });
  }
  
  if (skin.type !== 'common') {
    return res.status(400).json({ success: false, message: '稀有皮肤需要通过签到解锁' });
  }
  
  const isUnlocked = isSkinUnlocked(user, skinId);
  if (isUnlocked) {
    return res.status(400).json({ success: false, message: '已拥有该皮肤' });
  }
  
  if (user.coins < skin.price) {
    return res.status(400).json({ 
      success: false, 
      message: '金币不足',
      required: skin.price,
      current: user.coins
    });
  }
  
  user.coins -= skin.price;
  if (!user.unlockedSkins) user.unlockedSkins = [];
  user.unlockedSkins.push(skinId);
  
  res.json({
    success: true,
    data: {
      skinId,
      skin,
      remainingCoins: user.coins,
      user: { ...user }
    }
  });
});

app.post('/api/skins/wear', (req, res) => {
  const { skinId } = req.body;
  const user = mockData.user;
  const skin = getSkin(skinId);
  
  if (!skin) {
    return res.status(404).json({ success: false, message: '皮肤不存在' });
  }
  
  const isUnlocked = isSkinUnlocked(user, skinId);
  if (!isUnlocked) {
    return res.status(400).json({ success: false, message: '未解锁该皮肤' });
  }
  
  user.currentSkin = skinId;
  
  res.json({
    success: true,
    data: {
      skinId,
      skin,
      user: { ...user }
    }
  });
});

app.get('/api/skins/current', (req, res) => {
  const user = mockData.user;
  const skin = getSkin(user.currentSkin);
  
  res.json({
    success: true,
    data: {
      skinId: user.currentSkin,
      skin: skin
    }
  });
});

const LEADERBOARD_CONFIG = {
  maxDisplay: 100,
  updateInterval: 60000,
  types: {
    levels: {
      name: '通关层数',
      sortBy: 'completedLevels',
      secondarySort: 'totalStars',
      icon: '🎯'
    },
    level: {
      name: '玩家等级',
      sortBy: 'level',
      secondarySort: 'experience',
      icon: '🦸'
    }
  }
};

const CURRENT_USER_ID = 0;

function getCurrentUserSnapshot() {
  return {
    ...mockData.user,
    id: CURRENT_USER_ID
  };
}

function getAllPlayersForLeaderboard() {
  const currentUser = getCurrentUserSnapshot();
  
  const allPlayers = [
    currentUser,
    ...mockPlayers.filter(p => p.id !== CURRENT_USER_ID)
  ];
  
  return allPlayers;
}

function sortPlayersByType(players, type) {
  const config = LEADERBOARD_CONFIG.types[type];
  if (!config) return players;

  return players.sort((a, b) => {
    if (b[config.sortBy] !== a[config.sortBy]) {
      return b[config.sortBy] - a[config.sortBy];
    }
    if (b[config.secondarySort] !== a[config.secondarySort]) {
      return b[config.secondarySort] - a[config.secondarySort];
    }
    return a.id - b.id;
  });
}

function formatPlayerForLeaderboard(player, rank, type) {
  const isCurrentUser = player.id === CURRENT_USER_ID;
  
  return {
    rank,
    playerId: player.id,
    nickname: player.nickname,
    level: player.level,
    avatar: player.avatar || '',
    currentSkin: player.currentSkin || 'default',
    completedLevels: player.completedLevels,
    totalStars: player.totalStars,
    isCurrentUser,
    score: type === 'levels' ? player.completedLevels : player.level
  };
}

function calculateLeaderboard(type) {
  const config = LEADERBOARD_CONFIG.types[type];
  if (!config) return null;

  console.log(`[排行榜] 正在计算 ${config.name} 排行榜...`);
  
  const currentUser = getCurrentUserSnapshot();
  console.log(`[排行榜] 当前用户数据: nickname=${currentUser.nickname}, level=${currentUser.level}, completedLevels=${currentUser.completedLevels}`);

  const allPlayers = getAllPlayersForLeaderboard();
  console.log(`[排行榜] 玩家总数: ${allPlayers.length}`);

  const sortedPlayers = sortPlayersByType([...allPlayers], type);
  
  const topPlayers = sortedPlayers.slice(0, LEADERBOARD_CONFIG.maxDisplay);
  
  let myRank = null;
  let myData = null;
  
  for (let i = 0; i < sortedPlayers.length; i++) {
    if (sortedPlayers[i].id === CURRENT_USER_ID) {
      myRank = i + 1;
      myData = formatPlayerForLeaderboard(sortedPlayers[i], myRank, type);
      console.log(`[排行榜] 当前用户排名: ${myRank}`);
      break;
    }
  }
  
  if (!myRank) {
    console.log(`[排行榜] 警告: 未能找到当前用户在排行榜中的位置`);
  }

  const result = {
    lastUpdate: new Date().toISOString(),
    players: topPlayers.map((player, index) => 
      formatPlayerForLeaderboard(player, index + 1, type)
    ),
    myRank,
    myData,
    totalPlayers: sortedPlayers.length
  };

  console.log(`[排行榜] ${config.name} 排行榜计算完成，当前用户排名: ${myRank}`);
  
  return result;
}

function updateLeaderboard(type) {
  return calculateLeaderboard(type);
}

function updateAllLeaderboards() {
  const results = {};
  Object.keys(LEADERBOARD_CONFIG.types).forEach(type => {
    results[type] = updateLeaderboard(type);
  });
  return results;
}

app.get('/api/leaderboard', (req, res) => {
  const { type = 'levels' } = req.query;
  
  if (!LEADERBOARD_CONFIG.types[type]) {
    return res.status(400).json({
      success: false,
      message: `无效的排行榜类型: ${type}`,
      validTypes: Object.keys(LEADERBOARD_CONFIG.types)
    });
  }

  console.log(`[排行榜] API请求: type=${type}`);
  const leaderboardData = calculateLeaderboard(type);

  if (!leaderboardData) {
    return res.status(500).json({
      success: false,
      message: '排行榜计算失败'
    });
  }

  res.json({
    success: true,
    data: {
      type,
      typeName: LEADERBOARD_CONFIG.types[type].name,
      typeIcon: LEADERBOARD_CONFIG.types[type].icon,
      maxDisplay: LEADERBOARD_CONFIG.maxDisplay,
      lastUpdate: leaderboardData.lastUpdate,
      players: leaderboardData.players,
      myRank: leaderboardData.myRank,
      myData: leaderboardData.myData,
      totalPlayers: leaderboardData.totalPlayers,
      currentUserSnapshot: {
        nickname: mockData.user.nickname,
        level: mockData.user.level,
        completedLevels: mockData.user.completedLevels,
        totalStars: mockData.user.totalStars
      }
    }
  });
});

app.post('/api/leaderboard/refresh', (req, res) => {
  const { type = 'levels' } = req.query;
  
  if (!LEADERBOARD_CONFIG.types[type]) {
    return res.status(400).json({
      success: false,
      message: `无效的排行榜类型: ${type}`,
      validTypes: Object.keys(LEADERBOARD_CONFIG.types)
    });
  }

  console.log(`[排行榜] 手动刷新请求: type=${type}`);
  const leaderboardData = calculateLeaderboard(type);

  if (!leaderboardData) {
    return res.status(500).json({
      success: false,
      message: '排行榜刷新失败'
    });
  }

  res.json({
    success: true,
    data: {
      type,
      typeName: LEADERBOARD_CONFIG.types[type].name,
      typeIcon: LEADERBOARD_CONFIG.types[type].icon,
      maxDisplay: LEADERBOARD_CONFIG.maxDisplay,
      lastUpdate: leaderboardData.lastUpdate,
      players: leaderboardData.players,
      myRank: leaderboardData.myRank,
      myData: leaderboardData.myData,
      totalPlayers: leaderboardData.totalPlayers,
      refreshedAt: new Date().toISOString(),
      currentUserSnapshot: {
        nickname: mockData.user.nickname,
        level: mockData.user.level,
        completedLevels: mockData.user.completedLevels,
        totalStars: mockData.user.totalStars
      }
    }
  });
});

app.get('/api/leaderboard/types', (req, res) => {
  res.json({
    success: true,
    data: {
      types: Object.entries(LEADERBOARD_CONFIG.types).map(([key, value]) => ({
        type: key,
        name: value.name,
        icon: value.icon
      }))
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '游戏服务器运行正常' });
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`游戏后端服务器已启动: http://localhost:${PORT}`);
});
