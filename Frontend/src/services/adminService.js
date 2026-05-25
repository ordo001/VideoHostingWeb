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

// Интерцептор для обработки ответов API
adminApiClient.interceptors.response.use(
  (response) => {
    // Если ответ содержит обертку ApiResponseDto, извлекаем данные
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      if (response.data.success) {
        return response.data.data || response.data;
      } else {
        throw new Error(response.data.error || 'Ошибка выполнения запроса');
      }
    }
    return response.data;
  },
  (error) => {
    // Для несанкционированного доступа (401) - удаляем токен и перенаправляем на страницу входа
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // Извлекаем сообщение об ошибке из ответа API
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        error.message || 
                        'Произошла ошибка';
    
    return Promise.reject(new Error(errorMessage));
  }
);

export const adminService = {
  // Получение списка пользователей
  getUsers: async (params = {}) => {
    try {
      const response = await adminApiClient.get('/admin/users', { params });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Ошибка получения списка пользователей');
    }
  },
  
  // Блокировка пользователя
  banUser: async (userId, banData) => {
    try {
      const response = await adminApiClient.post(`/admin/users/${userId}/ban`, banData);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Ошибка блокировки пользователя');
    }
  },
  
  // Разблокировка пользователя
  unbanUser: async (userId, reason) => {
    try {
      const response = await adminApiClient.post(`/admin/users/${userId}/unban`, { reason });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Ошибка разблокировки пользователя');
    }
  },
  
  // Назначение прав администратора
  makeAdmin: async (userId, reason) => {
    try {
      const response = await adminApiClient.post(`/admin/users/${userId}/make-admin`, { reason });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Ошибка назначения прав администратора');
    }
  },
  
  // Отзыв прав администратора
  revokeAdmin: async (userId, reason) => {
    try {
      const response = await adminApiClient.post(`/admin/users/${userId}/revoke-admin`, { reason });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Ошибка отзыва прав администратора');
    }
  },
  
  // Получение списка видео для модерации
  getVideosForModeration: async (params = {}) => {
    try {
      const response = await adminApiClient.get('/admin/videos', { params });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Ошибка получения списка видео для модерации');
    }
  },
  
  // Одобрение видео
  approveVideo: async (videoId, reason) => {
    try {
      const response = await adminApiClient.post(`/admin/videos/${videoId}/approve`, { reason });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Ошибка одобрения видео');
    }
  },
  
  // Отклонение видео
  rejectVideo: async (videoId, reason) => {
    try {
      const response = await adminApiClient.post(`/admin/videos/${videoId}/reject`, { reason });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Ошибка отклонения видео');
    }
  },
  
  // Удаление видео администратором
  deleteVideo: async (videoId, reason) => {
    try {
      const response = await adminApiClient.delete(`/admin/videos/${videoId}`, {
        data: { reason }
      });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Ошибка удаления видео');
    }
  },
  
  // Получение статистики платформы
  getPlatformStats: async (period = "30d") => {
    try {
      const response = await adminApiClient.get('/admin/stats', { 
        params: { period } 
      });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Ошибка получения статистики платформы');
    }
  },
  
  // Получение логов действий администраторов
  getAdminLogs: async (params = {}) => {
    try {
      const response = await adminApiClient.get('/admin/logs', { params });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Ошибка получения логов администраторов');
    }
  },
};

export default adminService;