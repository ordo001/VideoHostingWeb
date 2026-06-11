import React, { useRef, useEffect, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { hlsService } from '../services/hlsService';

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

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
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const controlsVisibleRef = useRef(true);
  const volumeSliderRef = useRef(null);

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableQualities, setAvailableQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverProgress, setHoverProgress] = useState(null); // { position: %, time: seconds }

  // ---------- Cleanup ----------
  const cleanup = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    setAvailableQualities([]);
    setCurrentQuality('auto');
  }, []);

  // ---------- HLS initialization ----------
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoId) return;

    setIsLoading(true);
    setError(null);

    const url = `http://localhost:9000/videos/${videoId}/master.m3u8`;

    // Native HLS support (Safari) — canPlayType returns 'probably' or 'maybe'
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => setIsLoading(false));
      video.addEventListener('error', () => {
        setError('Ошибка загрузки видео');
        setIsLoading(false);
      });
    }
    // Use hls.js for browsers without native support
    else if (Hls.isSupported()) {
      cleanup();

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      hlsRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

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

      hls.on(Hls.Events.MANIFEST_PARSED, async () => {
        setIsLoading(false);

        let qualities = [];

        try {
          const playlistContent = await hlsService.getMasterPlaylist(videoId);
          qualities = hlsService.getAvailableQualities(playlistContent);
          console.log('[HLSPlayer] Parsed qualities from playlist:', qualities);
        } catch (err) {
          console.warn('[HLSPlayer] Could not fetch/parse master playlist, falling back to hls.levels:', err);
        }

        // Fallback: derive qualities from hls.js levels if playlist parsing yielded nothing
        if (qualities.length === 0 && hls.levels && hls.levels.length > 0) {
          qualities = hls.levels
            .map(level => ({
              height: level.height,
              name: `${level.height}P`,
              playlistUrl: null
            }))
            .sort((a, b) => a.height - b.height);
          console.log('[HLSPlayer] Fallback qualities from hls.levels:', qualities);
        }

        qualitiesRef.current = qualities;
        setAvailableQualities(qualities);

        if (qualities.length > 0) {
          const screenWidth = window.screen.width;
          let selectedQuality = qualities[qualities.length - 1];

          if (screenWidth <= 640 && qualities.find(q => q.name === '360P')) {
            selectedQuality = qualities.find(q => q.name === '360P');
          } else if (screenWidth <= 1280 && qualities.find(q => q.name === '720P')) {
            selectedQuality = qualities.find(q => q.name === '720P');
          }

          const levelIndex = hls.levels.findIndex(level =>
            level.height === selectedQuality.height
          );

          if (levelIndex !== -1) {
            hls.currentLevel = levelIndex;
            setCurrentQuality(selectedQuality.name);
          }
        }

        if (autoPlay) {
          video.play().catch(err => {
            console.error('Autoplay error:', err);
          });
        }
      });

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
    else {
      setError('Ваш браузер не поддерживает HLS видео');
      setIsLoading(false);
    }

    return () => {
      cleanup();
    };
  }, [videoId, autoPlay, cleanup]);

  // ---------- Video event listeners ----------
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onLoadedMetadata = () => setDuration(video.duration);
    const onDurationChange = () => setDuration(video.duration);
    const onVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('canplay', onCanPlay);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('volumechange', onVolumeChange);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
    };
  }, []);

  // ---------- Fullscreen change listener ----------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // ---------- Initial muted sync ----------
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = muted;
    }
  }, [muted]);

  // ---------- Controls auto-hide ----------
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    controlsVisibleRef.current = true;

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    if (isPlaying && !isDragging && !showQualityMenu) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        controlsVisibleRef.current = false;
      }, 3000);
    }
  }, [isPlaying, isDragging, showQualityMenu]);

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      controlsVisibleRef.current = true;
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }
  }, [isPlaying]);

  // ---------- Handlers ----------
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(err => console.error('Play error:', err));
    } else {
      video.pause();
    }
  }, []);

  const handleSeekMouseDown = useCallback((e) => {
    setIsDragging(true);
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = pos * duration;
  }, [duration]);

  const handleSeekMouseMove = useCallback((e) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (isDragging) {
      const video = videoRef.current;
      if (video && duration) {
        video.currentTime = pos * duration;
      }
    }
    setHoverProgress({ position: pos * 100, time: pos * duration });
  }, [isDragging, duration]);

  const handleSeekMouseLeave = useCallback(() => {
    setHoverProgress(null);
  }, []);

  const handleSeekMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      const onMove = (e) => {
        const bar = document.querySelector('[data-seek-bar]');
        if (bar) {
          const rect = bar.getBoundingClientRect();
          const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          const video = videoRef.current;
          if (video && duration) {
            video.currentTime = pos * duration;
          }
        }
      };
      const onUp = () => setIsDragging(false);
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      return () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
    }
  }, [isDragging, duration]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }, []);

  const handleVolumeChange = useCallback((e) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    video.muted = newVolume === 0;
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => console.error('Fullscreen error:', err));
    } else {
      document.exitFullscreen().catch(err => console.error('Exit fullscreen error:', err));
    }
  }, []);

  const changeQuality = useCallback((qualityName) => {
    if (!hlsRef.current) return;

    if (qualityName === 'auto') {
      hlsRef.current.currentLevel = -1;
      setCurrentQuality('auto');
    } else {
      const quality = availableQualities.find(q => q.name === qualityName);
      if (quality) {
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
  }, [availableQualities]);

  const getQualityText = () => {
    if (currentQuality === 'auto') return 'AUTO';
    return currentQuality;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration ? Math.min(100, (buffered / duration) * 100) : 0;

  // ---------- SVG Icons ----------
  const PlayIcon = (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );

  const PauseIcon = (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );

  const PlayIconLarge = (
    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );

  const PauseIconLarge = (
    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );

  const VolumeHighIcon = (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  );

  const VolumeMuteIcon = (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
    </svg>
  );

  const VolumeLowIcon = (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
    </svg>
  );

  const FullscreenExpandIcon = (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
    </svg>
  );

  const FullscreenExitIcon = (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
    </svg>
  );

  const QualityIcon = (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-2v-4H8v-2h4V8h2v4h4v2z" />
    </svg>
  );

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return VolumeMuteIcon;
    if (volume < 0.5) return VolumeLowIcon;
    return VolumeHighIcon;
  };

  const VolumeIcon = getVolumeIcon();

  // ---------- Render ----------
  return (
    <div
      ref={containerRef}
      className={`relative bg-black aspect-video rounded-xl overflow-hidden select-none group ${className}`}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => {
        if (isPlaying) {
          controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
            controlsVisibleRef.current = false;
          }, 500);
        }
      }}
    >
      {/* Video element — native controls disabled */}
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        muted={muted}
        loop={loop}
        controls={false}
        title={title || 'Видео'}
        playsInline
        preload="metadata"
        onClick={togglePlay}
      />

      {/* Centered play/pause overlay */}
      {!isPlaying && !isLoading && !error && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-20 h-20 rounded-full bg-black bg-opacity-60 flex items-center justify-center text-white transition-transform hover:scale-110">
            {PlayIconLarge}
          </div>
        </div>
      )}

      {/* Click ripple for play/pause feedback */}
      {isPlaying && controlsVisibleRef.current && (
        <div className="absolute inset-0 cursor-pointer" onClick={togglePlay} />
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-gray-800 bg-opacity-80 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-20">
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

      {/* Controls overlay */}
      {controls && (
        <div
          className={`absolute bottom-0 left-0 right-0 z-10 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-pointer-events-none pointer-events-none" />

          {/* Seek bar — positioned at top of controls area */}
          <div className="relative px-4 pt-3 pb-0 pointer-events-auto">
            <div
              data-seek-bar
              className="relative h-1.5 group/seek hover:h-2.5 transition-all cursor-pointer rounded-full"
              onMouseDown={handleSeekMouseDown}
              onMouseMove={handleSeekMouseMove}
              onMouseLeave={handleSeekMouseLeave}
              onMouseUp={handleSeekMouseUp}
            >
              {/* Background track */}
              <div className="absolute inset-0 bg-white/30 rounded-full" />

              {/* Buffered track */}
              <div
                className="absolute top-0 left-0 h-full bg-white/50 rounded-full"
                style={{ width: `${bufferedPercent}%` }}
              />

              {/* Progress track */}
              <div
                className="absolute top-0 left-0 h-full bg-blue-600 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />

              {/* Thumb */}
              <div
                className="absolute top-1/2 w-3.5 h-3.5 bg-blue-600 rounded-full -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover/seek:opacity-100 transition-opacity shadow-lg"
                style={{ left: `${progressPercent}%` }}
              />

              {/* Hover time tooltip */}
              {hoverProgress && hoverProgress.time && (
                <div
                  className="absolute -top-10 bg-gray-900 bg-opacity-90 text-white text-xs px-2 py-1 rounded transform -translate-x-1/2 pointer-events-none"
                  style={{ left: `${hoverProgress.position}%` }}
                >
                  {formatTime(hoverProgress.time)}
                </div>
              )}
            </div>
          </div>

          {/* Control buttons row */}
          <div className="relative flex items-center px-4 py-3 gap-3 pointer-events-auto">
            {/* Play/Pause */}
            <button
              className="text-white hover:text-blue-400 transition-colors flex-shrink-0"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Пауза' : 'Воспроизведение'}
              type="button"
            >
              {isPlaying ? PauseIcon : PlayIcon}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1 group/vol flex-shrink-0">
              <button
                className="text-white hover:text-blue-400 transition-colors"
                onClick={toggleMute}
                aria-label={isMuted ? 'Включить звук' : 'Выключить звук'}
                type="button"
              >
                {VolumeIcon}
              </button>
              <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-200 flex items-center">
                <input
                  ref={volumeSliderRef}
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 accent-blue-600 cursor-pointer"
                  aria-label="Громкость"
                />
              </div>
            </div>

            {/* Time display */}
            <span className="text-white text-sm whitespace-nowrap flex-shrink-0 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Quality selector */}
            {availableQualities.length > 0 && (
              <div className="relative flex-shrink-0">
                <button
                  className="text-white hover:text-blue-400 transition-colors px-2 py-1 rounded text-sm flex items-center gap-1"
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                  aria-label="Выбор качества видео"
                  type="button"
                >
                  {QualityIcon}
                  <span className="text-xs">{getQualityText()}</span>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Quality menu — opens upward */}
                {showQualityMenu && (
                  <div className="absolute bottom-full mb-2 right-0 bg-gray-900 bg-opacity-95 backdrop-blur-sm rounded-lg shadow-xl overflow-hidden min-w-[120px]">
                    <button
                      className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors ${
                        currentQuality === 'auto' ? 'text-blue-400 font-medium' : 'text-white'
                      }`}
                      onClick={() => changeQuality('auto')}
                      type="button"
                    >
                      AUTO
                    </button>
                    {availableQualities.map((quality) => (
                      <button
                        key={quality.name}
                        className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors ${
                          currentQuality === quality.name ? 'text-blue-400 font-medium' : 'text-white'
                        }`}
                        onClick={() => changeQuality(quality.name)}
                        type="button"
                      >
                        {quality.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fullscreen */}
            <button
              className="text-white hover:text-blue-400 transition-colors flex-shrink-0"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим'}
              type="button"
            >
              {isFullscreen ? FullscreenExitIcon : FullscreenExpandIcon}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HLSVideoPlayer;
