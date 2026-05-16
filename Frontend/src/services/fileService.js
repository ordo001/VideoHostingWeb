import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { handleApiResponse } from '../utils/adapterUtils';

// Создаем экземпляр axios для работы с файлами
const fileApiClient = axios.create({
  baseURL: API_BASE_URL,
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
      // Валидация файла
      fileService.validateImageFile(file, 'avatar');
      
      const formData = new FormData();
      formData.append('avatarFile', file);
      
      const response = await fileApiClient.post('/Files/avatar', formData);
      return handleApiResponse(response.data);
    } catch (error) {
      console.error('Avatar upload error:', error.response?.data);
      throw new Error(error.response?.data?.message || error.response?.data?.error?.message || 'Ошибка загрузки аватара');
    }
  },
  
  // Загрузка баннера для канала текущего пользователя
  uploadBanner: async (file) => {
    try {
      // Валидация файла
      fileService.validateImageFile(file, 'banner');
      
      const formData = new FormData();
      formData.append('bannerFile', file);
      
      const response = await fileApiClient.post('/Files/banner', formData);
      return handleApiResponse(response.data);
    } catch (error) {
      console.error('Banner upload error:', error.response?.data);
      throw new Error(error.response?.data?.message || error.response?.data?.error?.message || 'Ошибка загрузки баннера');
    }
  },
  
  // Валидация файла изображения
  validateImageFile: (file, uploadType = 'image') => {
    // Проверяем тип файла
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Неподдерживаемый формат файла. Допустимые форматы: JPEG, PNG, GIF, WebP');
    }
    
    // Проверяем размер файла в зависимости от типа загрузки
    let maxSizeInBytes;
    let maxSizeText;
    
    if (uploadType === 'avatar') {
      maxSizeInBytes = 5 * 1024 * 1024; // 5 MB
      maxSizeText = '5 MB';
    } else if (uploadType === 'banner') {
      maxSizeInBytes = 10 * 1024 * 1024; // 10 MB
      maxSizeText = '10 MB';
    } else {
      maxSizeInBytes = 10 * 1024 * 1024; // 10 MB по умолчанию
      maxSizeText = '10 MB';
    }
    
    if (file.size > maxSizeInBytes) {
      throw new Error(`Размер файла превышает максимально допустимый (${maxSizeText})`);
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