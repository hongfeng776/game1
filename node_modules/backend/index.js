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
    hasFirstHardClearReward: false
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
  
  res.json({
    success: true,
    data: {
      itemId,
      item,
      remaining: removeResult.remaining,
      effect: item.effect
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
      user: { ...user }
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
