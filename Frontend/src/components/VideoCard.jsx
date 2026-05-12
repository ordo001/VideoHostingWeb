import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const BASE_URL = 'http://localhost:9000';
const VideoCard = ({ 
  id = '', // Обеспечиваем значение по умолчанию
  thumbnail, 
  title = 'Без названия', 
  author, 
  duration = 0, 
  views = 0, 
  createdAt,
  onClick,
  className = ''
}) => {
  const navigate = useNavigate();
  
  // Обработчик клика на карточку видео
  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else if (id) {
      // Конвертируем GUID в строку, если это необходимо
      const videoId = typeof id === 'object' ? id.toString() : id;
      navigate(`/watch/${videoId}`);
    }
  };
  // Форматирование продолжительности видео
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Форматирование количества просмотров
  const formatViews = (viewsCount) => {
    if (viewsCount >= 1000000) {
      return `${(viewsCount / 1000000).toFixed(1)}M`;
    }
    if (viewsCount >= 1000) {
      return `${(viewsCount / 1000).toFixed(1)}K`;
    }
    return viewsCount.toString();
  };
  
  // Форматирование даты
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Сегодня';
    if (diffInDays === 1) return 'Вчера';
    if (diffInDays < 7) return `${diffInDays} дней назад`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} недель назад`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} месяцев назад`;
    return `${Math.floor(diffInDays / 365)} лет назад`;
  };
  
  return (
    <motion.div
      className={`bg-gray-900 rounded-2xl overflow-hidden cursor-pointer group ${className}`}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      onClick={handleCardClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        {thumbnail ? (
          <img 
            src={`${BASE_URL}/${thumbnail}`} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
              </svg>
            </div>
          </div>
        )}
        
        {/* Duration badge */}
        {duration && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-1.5 py-1 rounded">
            {formatDuration(duration)}
          </div>
        )}
      </div>
      
      {/* Video info */}
      <div className="p-4">
        <div className="flex">
          {/* Author avatar */}
          <div className="flex-shrink-0 mr-3">
            {author?.avatar || author?.AvatarUrl || author?.avatar_url ? (
              <img 
                src={author?.avatar_url || author?.AvatarUrl || author?.avatar} 
                alt={author?.name || author?.Name || 'Автор'}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {(author?.name?.charAt(0) || author?.Name?.charAt(0) || '?').toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          {/* Video details */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium line-clamp-2 mb-1">
              {title || 'Без названия'}
            </h3>
            
            <p className="text-gray-400 text-sm mb-1">
              {author?.name || author?.Name || 'Неизвестный автор'}
            </p>
            
            <div className="flex text-gray-500 text-xs">
              <span>{formatViews(views || 0)} просмотров</span>
              <span className="mx-1">•</span>
              <span>{formatDate(createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoCard;