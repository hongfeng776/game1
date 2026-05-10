import axios from 'axios';
import saveService from './saveService';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

api.interceptors.request.use(
  config => {
    const deviceId = saveService.getDeviceId();
    if (deviceId) {
      if (config.method === 'get') {
        config.params = config.params || {};
        config.params.deviceId = deviceId;
      } else {
        if (config.data && typeof config.data === 'object') {
          config.data.deviceId = deviceId;
        } else {
          config.data = { deviceId };
        }
      }
    }
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const userAPI = {
  getUser: () => api.get('/user'),
  updateUser: (data) => api.post('/user/update', data),
};

export const heroAPI = {
  getHeroInfo: () => api.get('/hero'),
  upgradeAttribute: (attributeType) => api.post('/hero/upgrade', { attributeType }),
  resetAttributes: () => api.post('/hero/reset'),
};

export const inventoryAPI = {
  getInventory: () => api.get('/inventory'),
  getAllItems: () => api.get('/items'),
  addItem: (itemId, quantity) => api.post('/inventory/add', { itemId, quantity }),
  useItem: (itemId, quantity) => api.post('/inventory/use', { itemId, quantity }),
  carryItems: (itemIds) => api.post('/inventory/carry', { itemIds }),
  getCarriedItems: () => api.get('/inventory/carry'),
};

export const levelsAPI = {
  getLevels: (chapterId) => api.get('/levels', { params: { chapterId } }),
  getLevelMap: (levelId, difficulty) => api.get(`/level/map/${levelId}`, { params: { difficulty } }),
  completeLevel: (levelId, timeUsed, difficulty) => api.post('/level/complete', { levelId, timeUsed, difficulty }),
  failLevel: (levelId) => api.post('/level/fail', { levelId }),
  getDifficulties: () => api.get('/difficulties'),
};

export const chaptersAPI = {
  getChapters: () => api.get('/chapters'),
};

export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (settings) => api.post('/settings', settings),
};

export const signInAPI = {
  getStatus: () => api.get('/signin/status'),
  signIn: () => api.post('/signin'),
  supplementalSignIn: () => api.post('/signin/supplemental'),
};

export const achievementAPI = {
  getAll: () => api.get('/achievements'),
};

export const healthAPI = {
  check: () => api.get('/health'),
};

export const skinAPI = {
  getSkins: () => api.get('/skins'),
  buySkin: (skinId) => api.post('/skins/buy', { skinId }),
  wearSkin: (skinId) => api.post('/skins/wear', { skinId }),
  getCurrentSkin: () => api.get('/skins/current'),
};

export const leaderboardAPI = {
  getLeaderboard: (type = 'levels') => api.get('/leaderboard', { params: { type } }),
  refreshLeaderboard: (type = 'levels') => api.post('/leaderboard/refresh', null, { params: { type } }),
  getLeaderboardTypes: () => api.get('/leaderboard/types'),
};

export const dailyTasksAPI = {
  getTasks: () => api.get('/daily-tasks'),
  claimReward: (taskId) => api.post('/daily-tasks/claim', { taskId }),
  claimAllRewards: () => api.post('/daily-tasks/claim-all'),
  refreshTask: () => api.post('/daily-tasks/refresh'),
};

export const endlessAPI = {
  getStatus: () => api.get('/endless/status'),
  getLevelMap: (levelIndex) => api.get(`/endless/map/${levelIndex}`),
  completeLevel: (levelIndex, timeUsed, isPerfect = false) => api.post('/endless/complete', { levelIndex, timeUsed, isPerfect }),
  failLevel: (levelIndex, timeUsed, totalCoinsEarned, totalExpEarned, totalScoreEarned, levelCompleted) => api.post('/endless/fail', { levelIndex, timeUsed, totalCoinsEarned, totalExpEarned, totalScoreEarned, levelCompleted }),
};

export const saveAPI = {
  save: () => api.post('/save'),
  getStatus: () => api.get('/save/status'),
  checkIntegrity: () => api.get('/save/integrity'),
  reload: () => api.post('/save/reload'),
  clearCache: () => api.post('/save/clear-cache'),
};

export const backupAPI = {
  getList: () => api.get('/backups'),
  create: (name) => api.post('/backups/create', { name }),
  restore: (filename) => api.post('/backups/restore', { filename }),
  delete: (filename) => api.delete(`/backups/${encodeURIComponent(filename)}`),
};

export const accountAPI = {
  switchAccount: (newDeviceId) => api.post('/account/switch', { newDeviceId }),
  resetAccount: () => api.post('/account/reset'),
};

export default api;
