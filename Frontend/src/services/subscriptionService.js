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
      console.log('Загружаем подписки...');
      const response = await subscriptionApiClient.get('/users/me/subscriptions');
      console.log('Ответ сервера для подписок:', response.data);
      const data = handleApiResponse(response.data);
      console.log('Обработанные данные подписок:', data);
      
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
          // Проверяем, есть ли поле videos_count, если нет или оно равно 0, получаем его
          if (!channel.videos_count && channel.videos_count !== 0) {
            try {
              const videosData = await channelService.getChannelVideos(channel.id, { limit: 1 });
              channel.videos_count = videosData.count || videosData.totalCount || 0;
              console.log(`Канал ${channel.name}: ${channel.videos_count} видео`);
            } catch (error) {
              console.error(`Ошибка получения количества видео для канала ${channel.id}:`, error);
              channel.videos_count = 0;
            }
          } else {
            console.log(`Канал ${channel.name}: уже есть videos_count = ${channel.videos_count}`);
          }
          return channel;
        })
      );
      
      console.log('Итоговые данные каналов с количеством видео:', channelsWithVideoCount);
      return channelsWithVideoCount;
    } catch (error) {
      console.error('Ошибка получения списка подписок:', error);
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