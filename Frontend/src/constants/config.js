// Базовый URL для API
export const API_BASE_URL = 'http://localhost:8080/api';

// Цвета темы
export const COLORS = {
  PRIMARY: '#2563EB',
  DARK: '#000000',
  LIGHT: '#ffffff',
  GRAY_900: '#111827',
  GRAY_800: '#1f2937',
  GRAY_700: '#374151',
  GRAY_500: '#6b7280',
  GRAY_400: '#9ca3af',
  RED_500: '#ef4444',
  GREEN_500: '#10b981',
  YELLOW_500: '#f59e0b',
};

// Размеры видео
export const VIDEO_RESOLUTIONS = {
  '360p': { width: 640, height: 360 },
  '480p': { width: 854, height: 480 },
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
};

// Типы уведомлений
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Статусы обработки видео
export const VIDEO_PROCESSING_STATUS = {
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

// Варианты сортировки видео
export const VIDEO_SORT_OPTIONS = [
  { value: 'created_at', label: 'Дата добавления' },
  { value: 'views', label: 'Просмотры' },
  { value: 'likes', label: 'Лайки' },
  { value: 'duration', label: 'Длительность' },
];

// Варианты порядка сортировки
export const SORT_ORDER_OPTIONS = [
  { value: 'desc', label: 'По убыванию' },
  { value: 'asc', label: 'По возрастанию' },
];