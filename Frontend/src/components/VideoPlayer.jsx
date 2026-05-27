import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import hlsService from '../services/hlsService';

const VideoPlayer = ({ 
  videoUrl, 
  poster, 
  title, 
  autoPlay = false, 
  controls = true,
  muted = false,
  loop = false,
  className = '',
  onTimeUpdate,
  onLoadedMetadata,
  onEnded
}) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableLevels, setAvailableLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(-1); // -1 = auto
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const cleanupSegmentLoader = useRef(null); // Ссылка на функцию очистки

  // Очистка ресурсов
  const cleanup = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  };

  // Получение мастер-плейлиста через API с оптимизацией загрузки сегментов
  const fetchMasterPlaylist = async () => {
    try {
      if (!videoUrl) {
        throw new Error('Video URL is not provided');
      }
      
      // Используем hlsService для оптимизированной загрузки
      const playlist = await hlsService.getMasterPlaylist(videoUrl);
      return playlist;
    } catch (err) {
      console.error('Error fetching master playlist:', err);
      // Если hlsService не смог загрузить, пробуем прямой запрос
      try {
        const response = await fetch(videoUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      } catch (fallbackErr) {
        console.error('Fallback fetch also failed:', fallbackErr);
        throw err;
      }
    }
  };

  // Функция для оптимизации загрузки сегментов напрямую из хранилища
  const setupSegmentLoader = (hlsInstance) => {
    // Карта для отслеживания загруженных сегментов
    const loadedSegments = new Map();
    
    // Настройка кастомного загрузчика сегментов для прямого доступа к S3
    const originalFragmentLoader = hlsInstance.config.loader;
    
    // Устанавливаем кастомный загрузчик из hlsService
    hlsInstance.config.loader = hlsService.createCustomLoader();
    
    // Настраиваем обработчик для оптимизации загрузки
    hlsInstance.on(Hls.Events.FRAG_LOADING, (event, data) => {
      const { frag } = data;
      const segKey = `${frag.level}-${frag.sn}`;
      
      // Регистрируем попытку загрузки
      console.log(`Loading fragment: Level ${frag.level}, SN ${frag.sn}`);
      
      // Проверяем, есть ли приоритетные сегменты, которые нужно загрузить первыми
      if (frag.sn % 10 === 0) {
        // Каждый 10-й сегмент - ключевой, приоритетный
        console.log(`Priority fragment detected: ${segKey}`);
      }
      
      // Определяем время ожидания для сегмента в зависимости от его важности
      frag.stats.trequest = performance.now();
    });

    // Обработка успешной загрузки сегментов
    hlsInstance.on(Hls.Events.FRAG_LOADED, (event, data) => {
      const { frag } = data;
      const segKey = `${frag.level}-${frag.sn}`;
      const loadTime = performance.now() - frag.stats.trequest;
      
      // Сохраняем информацию о загруженном сегменте
      loadedSegments.set(segKey, {
        loadTime,
        size: data.stats.loaded,
        timestamp: Date.now()
      });
      
      console.log(`Fragment loaded: ${segKey} in ${loadTime.toFixed(2)}ms`);
      
      // Оптимизация: если загрузка была медленной, увеличиваем буфер
      if (loadTime > 2000) { // Больше 2 секунд
        const currentBuffer = hlsInstance.config.maxBufferLength;
        console.log(`Slow fragment detected (${loadTime.toFixed(2)}ms), increasing buffer`);
        hlsInstance.config.maxBufferLength = Math.min(currentBuffer + 5, 60); // Увеличиваем до 60 сек
      }
    });

    // Обработка ошибок при загрузке сегментов
    hlsInstance.on(Hls.Events.FRAG_LOAD_ERROR, (event, data) => {
      const { frag, details } = data;
      const segKey = `${frag.level}-${frag.sn}`;
      
      console.error(`Error loading fragment: ${segKey}`, details);
      
      // Анализируем тип ошибки и принимаем соответствующие меры
      switch (details) {
        case 'timeout':
          // Проблема с таймаутом - возможно, плохое соединение
          console.log('Timeout error, switching to lower quality');
          if (frag.level > 0) {
            // Автоматическое понижение качества при проблемах с загрузкой
            hlsInstance.currentLevel = frag.level - 1;
          }
          // Увеличиваем таймаут для следующей попытки
          hlsInstance.config.fragLoadingTimeOut = Math.min(hlsInstance.config.fragLoadingTimeOut * 1.5, 60000);
          break;
          
        case 'networkError':
          // Ошибка сети - увеличиваем количество попыток
          console.log('Network error, increasing retry count');
          hlsInstance.config.fragLoadingMaxRetry = Math.min(hlsInstance.config.fragLoadingMaxRetry + 1, 10);
          break;
          
        case 'abortError':
          // Ошибка прерывания - возможно, пользователь переключил качество
          console.log('Fragment loading aborted, likely due to quality change');
          break;
          
        default:
          // Другие ошибки - понижаем качество
          console.log('Unknown error, switching to lower quality');
          if (frag.level > 0) {
            hlsInstance.currentLevel = frag.level - 1;
          }
      }
    });

    // Обработка изменения уровня качества
    hlsInstance.on(Hls.Events.LEVEL_SWITCHING, (event, data) => {
      const { level } = data;
      console.log(`Switching to quality level: ${level}`);
      
      // Сбрасываем счетчик ошибок при переключении качества
      hlsInstance.config.fragLoadingMaxRetry = 4;
      hlsInstance.config.fragLoadingTimeOut = 30000;
      
      // Очищаем кэш старых сегментов при переключении на другое качество
      if (level !== hlsInstance.previousLevel) {
        loadedSegments.clear();
      }
    });

    // Возвращаем функцию очистки для освобождения ресурсов
    return () => {
      loadedSegments.clear();
      // Восстанавливаем оригинальный загрузчик
      hlsInstance.config.loader = originalFragmentLoader;
    };
  };

  // Функция для автоматического выбора начального качества
  const getInitialQualityLevel = (levels) => {
    // Определяем качество на основе размера экрана
    const screenWidth = window.screen.width;
    
    if (screenWidth <= 640) {
      // Для мобильных устройств выбираем 360p
      const level360 = levels.find(l => l.height === 360);
      return level360 ? level360.levelIndex : -1;
    } else if (screenWidth <= 1280) {
      // Для средних экранов выбираем 720p
      const level720 = levels.find(l => l.height === 720);
      return level720 ? level720.levelIndex : -1;
    } else {
      // Для больших экранов выбираем 1080p
      const level1080 = levels.find(l => l.height === 1080);
      return level1080 ? level1080.levelIndex : -1;
    }
  };

  // Функция для предварительной загрузки мастер-плейлиста
  const preloadMasterPlaylist = async (hlsInstance) => {
    try {
      const playlist = await fetchMasterPlaylist();
      console.log('Master playlist loaded:', playlist);
      
      // Анализ плейлиста для определения доступных вариантов качества
      // Это может помочь оптимизировать выбор начального качества
      return playlist;
    } catch (error) {
      console.error('Error preloading master playlist:', error);
      return null;
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setError(null);

    // Если браузер поддерживает HLS нативно
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;
      video.addEventListener('loadedmetadata', () => setIsLoading(false));
      video.addEventListener('error', (e) => {
        setError('Ошибка загрузки video');
        setIsLoading(false);
      });
    } 
    // Иначе используем hls.js
    else if (Hls.isSupported()) {
      cleanup();
      
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 300,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: Infinity,
        // Оптимизация для загрузки сегментов из S3
        fragLoadingTimeOut: 30000,
        fragLoadingMaxRetry: 4,
        manifestLoadingTimeOut: 20000,
        manifestLoadingMaxRetry: 4,
        // Кастомный загрузчик для прямого доступа к сегментам из хранилища
        loader: Hls.DefaultConfig.loader,
      });

      // Настраиваем оптимизированную загрузку сегментов
      cleanupSegmentLoader.current = setupSegmentLoader(hls);
      
      // Предварительная загрузка мастер-плейлиста для оптимизации
      preloadMasterPlaylist(hls).then(() => {
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
      }).catch(() => {
        // Если предварительная загрузка не удалась, загружаем обычным способом
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
      });

      // Обработка ошибок
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError('Ошибка сети при загрузке видео');
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError('Ошибка воспроизведения видео');
              break;
            default:
              setError('Произошла ошибка при загрузке видео');
              break;
          }
          setIsLoading(false);
        }
      });

      // Успешная загрузка
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        
        // Получаем доступные уровни качества и фильтруем только нужные
        const filteredLevels = hls.levels
          .map((level, index) => ({
            height: level.height,
            bitrate: level.bitrate,
            name: `${level.height}p`,
            levelIndex: index
          }))
          .filter(level => [360, 720, 1080].includes(level.height))
          .sort((a, b) => a.height - b.height);

        setAvailableLevels(filteredLevels);
        
        // Автоматический выбор начального качества
        if (filteredLevels.length > 0) {
          const initialLevel = getInitialQualityLevel(filteredLevels);
          if (initialLevel !== -1) {
            hls.currentLevel = initialLevel;
            setCurrentLevel(initialLevel);
          }
        }
        
        if (autoPlay) {
          video.play().catch(err => {
            console.error('Autoplay error:', err);
          });
        }
      });

      // Обработка изменения уровня качества
      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        setCurrentLevel(data.level);
      });

      hlsRef.current = hls;
    } 
    // Браузер не поддерживает HLS
    else {
      setError('Ваш браузер не поддерживает HLS видео');
      setIsLoading(false);
    }

    // Определяем обработчики событий
    if (onTimeUpdate) {
      video.addEventListener('timeupdate', onTimeUpdate);
    }
    
    if (onLoadedMetadata) {
      video.addEventListener('loadedmetadata', onLoadedMetadata);
    }
    
    if (onEnded) {
      video.addEventListener('ended', onEnded);
    }

    return () => {
      cleanup();
      
      // Очищаем ресурсы, связанные с загрузчиком сегментов
      if (cleanupSegmentLoader.current) {
        cleanupSegmentLoader.current();
        cleanupSegmentLoader.current = null;
      }
      
      if (onTimeUpdate) {
        video.removeEventListener('timeupdate', onTimeUpdate);
      }
      
      if (onLoadedMetadata) {
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
      }
      
      if (onEnded) {
        video.removeEventListener('ended', onEnded);
      }
    };
  }, [videoUrl, autoPlay, onTimeUpdate, onLoadedMetadata, onEnded, currentLevel, availableLevels]);

  // Функция для смены качества видео
  const changeQuality = (levelIndex) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      setCurrentLevel(levelIndex);
      setShowQualityMenu(false);
      console.log(`Quality changed to level: ${levelIndex}`);
    }
  };

  // Обработчик для отображения названия текущего качества
  const getQualityText = () => {
    if (currentLevel === -1) return 'Авто';
    const currentLevelObj = availableLevels.find(level => level.levelIndex === currentLevel);
    return currentLevelObj ? currentLevelObj.name : 'Авто';
  };

  return (
    <div className={`relative bg-black aspect-video rounded-xl overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        muted={muted}
        loop={loop}
        controls={controls}
        title={title || 'Видео'}
        playsInline
        preload="metadata"
      />
      
      {/* Кнопка выбора качества видео */}
      {controls && availableLevels.length > 0 && (
        <div className="absolute bottom-4 right-4">
          <div className="relative">
            <button
              className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white px-3 py-1 rounded text-sm transition-all"
              onClick={() => setShowQualityMenu(!showQualityMenu)}
            >
              {getQualityText()}
              <svg className="inline-block w-4 h-4 ml-1 fill-current" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* Меню выбора качества */}
            {showQualityMenu && (
              <div className="absolute bottom-full mb-2 right-0 bg-black bg-opacity-90 rounded shadow-lg min-w-full z-10">
                <button
                  className={`block w-full text-left px-3 py-2 text-sm hover:bg-white hover:bg-opacity-10 ${currentLevel === -1 ? 'text-blue-400' : 'text-white'}`}
                  onClick={() => changeQuality(-1)}
                >
                  Авто
                </button>
                {availableLevels.map((level) => (
                  <button
                    key={level.levelIndex}
                    className={`block w-full text-left px-3 py-2 text-sm hover:bg-white hover:bg-opacity-10 ${currentLevel === level.levelIndex ? 'text-blue-400' : 'text-white'}`}
                    onClick={() => changeQuality(level.levelIndex)}
                  >
                    {level.name} ({Math.round(level.bitrate / 1000)}k)
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Индикатор загрузки */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        </div>
      )}
      
      {/* Сообщение об ошибке */}
      {error && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
          <div className="bg-gray-900 rounded-xl p-6 max-w-sm mx-4 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500 bg-opacity-20 flex	items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-2">Ошибка воспроизведения</h3>
            <p className="text-gray-400 text-sm">{error}</p>
            <button 
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              onClick={() => window.location.reload()}
            >
              Обновить
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;