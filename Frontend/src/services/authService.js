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
      // Адаптация к формату ответа бэкенда ApiResponse<T>
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data?.error?.message || 'Ошибка регистрации');
    }
  },

  // Вход пользователя
  login: async (credentials) => {
    try {
      const response = await authApiClient.post('/auth/login', credentials);
      // Адаптация к формату ответа бэкенда ApiResponse<T>
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
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
      // Адаптация к формату ответа бэкенда ApiResponse<T>
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data?.error?.message || 'Ошибка получения данных пользователя');
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