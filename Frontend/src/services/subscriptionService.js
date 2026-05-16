import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { handleApiResponse } from '../utils/adapterUtils';
import channelService from './channelService';

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
      return handleApiResponse(response.data);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data?.error?.message || 'Ошибка подписки на канал');
    }
  },
  
  // Отписка от канала
  unsubscribeFromChannel: async (channelId) => {
    try {
      const response = await subscriptionApiClient.post(`/channels/${channelId}/unsubscribe`);
      return handleApiResponse(response.data);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data?.error?.message || 'Ошибка отписки от канала');
    }
  },
  
  // Получение списка подписок текущего пользователя
  getMySubscriptions: async () => {
    try {
      const response = await subscriptionApiClient.get('/users/me/subscriptions');
      const data = handleApiResponse(response.data);
      let channels = [];
      // Обработка формата { channels: [...] }
      if (data && data.channels) {
        channels = data.channels;
      } else {
        channels = data || [];
      }
      
      // Для каждого канала получаем количество видео, если его нет
      const channelsWithVideoCount = await Promise.all(
        channels.map(async (channel) => {
          if (!channel.videos_count || channel.videos_count === 0) {
            try {
              const videosData = await channelService.getChannelVideos(channel.id, { limit: 1 });
              channel.videos_count = videosData.count || 0;
            } catch (error) {
              channel.videos_count = 0;
            }
          }
          return channel;
        })
      );
      
      return channelsWithVideoCount;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data?.error?.message || 'Ошибка получения списка подписок');
    }
  },
  
  // Проверка, подписан ли пользователь на канал
  isSubscribedToChannel: async (channelId) => {
    try {
      const response = await subscriptionApiClient.get(`/channels/${channelId}/is-subscribed`);
      return handleApiResponse(response.data);
    } catch (error) {
      // В случае ошибки считаем, что пользователь не подписан
      return false;
    }
  },
};

export default subscriptionService;