import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { handleApiResponse, adaptVideoData, adaptVideosList } from '../utils/adapterUtils';

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
      // Адаптация к формату ответа бэкенда ApiResponse<T>
      const data = handleApiResponse(response.data);
      
      // Возвращаем адаптированные данные
      return Array.isArray(data) ? { videos: adaptVideosList(data) } : 
             Array.isArray(data?.data) ? { videos: adaptVideosList(data.data) } :
             { videos: adaptVideosList(data?.videos || data || []) };
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data?.error?.message || 'Ошибка получения списка видео');
    }
  },
  
  // Получение информации о видео по ID
  getVideoById: async (videoId) => {
    try {
      const response = await videoApiClient.get(`/videos/${videoId}`);
      // Адаптация к формату ответа бэкенда ApiResponse<T>
      const data = handleApiResponse(response.data);
      
      // Возвращаем адаптированные данные
      return adaptVideoData(data);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data?.error?.message || 'Ошибка получения информации о видео');
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
      // Адаптация к формату ответа бэкенда ApiResponse<T>
      const data = handleApiResponse(response.data);
      
      // Возвращаем адаптированные данные
      return adaptVideoData(data);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data?.error?.message || 'Ошибка загрузки видео');
    }
  },
  
  // Обновление информации о видео
  updateVideo: async (videoId, videoData) => {
    try {
      const response = await videoApiClient.put(`/videos/${videoId}`, videoData);
      // Адаптация к формату ответа бэкенда ApiResponse<T>
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data?.error?.message || 'Ошибка обновления информации о видео');
    }
  },
  
  // Удаление видео
  deleteVideo: async (videoId) => {
    try {
      const response = await videoApiClient.delete(`/videos/${videoId}`);
      // Адаптация к формату ответа бэкенда ApiResponse<T>
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data?.error?.message || 'Ошибка удаления видео');
    }
  },
  
  // Лайк видео
  likeVideo: async (videoId) => {
    try {
      const response = await videoApiClient.post(`/videos/${videoId}/like`);
      // Адаптация к формату ответа бэкенда ApiResponse<T>
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data?.error?.message || 'Ошибка при добавлении лайка');
    }
  },
  
  // Дизлайк видео
  dislikeVideo: async (videoId) => {
    try {
      const response = await videoApiClient.post(`/videos/${videoId}/dislike`);
      // Адаптация к формату ответа бэкенда ApiResponse<T>
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data?.error?.message || 'Ошибка при добавлении дизлайка');
    }
  },
  
  // Удаление реакции (лайка/дизлайка) с видео
  removeReaction: async (videoId) => {
    try {
      const response = await videoApiClient.delete(`/videos/${videoId}/reaction`);
      // Адаптация к формату ответа бэкенда ApiResponse<T>
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data?.error?.message || 'Ошибка при удалении реакции');
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
      // Адаптация к формату ответа бэкенда ApiResponse<T>
      const data = handleApiResponse(response.data);
      
      // Адаптируем формат статуса для фронтенда
      return {
        status: data.status || data.Status || 'processing',
        progress: data.progress || data.Progress || 0
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data?.error?.message || 'Ошибка получения статуса обработки видео');
    }
  },
  
  // Получение комментариев к видео
  getVideoComments: async (videoId, params = {}) => {
    try {
      const response = await videoApiClient.get(`/videos/${videoId}/comments`, { params });
      // Адаптация к формату ответа бэкенда ApiResponse<T>
      const data = handleApiResponse(response.data);
      
      // Возвращаем адаптированные данные
      return {
        comments: Array.isArray(data?.comments) ? data.comments : Array.isArray(data) ? data : [],
        count: data?.count || data?.total || 0,
        hasMore: data?.hasMore || data?.has_more || false
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data?.error?.message || 'Ошибка получения комментариев');
    }
  },
  
  // Добавление комментария к видео
  addVideoComment: async (videoId, commentData) => {
    try {
      const response = await videoApiClient.post(`/videos/${videoId}/comments`, commentData);
      // Адаптация к формату ответа бэкенда ApiResponse<T>
      const data = handleApiResponse(response.data);
      
      // Возвращаем адаптированные данные
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data?.error?.message || 'Ошибка добавления комментария');
    }
  },

  // Удаление комментария
  deleteComment: async (commentId) => {
    try {
      const response = await videoApiClient.delete(`/comments/${commentId}`);
      // Адаптация к формату ответа бэкенда ApiResponse<T>
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data?.error?.message || 'Ошибка удаления комментария');
    }
  },
};

export default videoService;