import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

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
};

export const levelsAPI = {
  getLevels: (chapterId) => api.get('/levels', { params: { chapterId } }),
  getLevelMap: (levelId) => api.get(`/level/map/${levelId}`),
  completeLevel: (levelId, timeUsed) => api.post('/level/complete', { levelId, timeUsed }),
  failLevel: (levelId) => api.post('/level/fail', { levelId }),
};

export const chaptersAPI = {
  getChapters: () => api.get('/chapters'),
};

export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (settings) => api.post('/settings', settings),
};

export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
