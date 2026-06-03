import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import { hlsService } from '../services/hlsService';

const HLSVideoPlayer = ({ 
  videoId, 
  poster, 
  title, 
  autoPlay = false, 
  controls = true,
  muted = false,
  loop = false,
  className = ''
}) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const qualitiesRef = useRef([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableQualities, setAvailableQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // Cleanup function
  const cleanup = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    setAvailableQualities([]);
    setCurrentQuality('auto');
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoId) return;

    setIsLoading(true);
    setError(null);

    // If browser supports HLS natively (Safari)
    if (!video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = `http://localhost:9000/videos/${videoId}/master.m3u8`;
      video.addEventListener('loadedmetadata', () => setIsLoading(false));
      video.addEventListener('error', (e) => {
        setError('Ошибка загрузки видео');
        setIsLoading(false);
      });
    } 
    // Use hls.js for other browsers
    else if (Hls.isSupported()) {
      cleanup();
      
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      hlsRef.current = hls;

      // Load master playlist
      hls.loadSource(`http://localhost:9000/videos/${videoId}/master.m3u8`);
      hls.attachMedia(video);

      // Handle errors
      hls.on(Hls.Events.ERROR, (event, data) => {
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

      // When manifest is parsed
      hls.on(Hls.Events.MANIFEST_PARSED, async () => {
        setIsLoading(false);
        
        // Get available qualities
        try {
          const playlistContent = await hlsService.getMasterPlaylist(videoId);
          const qualities = hlsService.getAvailableQualities(playlistContent);
          qualitiesRef.current = qualities;
          setAvailableQualities(qualities);
          
          // Set initial quality based on screen size
          if (qualities.length > 0) {
            const screenWidth = window.screen.width;
            let selectedQuality = qualities[qualities.length - 1]; // Default to highest
            
            if (screenWidth <= 640 && qualities.find(q => q.name === '360P')) {
              selectedQuality = qualities.find(q => q.name === '360P');
            } else if (screenWidth <= 1280 && qualities.find(q => q.name === '720P')) {
              selectedQuality = qualities.find(q => q.name === '720P');
            }
            
            // Find the level index in hls.js
            const levelIndex = hls.levels.findIndex(level => 
              level.height === selectedQuality.height
            );
            
            if (levelIndex !== -1) {
              hls.currentLevel = levelIndex;
              setCurrentQuality(selectedQuality.name);
            }
          }
        } catch (err) {
          console.error('Error getting available qualities:', err);
        }

        if (autoPlay) {
          video.play().catch(err => {
            console.error('Autoplay error:', err);
          });
        }
      });

      // Handle level switched
      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const level = hls.levels[data.level];
        if (level) {
          const quality = qualitiesRef.current.find(q => q.height === level.height);
          if (quality) {
            setCurrentQuality(quality.name);
          }
        }
      });
    } 
    // Browser doesn't support HLS
    else {
      setError('Ваш браузер не поддерживает HLS видео');
      setIsLoading(false);
    }

    return () => {
      cleanup();
    };
  }, [videoId, autoPlay]);

  // Change video quality
  const changeQuality = (qualityName) => {
    if (!hlsRef.current) return;
    
    if (qualityName === 'auto') {
      hlsRef.current.currentLevel = -1; // Auto quality
      setCurrentQuality('auto');
    } else {
      const quality = availableQualities.find(q => q.name === qualityName);
      if (quality) {
        // Find the level index in hls.js
        const levelIndex = hlsRef.current.levels.findIndex(level => 
          level.height === quality.height
        );
        
        if (levelIndex !== -1) {
          hlsRef.current.currentLevel = levelIndex;
          setCurrentQuality(qualityName);
        }
      }
    }
    
    setShowQualityMenu(false);
  };

  // Get display text for current quality
  const getQualityText = () => {
    if (currentQuality === 'auto') return 'AUTO';
    return currentQuality;
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
      
      {/* Quality selection button */}
      {controls && availableQualities.length > 0 && (
        <div className="absolute bottom-4 right-4 z-10">
          <div className="relative pb-[17px] pr-[120px]">
            <button
              className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white px-3 py-1 rounded text-sm transition-all flex items-center"
              onClick={() => setShowQualityMenu(!showQualityMenu)}
              aria-label="Выбор качества видео"
            >
              {getQualityText()}
              <svg className="inline-block w-4 h-4 ml-1 fill-current" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* Quality menu */}
            {showQualityMenu && (
              <div className="absolute bottom-full mb-2 right-0 bg-black bg-opacity-90 rounded shadow-lg min-w-full z-10">
                <button
                  className={`block w-full text-left px-3 py-2 text-sm hover:bg-white hover:bg-opacity-10 ${currentQuality === 'auto' ? 'text-blue-400' : 'text-white'}`}
                  onClick={() => changeQuality('auto')}
                >
                  AUTO
                </button>
                {availableQualities.map((quality) => (
                  <button
                    key={quality.name}
                    className={`block w-full text-left px-3 py-2 text-sm hover:bg-white hover:bg-opacity-10 ${currentQuality === quality.name ? 'text-blue-400' : 'text-white'}`}
                    onClick={() => changeQuality(quality.name)}
                  >
                    {quality.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
          <div className="bg-gray-900 rounded-xl p-6 max-w-sm mx-4 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500 bg-opacity-20 flex items-center justify-center mx-auto mb-4">
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

export default HLSVideoPlayer;