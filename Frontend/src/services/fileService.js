import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { handleApiResponse } from '../utils/adapterUtils';

// Используем тот же порт, что и для основного API, но без /api
const API_FILE_URL = API_BASE_URL.replace('/api', '');

// Создаем экземпляр axios для работы с файлами
const fileApiClient = axios.create({
  baseURL: API_FILE_URL,
  timeout: 30000, // Увеличиваем таймаут для загрузки файлов
});

// Интерцептор для добавления токена к запросам
fileApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Устанавливаем правильный Content-Type для multipart/form-data
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const fileService = {
  // Загрузка аватара текущего пользователя
  uploadAvatar: async (file) => {
    try {
      console.log('Начинаем загрузку аватара:', file.name);
      const formData = new FormData();
      formData.append('avatar', file);
      
      // Пробуем сначала путь с API
      const response = await fileApiClient.post('/api/Files/avatar', formData);
      console.log('Ответ от сервера при загрузке аватара:', response.data);
      return handleApiResponse(response.data);
    } catch (error) {
      console.error('Avatar upload error:', error.response?.data);
      
      // Пробуем альтернативный путь
      try {
        const formData = new FormData();
        formData.append('avatar', file);
        const response = await fileApiClient.post('/Files/avatar', formData);
        console.log('Ответ от сервера при загрузке аватара (альтернативный путь):', response.data);
        return handleApiResponse(response.data);
      } catch (altError) {
        console.error('Avatar upload error (alternative path):', altError.response?.data);
        throw new Error(error.response?.data?.message || error.response?.data?.error?.message || altError.response?.data?.message || altError.response?.data?.error?.message || 'Ошибка загрузки аватара');
      }
    }
  },
  
  // Загрузка баннера для канала текущего пользователя
  uploadBanner: async (file) => {
    try {
      console.log('Начинаем загрузку баннера:', file.name);
      const formData = new FormData();
      formData.append('banner', file);
      
      // Пробуем сначала путь с API
      const response = await fileApiClient.post('/api/Files/banner', formData);
      console.log('Ответ от сервера при загрузке баннера:', response.data);
      return handleApiResponse(response.data);
    } catch (error) {
      console.error('Banner upload error:', error.response?.data);
      
      // Пробуем альтернативный путь
      try {
        const formData = new FormData();
        formData.append('banner', file);
        const response = await fileApiClient.post('/Files/banner', formData);
        console.log('Ответ от сервера при загрузке баннера (альтернативный путь):', response.data);
        return handleApiResponse(response.data);
      } catch (altError) {
        console.error('Banner upload error (alternative path):', altError.response?.data);
        throw new Error(error.response?.data?.message || error.response?.data?.error?.message || altError.response?.data?.message || altError.response?.data?.error?.message || 'Ошибка загрузки баннера');
      }
    }
  },
  
  // Валидация файла изображения
  validateImageFile: (file) => {
    // Проверяем тип файла
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Неподдерживаемый формат файла. Допустимые форматы: JPEG, PNG, GIF, WebP');
    }
    
    // Проверяем размер файла (максимальный размер 10MB)
    const maxSizeInBytes = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSizeInBytes) {
      throw new Error('Размер файла превышает максимально допустимый (10 MB)');
    }
    
    return true;
  },
  
  // Преобразование файла в Base64 (опционально для предпросмотра)
  fileToBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => {
        console.error('File to base64 error:', error);
        reject(new Error('Ошибка чтения файла'));
      };
    });
  },
};

export default fileService;