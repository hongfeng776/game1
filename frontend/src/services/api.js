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
};

export const levelsAPI = {
  getLevels: () => api.get('/levels'),
  completeLevel: (levelId, stars) => api.post('/level/complete', { levelId, stars }),
};

export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (settings) => api.post('/settings', settings),
};

export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
