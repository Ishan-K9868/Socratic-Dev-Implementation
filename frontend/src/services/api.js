import axios from 'axios';
import { store } from '../store';
import { logout, setError } from '../store/slices/authSlice';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message;

    // Handle 401 Unauthorized - logout user
    if (error.response?.status === 401) {
      store.dispatch(logout());
      store.dispatch(setError('Session expired. Please login again.'));
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      store.dispatch(setError('You do not have permission to perform this action.'));
    }

    // Handle 500 Server Error
    if (error.response?.status >= 500) {
      store.dispatch(setError('Server error. Please try again later.'));
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  googleLogin: (credential) => api.post('/auth/google/token', { credential }),
  getMe: () => api.get('/auth/me'),
  updatePreferences: (preferences) => api.put('/auth/preferences', preferences),
  logout: () => api.post('/auth/logout'),
};

// Chat API
export const chatAPI = {
  sendMessage: (message, mode) => api.post('/chat/message', { message, mode }),
  getHistory: () => api.get('/chat/history'),
};

// Challenge API
export const challengeAPI = {
  generate: (type, difficulty, topic) =>
    api.get(`/challenges/generate/${type}`, { params: { difficulty, topic } }),
  evaluate: (type, challenge, answer) =>
    api.post('/challenges/evaluate', { type, challenge, answer }),
  getHistory: () => api.get('/challenges/history'),
};

// Flashcard API
export const flashcardAPI = {
  getAll: () => api.get('/flashcards'),
  create: (flashcard) => api.post('/flashcards', flashcard),
  review: (id, quality) => api.post(`/flashcards/${id}/review`, { quality }),
  delete: (id) => api.delete(`/flashcards/${id}`),
};

// Gamification API
export const gamificationAPI = {
  getAchievements: () => api.get('/gamification/achievements'),
  getLeaderboard: () => api.get('/gamification/leaderboard'),
  addXP: (amount, reason) => api.post('/gamification/xp', { amount, reason }),
};

export default api;
