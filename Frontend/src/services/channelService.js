import axios from 'axios';
import { API_BASE_URL } from '../constants/config';

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
  // Получение информации о канале по ID
  getChannelById: async (channelId) => {
    try {
      const response = await channelApiClient.get(`/channels/${channelId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка получения информации о канале');
    }
  },
  
  // Получение видео канала
  getChannelVideos: async (channelId, params = {}) => {
    try {
      const response = await channelApiClient.get(`/channels/${channelId}/videos`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка получения видео канала');
    }
  },
  
  // Получение информации о своем канале
  getMyChannel: async () => {
    try {
      const response = await channelApiClient.get('/channels/me');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка получения информации о вашем канале');
    }
  },
  
  // Обновление информации о своем канале
  updateMyChannel: async (channelData) => {
    try {
      const response = await channelApiClient.put('/channels/me', channelData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка обновления информации о канале');
    }
  },
  
  // Загрузка аватара канала
  uploadChannelAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await channelApiClient.post('/channels/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка загрузки аватара канала');
    }
  },
  
  // Загрузка баннера канала
  uploadChannelBanner: async (file) => {
    try {
      const formData = new FormData();
      formData.append('banner', file);
      
      const response = await channelApiClient.post('/channels/banner', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка загрузки баннера канала');
    }
  },
};

export default channelService;