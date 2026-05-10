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

const mockData = {
  user: {
    id: 1,
    nickname: '小玩家',
    avatar: '',
    level: 15,
    experience: 2500,
    nextLevelExp: 3000,
    coins: 1280,
    diamonds: 50,
    totalStars: 128,
    completedLevels: 45,
    achievementCount: 12
  },
  levels: [
    { id: 1, name: '第1关', stars: 3, isCompleted: true, isUnlocked: true },
    { id: 2, name: '第2关', stars: 2, isCompleted: true, isUnlocked: true },
    { id: 3, name: '第3关', stars: 3, isCompleted: true, isUnlocked: true },
    { id: 4, name: '第4关', stars: 1, isCompleted: true, isUnlocked: true },
    { id: 5, name: '第5关', stars: 0, isCompleted: false, isUnlocked: true },
    { id: 6, name: '第6关', stars: 0, isCompleted: false, isUnlocked: false },
    { id: 7, name: '第7关', stars: 0, isCompleted: false, isUnlocked: false },
    { id: 8, name: '第8关', stars: 0, isCompleted: false, isUnlocked: false },
    { id: 9, name: '第9关', stars: 0, isCompleted: false, isUnlocked: false },
    { id: 10, name: '第10关', stars: 0, isCompleted: false, isUnlocked: false }
  ],
  settings: {
    musicVolume: 80,
    sfxVolume: 70,
    language: 'zh-CN',
    notifications: true,
    vibration: true
  }
};

app.get('/api/user', (req, res) => {
  res.json({ success: true, data: mockData.user });
});

app.get('/api/levels', (req, res) => {
  res.json({ success: true, data: mockData.levels });
});

app.get('/api/settings', (req, res) => {
  res.json({ success: true, data: mockData.settings });
});

app.post('/api/settings', (req, res) => {
  Object.assign(mockData.settings, req.body);
  res.json({ success: true, data: mockData.settings });
});

app.post('/api/level/complete', (req, res) => {
  const { levelId, stars } = req.body;
  const level = mockData.levels.find(l => l.id === levelId);
  if (level) {
    level.isCompleted = true;
    level.stars = Math.max(level.stars, stars);
    const nextLevel = mockData.levels.find(l => l.id === levelId + 1);
    if (nextLevel) {
      nextLevel.isUnlocked = true;
    }
    mockData.user.totalStars += stars;
    mockData.user.experience += stars * 100;
  }
  res.json({ success: true, data: mockData.levels });
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
