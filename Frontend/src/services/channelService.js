import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { handleApiResponse } from '../utils/adapterUtils';

// Создаем экземпляр axios для работы с каналами
const channelApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Интерцептор для добавления токена к запросам
channelApiClient.interceptors.request.use(
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

export const channelService = {
  // Подписка на канал
  subscribeChannel: async (channelId) => {
    try {
      const response = await channelApiClient.post(`/channels/${channelId}/subscribe`);
      return handleApiResponse(response.data);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data?.error?.message || 'Ошибка подписки на канал');
    }
  },
  
  // Отписка от канала
  unsubscribeChannel: async (channelId) => {
    try {
      const response = await channelApiClient.post(`/channels/${channelId}/unsubscribe`);
      return handleApiResponse(response.data);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data?.error?.message || 'Ошибка отписки от канала');
    }
  },
  
  // Проверка статуса подписки
  checkSubscriptionStatus: async (channelId) => {
    try {
      const response = await channelApiClient.get(`/channels/${channelId}/is-subscribed`);
      return handleApiResponse(response.data);
    } catch (error) {
      // Если подписка не найдена, возвращаем false
      if (error.response?.status === 404) {
        return false;
      }
      throw new Error(error.response?.data?.message || error.response?.data?.error?.message || 'Ошибка проверки статуса подписки');
    }
  },
  
  // Получение информации о канале
  getChannelById: async (channelId) => {
    try {
      const response = await channelApiClient.get(`/channels/${channelId}`);
      // Адаптация к формату ответа бэкенда ApiResponse<T>
      const data = handleApiResponse(response.data);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data?.error?.message || 'Ошибка получения информации о канале');
    }
  }
};

export default channelService;