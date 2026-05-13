import axios from 'axios';
import { API_BASE_URL } from '../constants/config';

// Создаем экземпляр axios для административных функций
const adminApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Интерцептор для добавления токена к запросам
adminApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const adminService = {
  // Получение списка пользователей
  getUsers: async (params = {}) => {
    try {
      const response = await adminApiClient.get('/admin/users', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка получения списка пользователей');
    }
  },
  
  // Блокировка пользователя
  banUser: async (userId) => {
    try {
      const response = await adminApiClient.post(`/admin/users/${userId}/ban`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка блокировки пользователя');
    }
  },
  
  // Разблокировка пользователя
  unbanUser: async (userId) => {
    try {
      const response = await adminApiClient.post(`/admin/users/${userId}/unban`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка разблокировки пользователя');
    }
  },
  
  // Назначение прав администратора
  makeAdmin: async (userId) => {
    try {
      const response = await adminApiClient.post(`/admin/users/${userId}/make-admin`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка назначения прав администратора');
    }
  },
  
  // Отзыв прав администратора
  revokeAdmin: async (userId) => {
    try {
      const response = await adminApiClient.post(`/admin/users/${userId}/revoke-admin`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка отзыва прав администратора');
    }
  },
  
  // Получение списка видео для модерации
  getVideosForModeration: async (params = {}) => {
    try {
      const response = await adminApiClient.get('/admin/videos', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка получения списка видео для модерации');
    }
  },
  
  // Удаление видео администратором
  deleteVideo: async (videoId, reason) => {
    try {
      const response = await adminApiClient.delete(`/admin/videos/${videoId}`, {
        data: { reason }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка удаления видео');
    }
  },
  
  // Получение статистики платформы
  getPlatformStats: async () => {
    try {
      const response = await adminApiClient.get('/admin/stats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка получения статистики платформы');
    }
  },
  
  // Получение логов действий администраторов
  getAdminLogs: async (params = {}) => {
    try {
      const response = await adminApiClient.get('/admin/logs', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка получения логов администраторов');
    }
  },
};

export default adminService;