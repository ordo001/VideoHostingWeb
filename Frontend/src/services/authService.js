import axios from 'axios';
import { API_BASE_URL } from '../constants/config';

// Создаем экземпляр axios для работы с аутентификацией
const authApiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const authService = {
  // Регистрация пользователя
  register: async (userData) => {
    try {
      const response = await authApiClient.post('/auth/register', userData);
      console.log('Register response:', response.data);
      // Адаптация к формату ответа бэкенда ApiResponse<T>
      if (response.data) {
        // Если ответ содержит success поле, используем его
        if (response.data.success) {
          return response.data.data || response.data;
        }
        // В противном случае, если ответ содержит token, считаем его успешным
        if (response.data.token) {
          return response.data;
        }
      }
      return response.data;
    } catch (error) {
      console.error('Register error:', error.response?.data);
      throw new Error(error.response?.data?.message || error.response?.data?.error?.message || 'Ошибка регистрации');
    }
  },

  // Вход пользователя
  login: async (credentials) => {
    try {
      const response = await authApiClient.post('/auth/login', credentials);
      console.log('Login response:', response.data);
      // Адаптация к формату ответа бэкенда ApiResponse<T>
      if (response.data) {
        // Если ответ содержит success поле, используем его
        if (response.data.success) {
          return response.data.data || response.data;
        }
        // В противном случае, если ответ содержит token, считаем его успешным
        if (response.data.token) {
          return response.data;
        }
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data);
      throw new Error(error.response?.data?.message || error.response?.data?.error?.message || 'Ошибка входа');
    }
  },

  // Получение данных текущего пользователя
  getCurrentUser: async (token) => {
    try {
      const response = await authApiClient.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Current user response:', response.data);
      // Адаптация к формату ответа бэкенда ApiResponse<T>
      if (response.data) {
        // Если ответ содержит success поле, используем его
        if (response.data.success) {
          return response.data.data || response.data;
        }
        // В противном случае возвращаем как есть
        return response.data;
      }
      return response.data;
    } catch (error) {
      console.error('Current user error:', error.response?.data);
      throw new Error(error.response?.data?.message || error.response?.data?.error?.message || 'Ошибка получения данных пользователя');
    }
  },

  // Обновление профиля пользователя
  updateProfile: async (profileData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await authApiClient.put('/auth/profile', profileData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Адаптация к формату ответа бэкенда ApiResponse<T>
      if (response.data) {
        // Если ответ содержит success поле, используем его
        if (response.data.success) {
          return response.data.data || response.data;
        }
        // В противном случае возвращаем как есть
        return response.data;
      }
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error.response?.data);
      throw new Error(error.response?.data?.message || error.response?.data?.error?.message || 'Ошибка обновления профиля');
    }
  },
  
  // Выход пользователя (клиентская операция)
  logout: () => {
    // Просто удаляем токен из localStorage
    localStorage.removeItem('token');
    return true;
  }
};

export default authService;