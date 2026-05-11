import axios from 'axios';
import { API_BASE_URL } from '../constants/config';

// Создаем экземпляр axios для работы с видео
const videoApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Увеличенный таймаут для загрузки видео
});

// Интерцептор для добавления токена к запросам
videoApiClient.interceptors.request.use(
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

export const videoService = {
  // Получение списка видео
  getVideos: async (params = {}) => {
    try {
      const response = await videoApiClient.get('/videos', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка получения списка видео');
    }
  },
  
  // Получение информации о видео по ID
  getVideoById: async (videoId) => {
    try {
      const response = await videoApiClient.get(`/videos/${videoId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка получения информации о видео');
    }
  },
  
  // Загрузка нового видео
  uploadVideo: async (formData, onProgress) => {
    try {
      const response = await videoApiClient.post('/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка загрузки видео');
    }
  },
  
  // Обновление информации о видео
  updateVideo: async (videoId, videoData) => {
    try {
      const response = await videoApiClient.put(`/videos/${videoId}`, videoData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка обновления информации о видео');
    }
  },
  
  // Удаление видео
  deleteVideo: async (videoId) => {
    try {
      const response = await videoApiClient.delete(`/videos/${videoId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка удаления видео');
    }
  },
  
  // Лайк видео
  likeVideo: async (videoId) => {
    try {
      const response = await videoApiClient.post(`/videos/${videoId}/like`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка при добавлении лайка');
    }
  },
  
  // Дизлайк видео
  dislikeVideo: async (videoId) => {
    try {
      const response = await videoApiClient.post(`/videos/${videoId}/dislike`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка при добавлении дизлайка');
    }
  },
  
  // Увеличение счетчика просмотров
  viewVideo: async (videoId) => {
    try {
      const response = await videoApiClient.post(`/videos/${videoId}/view`);
      return response.data;
    } catch (error) {
      // Не выбрасываем ошибку, так как просмотр не критичен для UX
      console.warn('Ошибка увеличения счетчика просмотров:', error.message);
      return null;
    }
  },
  
  // Получение статуса обработки видео
  getVideoProcessingStatus: async (videoId) => {
    try {
      const response = await videoApiClient.get(`/videos/${videoId}/processing-status`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка получения статуса обработки видео');
    }
  },
  
  // Получение комментариев к видео
  getVideoComments: async (videoId, params = {}) => {
    try {
      const response = await videoApiClient.get(`/videos/${videoId}/comments`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка получения комментариев');
    }
  },
  
  // Добавление комментария к видео
  addVideoComment: async (videoId, commentData) => {
    try {
      const response = await videoApiClient.post(`/videos/${videoId}/comments`, commentData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Ошибка добавления комментария');
    }
  },
};

export default videoService;