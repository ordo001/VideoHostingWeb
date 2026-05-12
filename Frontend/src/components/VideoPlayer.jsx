import React, { useState, useRef, useEffect } from 'react';
import Hls from 'hls.js';
import { motion } from 'framer-motion';
import Button from './Button';

const VideoPlayer = ({ videoUrl, poster, title, onPlay, onPause, onEnded }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showPlaybackRates, setShowPlaybackRates] = useState(false);
  
  // Форматирование времени
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  
  // Улучшенная проверка типа источника видео
  const isHlsStream = (url) => {
    if (!url) return false;
    // Проверяем по расширению файла и по возможным HLS-путям
    return (
      url.includes('.m3u8') || 
      url.includes('playlist') || 
      url.includes('/hls/') ||
      url.includes('manifest')
    );
  };
  
  // Загрузка видео в нативном режиме
  const loadVideoNatively = (video, url) => {
    video.src = url;
    video.crossOrigin = 'anonymous'; // Добавляем поддержку CORS
  };
  
  // Инициализация HLS-плеера с улучшенной обработкой ошибок
  const initializeHlsPlayer = (video, url, onInitialized) => {
    // Очищаем предыдущие экземпляры
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    
    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: false, // Отключаем для стабильности
      backBufferLength: 90,
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      debug: false,
      // Добавляем больше опций для надежности
      maxLoadingDelay: 4,
      maxBufferHole: 0.5,
      highBufferWatchdogPeriod: 2,
      nudgeOffset: 0.1,
      nudgeMaxRetry: 3,
      maxFragLookUpTolerance: 0.25,
      liveSyncDurationCount: 3,
      liveMaxLatencyDurationCount: Infinity,
      preferManagedMediaSource: true,
    });
    
    hlsRef.current = hls;
    hls.loadSource(url);
    hls.attachMedia(video);
    
    // Обрабатываем событие успешной загрузки манифеста
    hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
      console.log('HLS manifest parsed', data);
      if (onInitialized) onInitialized();
    });
    
    // Обрабатываем событие успешной загрузки фрагмента
    hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
      console.log('HLS fragment loaded');
    });
    
    // Расширенная обработка ошибок
    hls.on(Hls.Events.ERROR, (event, data) => {
      console.error('HLS error:', data);
      
      // Обрабатываем некритические ошибки
      if (!data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.warn('Network error, not fatal');
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.warn('Media error, not fatal');
            break;
          default:
            console.warn('Non-fatal error:', data);
        }
        return;
      }
      
      // Обработка критических ошибок
      switch (data.type) {
        case Hls.ErrorTypes.NETWORK_ERROR:
          console.error('Fatal network error, trying to recover...');
          if (hls.currentLevel === -1) {
            // Если уровень не выбран, перезапускаем загрузку с начала
            hls.startLoad(0);
          } else {
            hls.startLoad();
          }
          break;
          
        case Hls.ErrorTypes.MEDIA_ERROR:
          console.error('Fatal media error, trying to recover...');
          try {
            hls.recoverMediaError();
          } catch (e) {
            console.error('Error during media recovery, reloading video');
            fallbackToNativeSupport(video, url, onInitialized);
          }
          break;
          
        case Hls.ErrorTypes.DEMUXER_ERROR:
        case Hls.ErrorTypes.MUX_ERROR:
        case Hls.ErrorTypes.KEY_SYSTEM_ERROR:
          console.error(`Fatal ${data.type} error:`, data.details);
          console.log('Attempting to switch to native playback');
          fallbackToNativeSupport(video, url, onInitialized);
          break;
          
        default:
          console.error('Fatal HLS error encountered:', data);
          console.log('Attempting to switch to native playback');
          fallbackToNativeSupport(video, url, onInitialized);
          break;
      }
    });
  };
  
  // Запасной вариант - переключение на нативную поддержку
  const fallbackToNativeSupport = (video, url, onInitialized) => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    
    console.log('Switching to native video playback as fallback');
    video.src = url;
    video.crossOrigin = 'anonymous';
    if (onInitialized) onInitialized();
  };
  
  // Инициализация HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // Очищаем предыдущие источники и HLS
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    
    // Сбрасываем источник
    video.src = '';
    video.removeAttribute('src');
    
    if (!videoUrl) {
      console.warn('No video URL provided');
      return;
    }
    
    console.log('Loading video from URL:', videoUrl);
    
    // Улучшенная проверка типа источника видео
    const isHlsStream = this.isHlsStream(videoUrl);
    const canPlayNatively = video.canPlayType('application/vnd.apple.mpegurl');
    
    // Если браузер поддерживает нативный HLS и это HLS поток
    if (isHlsStream && canPlayNatively) {
      console.log('Using native HLS support');
      this.loadVideoNatively(video, videoUrl);
      initializeVideoEvents();
      return;
    }
    
    // Если это не HLS поток или браузер не поддерживает HLS нативно
    if (!isHlsStream) {
      console.log('Loading regular video file');
      this.loadVideoNatively(video, videoUrl);
      initializeVideoEvents();
      return;
    }
    
    // Используем HLS.js для HLS потоков
    if (Hls.isSupported()) {
      console.log('Using HLS.js');
      this.initializeHlsPlayer(video, videoUrl, initializeVideoEvents);
    } else {
      // HLS не поддерживается
      console.warn('HLS is not supported in this browser, trying to load video directly');
      this.loadVideoNatively(video, videoUrl);
      initializeVideoEvents();
    }
    
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoUrl]);
  
  // Инициализация событий видео
  const initializeVideoEvents = () => {
    const video = videoRef.current;
    if (!video) return;
    
    const handlePlay = () => {
      setIsPlaying(true);
      if (onPlay) onPlay();
    };
    
    const handlePause = () => {
      setIsPlaying(false);
      if (onPause) onPause();
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };
    
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };
    
    const handleWaiting = () => {
      setIsBuffering(true);
    };
    
    const handlePlaying = () => {
      setIsBuffering(false);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) onEnded();
    };
    
    const handleError = (e) => {
      const errorCode = video.error ? video.error.code : 'unknown';
      const errorMessage = video.error ? video.error.message : 'Unknown error';
      console.error('Video error occurred:', errorCode, errorMessage);
      
      setIsBuffering(false);
      setIsPlaying(false);
      
      // Для разных ошибок выводим разную информацию
      switch (errorCode) {
        case 1: // video.error.MEDIA_ERR_ABORTED
          console.error('Video playback aborted');
          break;
        case 2: // video.error.MEDIA_ERR_NETWORK
          console.error('Network error while loading video');
          // Попробуем перезагрузить видео
          setTimeout(() => {
            if (video.src) {
              video.load();
            }
          }, 1000);
          break;
        case 3: // video.error.MEDIA_ERR_DECODE
          console.error('Video decoding error');
          // Если это HLS поток, попробуем переключить уровень качества
          if (hlsRef.current && hlsRef.current.currentLevel > 0) {
            hlsRef.current.currentLevel = 0;
          }
          break;
        case 4: // video.error.MEDIA_ERR_SRC_NOT_SUPPORTED
          console.error('Video format or source not supported');
          // Если это ошибка формата, и мы используем HLS.js, попробуем нативную поддержку
          if (hlsRef.current) {
            console.log('Attempting fallback to native video playback');
            fallbackToNativeSupport(video, videoUrl, initializeVideoEvents);
          } else if (videoUrl && videoUrl.includes('.m3u8')) {
            // Если это HLS поток, но HLS.js не kullanılıyordu, попробуем его использовать
            console.log('Attempting to use HLS.js as fallback');
            initializeHlsPlayer(video, videoUrl, initializeVideoEvents);
          }
          break;
        default:
          console.error('Unknown video error');
          break;
      }
    };
    
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  };
  
  // Управление воспроизведением с улучшенной обработкой ошибок
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      setIsBuffering(true);
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Воспроизведение началось успешно
            setIsBuffering(false);
          })
          .catch(error => {
            // Обработка ошибки воспроизведения
            setIsBuffering(false);
            console.error('Error playing video:', error);
            
            // Если это ошибка NotSupportedError, пробуем альтернативные методы
            if (error.name === 'NotSupportedError' || error.message.includes('not supported')) {
              console.log('Video source not supported, trying alternative approach');
              
              // Если используем HLS.js, попробуем пересоздать плеер
              if (hlsRef.current) {
                const currentUrl = videoUrl;
                hlsRef.current.destroy();
                hlsRef.current = null;
                
                // Небольшая задержка перед пересозданием
                setTimeout(() => {
                  initializeHlsPlayer(video, currentUrl, initializeVideoEvents);
                }, 100);
              } else if (videoUrl && videoUrl.includes('.m3u8')) {
                // Если это HLS поток без HLS.js, попробуем использовать HLS.js
                initializeHlsPlayer(video, videoUrl, initializeVideoEvents);
              }
            }
          });
      }
    }
  };
  
  // Перемотка
  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const time = pos * duration;
    
    video.currentTime = time;
    setCurrentTime(time);
  };
  
  // Управление громкостью
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    
    const video = videoRef.current;
    if (video) {
      video.volume = newVolume;
      video.muted = newVolume === 0;
    }
  };
  
  // Переключение звука
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    video.muted = newMuted;
    
    if (newMuted) {
      setVolume(0);
    } else {
      setVolume(video.volume || 1);
    }
  };
  
  // Изменение скорости воспроизведения
  const setPlaybackRateHandler = (rate) => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = rate;
      setPlaybackRate(rate);
      setShowPlaybackRates(false);
    }
  };
  
  // Переключение полноэкранного режима
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  // Скрытие/показ контролов при бездействии
  useEffect(() => {
    let timeout;
    if (isPlaying) {
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    
    return () => {
      clearTimeout(timeout);
    };
  }, [isPlaying, showControls]);
  
  const handleMouseMove = () => {
    setShowControls(true);
  };
  
  return (
    <div 
      ref={containerRef}
      className="relative bg-black rounded-2xl overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Видео элемент */}
      <video
        ref={videoRef}
        poster={poster}
        className="w-full aspect-video"
        playsInline
      />
      
      {/* Индикатор буферизации */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-primary rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Контролы плеера */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-t from-black to-transparent flex flex-col justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: showControls ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Прогресс бар */}
        <div 
          className="px-4 py-2 cursor-pointer group"
          onClick={handleSeek}
        >
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full relative"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </div>
        </div>
        
        {/* Кнопки управления */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={togglePlay}
              className="text-white hover:text-primary"
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleMute}
              className="text-white hover:text-primary"
            >
              {isMuted || volume === 0 ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : volume > 0.5 ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6a9 9 0 010 12" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </Button>
            
            <div className="flex items-center w-24">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full accent-primary"
              />
            </div>
            
            <div className="text-sm text-white">
              <span>{formatTime(currentTime)}</span>
              <span className="mx-1">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowPlaybackRates(!showPlaybackRates)}
                className="text-white hover:text-primary"
              >
                <span className="text-sm">{playbackRate}x</span>
              </Button>
              
              {showPlaybackRates && (
                <div className="absolute bottom-full right-0 mb-2 bg-gray-900 rounded-lg shadow-lg py-2 w-24">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                    <button
                      key={rate}
                      className={`block w-full text-left px-4 py-1 text-sm hover:bg-gray-800 ${
                        playbackRate === rate ? 'text-primary' : 'text-white'
                      }`}
                      onClick={() => setPlaybackRateHandler(rate)}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:text-primary"
            >
              {isFullscreen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" />
                </svg>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
      
      {/* Заголовок видео */}
      {title && (
        <div className="absolute top-4 left-4">
          <h3 className="text-lg font-bold text-white bg-black bg-opacity-50 px-3 py-1 rounded-lg">
            {title}
          </h3>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;