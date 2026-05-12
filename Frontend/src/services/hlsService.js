import axios from 'axios';

const HLS_BASE_URL = 'http://localhost:9000'; // S3/MinIO хранилище

/**
 * Сервис для работы с HLS видео и оптимизации загрузки сегментов
 */
export const hlsService = {
  /**
   * Получает мастер плейлист HLS
   * @param {string} videoUrl - URL HLS видео (включая videoId)
   * @returns {Promise<string>} - Содержимое плейлиста
   */
  getMasterPlaylist: async (videoUrl) => {
    try {
      // Извлекаем videoId из URL
      const urlParts = videoUrl.split('/');
      const videoIndex = urlParts.findIndex(part => part === 'streaming');
      const videoId = videoIndex !== -1 && urlParts[videoIndex + 1] ? urlParts[videoIndex + 1] : null;
      
      if (!videoId) {
        // Если не удалось извлечь ID, используем исходный URL
        const response = await fetch(videoUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
      }
      
      const response = await fetch(`${HLS_BASE_URL}/videos/streaming/${videoId}/master.m3u8`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error fetching master playlist:', error);
      throw error;
    }
  },

  /**
   * Получает медиа плейлист для определенного качества
   * @param {string} videoId - ID видео
   * @param {string} quality - Качество видео (360p, 480p, 720p, 1080p)
   * @returns {Promise<string>} - Содержимое плейлиста
   */
  getMediaPlaylist: async (videoId, quality) => {
    try {
      const response = await fetch(`${HLS_BASE_URL}/videos/streaming/${videoId}/${quality}/playlist.m3u8`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error(`Error fetching ${quality} media playlist:`, error);
      throw error;
    }
  },

  /**
   * Получает видео сегмент напрямую из хранилища S3/MinIO
   * @param {string} videoId - ID видео
   * @param {string} quality - Качество видео
   * @param {string} segmentName - Имя сегмента
   * @returns {Promise<ArrayBuffer>} - Данные сегмента
   */
  getVideoSegment: async (videoId, quality, segmentName) => {
    try {
      const response = await fetch(`${HLS_BASE_URL}/videos/streaming/${videoId}/${quality}/${segmentName}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.arrayBuffer();
    } catch (error) {
      console.error(`Error fetching segment ${segmentName}:`, error);
      throw error;
    }
  },

  // Кэш для плейлистов и сегментов
  const playlistCache = new Map();
  const segmentCache = new Map();

  /**
   * Очищает кэш плейлистов
   * @param {string} videoId - ID видео (необязательно)
   */
  clearPlaylistCache(videoId) {
    if (videoId) {
      playlistCache.delete(`master-${videoId}`);
    } else {
      playlistCache.clear();
    }
  },

  /**
   * Очищает кэш сегментов
   * @param {string} videoId - ID видео (необязательно)
   */
  clearSegmentCache(videoId) {
    if (videoId) {
      const keysToDelete = [];
      for (const key of segmentCache.keys()) {
        if (key.startsWith(`${videoId}-`)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => segmentCache.delete(key));
    } else {
      segmentCache.clear();
    }
  },

  /**
   * Кастомный загрузчик для hls.js для оптимизации загрузки сегментов
   */
  createCustomLoader: () => {
    return class CustomLoader extends Hls.DefaultConfig.loader {
      constructor(config) {
        super(config);
        this.config = config;
        this.loadingPromises = new Map(); // Для предотвращения дублирующих запросов
      }

      async load(context, config, callbacks) {
        const { url, elementType } = context;
        
        try {
          // Если это загрузка сегмента видео
          if (elementType === 'fragment') {
            return await this.loadSegment(url, context, callbacks);
          }
          
          // Если это загрузка плейлиста
          if (elementType === 'manifest') {
            return await this.loadManifest(url, context, callbacks);
          }
          
          // Для других типов используем стандартный загрузчик
          return super.load(context, config, callbacks);
        } catch (error) {
          console.error('Custom loader error:', error);
          return callbacks.onError(error, {});
        }
      }

      async loadSegment(url, context, callbacks) {
        const cacheKey = this.getCacheKey(url, 'segment');
        const originalUrl = url;
        
        // Проверяем, уже ли загружается этот сегмент
        if (this.loadingPromises.has(cacheKey)) {
          return this.loadingPromises.get(cacheKey);
        }
        
        // Проверяем кэш сегментов
        if (segmentCache.has(cacheKey)) {
          const cachedData = segmentCache.get(cacheKey);
          return callbacks.onSuccess(
            { 
              url: originalUrl, 
              data: cachedData,
              // Указываем, что данные из кэша
              cached: true
            }, 
            {}
          );
        }
        
        // Создаем promise для загрузки
        const loadPromise = this.fetchSegmentDirectly(url, cacheKey, originalUrl, callbacks);
        this.loadingPromises.set(cacheKey, loadPromise);
        
        try {
          const result = await loadPromise;
          return result;
        } finally {
          // Удаляем promise после завершения (успешного или неуспешного)
          this.loadingPromises.delete(cacheKey);
        }
      }

      async loadManifest(url, context, callbacks) {
        const cacheKey = this.getCacheKey(url, 'playlist');
        const originalUrl = url;
        
        // Проверяем кэш плейлистов
        if (playlistCache.has(cacheKey)) {
          const cachedData = playlistCache.get(cacheKey);
          return callbacks.onSuccess(
            { 
              url: originalUrl, 
              data: cachedData,
              cached: true
            }, 
            {}
          );
        }
        
        try {
          // Загружаем плейлист
          const response = await fetch(originalUrl);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.text();
          
          // Сохраняем в кэш (ограничиваем размер)
          if (playlistCache.size >= 10) {
            // Удаляем самый старый элемент из кэша
            const firstKey = playlistCache.keys().next().value;
            playlistCache.delete(firstKey);
          }
          playlistCache.set(cacheKey, data);
          
          return callbacks.onSuccess(
            { 
              url: originalUrl, 
              data 
            }, 
            {}
          );
        } catch (error) {
          console.error('Error loading playlist:', error);
          throw error;
        }
      }

      async fetchSegmentDirectly(url, cacheKey, originalUrl, callbacks) {
        try {
          // Прямое обращение к S3/MinIO хранилищу
          const response = await fetch(originalUrl, {
            // Оптимизация для загрузки сегментов
            headers: {
              'Cache-Control': 'max-age=3600', // Кэширование на 1 час
            },
            // Увеличиваем таймаут для больших сегментов
            signal: AbortSignal.timeout(15000),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          // Получаем данные как ArrayBuffer для оптимизации
          const data = await response.arrayBuffer();
          
          // Сохраняем в кэш (ограничиваем размер)
          if (segmentCache.size >= 50) {
            // Удаляем самые старые элементы из кэша
            const keysToDelete = Array.from(segmentCache.keys()).slice(0, 10);
            keysToDelete.forEach(key => segmentCache.delete(key));
          }
          segmentCache.set(cacheKey, data);
          
          // Возвращаем успешный результат
          return callbacks.onSuccess(
            { 
              url: originalUrl, 
              data,
              fromCache: false 
            }, 
            {}
          );
        } catch (error) {
          console.error(`Error fetching segment ${url}:`, error);
          
          // Пробуем использовать базовый загрузчик как fallback
          return super.load(context, {}, callbacks);
        }
      }

      getCacheKey(url, type) {
        // Создаем ключ для кэша на основе URL и типа
        const urlParts = url.split('/');
        if (type === 'segment') {
          // Для сегментов используем videoId и имя сегмента
          let videoIndex = urlParts.findIndex(part => part === 'streaming');
          if (videoIndex !== -1) {
            const videoId = urlParts[videoIndex + 1] || 'unknown';
            const segmentName = urlParts.pop();
            return `${videoId}-${segmentName}`;
          }
          return `unknown-${urlParts.pop()}`;
        } else {
          // Для плейлистов используем videoId
          let videoIndex = urlParts.findIndex(part => part === 'streaming');
          if (videoIndex !== -1) {
            const videoId = urlParts[videoIndex + 1] || 'master';
            const playlistType = urlParts.slice(-2, -1)[0] || 'master';
            return `${videoId}-${playlistType}`;
          }
          return 'master';
        }
      }

      destroy() {
        this.loadingPromises.clear();
        super.destroy();
      }
    };
  }
};

export default hlsService;