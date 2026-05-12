import React, { useState, useRef } from 'react';
import ReactHlsPlayer from 'react-hls-player';

const VideoPlayer = ({ videoUrl, poster, title }) => {
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  // Обработчики событий плеера
  const handlePlay = () => {
    setIsPlaying(true);
    setIsLoading(false);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleTimeUpdate = () => {
    if (playerRef.current) {
      setCurrentTime(playerRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (playerRef.current) {
      setDuration(playerRef.current.duration);
      setIsLoading(false);
    }
  };

  const handleError = (e) => {
    console.error('Video error:', e);
    setIsLoading(false);
  };

  const handleWaiting = () => {
    setIsLoading(true);
  };

  const handlePlaying = () => {
    setIsLoading(false);
  };

  // Управление воспроизведением
  const togglePlay = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pause();
    } else {
      playerRef.current.play().catch(error => {
        console.error('Error playing video:', error);
      });
    }
  };

  // Перемотка
  const handleSeek = (e) => {
    if (!playerRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const time = pos * duration;

    playerRef.current.currentTime = time;
    setCurrentTime(time);
  };

  // Управление громкостью
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);

    if (playerRef.current) {
      playerRef.current.volume = newVolume;
      playerRef.current.muted = newVolume === 0;
    }
  };

  // Переключение звука
  const toggleMute = () => {
    if (!playerRef.current) return;

    const newMuted = !isMuted;
    setIsMuted(newMuted);
    playerRef.current.muted = newMuted;

    if (newMuted) {
      setVolume(0);
    } else {
      setVolume(playerRef.current.volume || 1);
    }
  };

  return (
    <div className="relative bg-black rounded-2xl overflow-hidden">
      {/* HLS плеер */}
      <ReactHlsPlayer
        playerRef={playerRef}
        src={videoUrl}
        poster={poster}
        className="w-full aspect-video"
        playsInline
        controls={false}
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleError}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
      />

      {/* Индикатор загрузки */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-primary rounded-full animate-spin"></div>
        </div>
      )}

      {/* Контролы плеера */}
      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent flex flex-col justify-end">
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
            <button 
              onClick={togglePlay}
              className="text-white hover:text-primary focus:outline-none"
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
            </button>

            <button 
              onClick={toggleMute}
              className="text-white hover:text-primary focus:outline-none"
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
            </button>

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
        </div>
      </div>

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