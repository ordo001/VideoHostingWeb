import axios from 'axios';
import { API_BASE_URL } from '../constants/config';

// Создаем экземпляр axios для работы с подписками
const subscriptionApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Интерцептор для добавления токена к запросам
subscriptionApiClient.interceptors.request.use(
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

export const subscriptionService = {
  // Подписка на канал
  subscribeToChannel: async (channelId) => {
    try {
      const response = await subscriptionApiClient.post(`/channels/${channelId}/subscribe`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка подписки на канал');
    }
  },
  
  // Отписка от канала
  unsubscribeFromChannel: async (channelId) => {
    try {
      const response = await subscriptionApiClient.post(`/channels/${channelId}/unsubscribe`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка отписки от канала');
    }
  },
  
  // Получение списка подписок текущего пользователя
  getMySubscriptions: async () => {
    try {
      const response = await subscriptionApiClient.get('/users/me/subscriptions');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка получения списка подписок');
    }
  },
  
  // Проверка, подписан ли пользователь на канал
  isSubscribedToChannel: async (channelId) => {
    try {
      // В реальном API может быть отдельный endpoint для проверки подписки
      // Здесь мы получаем список подписок и проверяем наличие канала
      const subscriptions = await subscriptionService.getMySubscriptions();
      return subscriptions.channels.some(channel => channel.id === channelId);
    } catch (error) {
      // В случае ошибки считаем, что пользователь не подписан
      return false;
    }
  },
};

export default subscriptionService;