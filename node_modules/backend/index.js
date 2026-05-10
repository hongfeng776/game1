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

const ITEMS = {
  hp_potion_small: {
    id: 'hp_potion_small',
    name: '小型生命药水',
    icon: '🧪',
    type: 'consumable',
    category: 'heal',
    description: '恢复 30% 最大生命值',
    effect: { heal: 0.3, type: 'percent' },
    rarity: 'common',
    stackable: true,
    maxStack: 99
  },
  hp_potion_medium: {
    id: 'hp_potion_medium',
    name: '中型生命药水',
    icon: '🧴',
    type: 'consumable',
    category: 'heal',
    description: '恢复 60% 最大生命值',
    effect: { heal: 0.6, type: 'percent' },
    rarity: 'uncommon',
    stackable: true,
    maxStack: 99
  },
  hp_potion_large: {
    id: 'hp_potion_large',
    name: '大型生命药水',
    icon: '⚗️',
    type: 'consumable',
    category: 'heal',
    description: '恢复 100% 最大生命值',
    effect: { heal: 1.0, type: 'percent' },
    rarity: 'rare',
    stackable: true,
    maxStack: 99
  },
  attack_boost: {
    id: 'attack_boost',
    name: '狂暴药剂',
    icon: '💪',
    type: 'consumable',
    category: 'buff',
    description: '本关攻击力 +50%',
    effect: { attackBoost: 0.5, duration: 'level' },
    rarity: 'uncommon',
    stackable: true,
    maxStack: 99
  },
  defense_boost: {
    id: 'defense_boost',
    name: '铁壁药剂',
    icon: '🛡️',
    type: 'consumable',
    category: 'buff',
    description: '本关防御力 +50%',
    effect: { defenseBoost: 0.5, duration: 'level' },
    rarity: 'uncommon',
    stackable: true,
    maxStack: 99
  },
  revive: {
    id: 'revive',
    name: '复活卷轴',
    icon: '📜',
    type: 'consumable',
    category: 'revive',
    description: '死亡时自动复活并恢复 50% 生命值',
    effect: { revive: true, healPercent: 0.5 },
    rarity: 'rare',
    stackable: true,
    maxStack: 99
  },
  speed_boost: {
    id: 'speed_boost',
    name: '疾风药剂',
    icon: '💨',
    type: 'consumable',
    category: 'buff',
    description: '本关移动速度 +30%',
    effect: { speedBoost: 0.3, duration: 'level' },
    rarity: 'uncommon',
    stackable: true,
    maxStack: 99
  },
  shield: {
    id: 'shield',
    name: '护盾水晶',
    icon: '💎',
    type: 'consumable',
    category: 'shield',
    description: '获得一个可吸收 50 点伤害的护盾',
    effect: { shield: 50 },
    rarity: 'rare',
    stackable: true,
    maxStack: 99
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
      hp_potion_small: 5,
      hp_potion_medium: 2,
      attack_boost: 3,
      revive: 1
    },
    maxInventorySlots: 50
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
  
  if (!user.inventory[itemId]) {
    user.inventory[itemId] = 0;
  }
  
  if (item.stackable) {
    user.inventory[itemId] = Math.min(
      user.inventory[itemId] + quantity,
      item.maxStack
    );
  } else {
    if (user.inventory[itemId] > 0) {
      return { success: false, message: '该道具不可堆叠' };
    }
    user.inventory[itemId] = 1;
  }
  
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
  const possibleDrops = [
    { itemId: 'hp_potion_small', chance: 0.6, min: 1, max: 3 },
    { itemId: 'hp_potion_medium', chance: 0.3, min: 1, max: 2 },
    { itemId: 'hp_potion_large', chance: 0.1, min: 1, max: 1 },
    { itemId: 'attack_boost', chance: 0.35, min: 1, max: 2 },
    { itemId: 'defense_boost', chance: 0.35, min: 1, max: 2 },
    { itemId: 'speed_boost', chance: 0.3, min: 1, max: 2 },
    { itemId: 'revive', chance: 0.1, min: 1, max: 1 },
    { itemId: 'shield', chance: 0.15, min: 1, max: 1 }
  ];
  
  possibleDrops.forEach(drop => {
    if (Math.random() < drop.chance) {
      const quantity = Math.floor(Math.random() * (drop.max - drop.min + 1)) + drop.min;
      drops.push({
        itemId: drop.itemId,
        item: getItem(drop.itemId),
        quantity
      });
    }
  });
  
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
  
  res.json({
    success: true,
    data: {
      items: inventoryList,
      maxSlots: user.maxInventorySlots,
      usedSlots: inventoryList.length
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

app.get('/api/level/map/:levelId', (req, res) => {
  const levelId = parseInt(req.params.levelId);
  const map = LEVEL_MAPS[levelId];
  
  if (!map) {
    return res.status(404).json({ success: false, message: '关卡不存在' });
  }
  
  res.json({ success: true, data: map });
});

app.get('/api/settings', (req, res) => {
  res.json({ success: true, data: mockData.settings });
});

app.post('/api/settings', (req, res) => {
  Object.assign(mockData.settings, req.body);
  res.json({ success: true, data: mockData.settings });
});

app.post('/api/level/complete', (req, res) => {
  const { levelId, timeUsed } = req.body;
  const level = mockData.levels.find(l => l.id === levelId);
  const map = LEVEL_MAPS[levelId];
  
  if (!level || !map) {
    return res.status(404).json({ success: false, message: '关卡不存在' });
  }
  
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
    user.experience += map.experience;
    user.coins += map.coins;
  } else {
    const starDiff = Math.max(0, level.stars - previousStars);
    if (starDiff > 0) {
      user.totalStars += starDiff;
    }
  }
  
  user.completedLevels = mockData.levels.filter(l => l.isCompleted).length;
  
  const leveledUp = checkLevelUp(user);
  user.hp = user.maxHp;
  
  const drops = generateRandomDrops(levelId);
  const appliedDrops = applyDropsToInventory(user, drops);
  
  res.json({ 
    success: true, 
    data: {
      stars,
      coins: firstTime ? map.coins : 0,
      experience: firstTime ? map.experience : 0,
      firstTime,
      leveledUp,
      drops: appliedDrops,
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
