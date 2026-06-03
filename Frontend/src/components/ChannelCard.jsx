import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ChannelCard = ({ 
  id, 
  name, 
  avatarUrl, 
  subscribersCount, 
  videosCount,
  onClick,
  className = ''
}) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/channel/${id}`);
    }
  };
  
  // Форматирование чисел
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };
  
  return (
    <motion.div
      className={`bg-gray-900 rounded-2xl overflow-hidden cursor-pointer group ${className}`}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
    >
      <div className="p-5">
        <div className="flex items-center">
          {/* Аватар канала */}
          <div className="flex-shrink-0 mr-4">
            <div className="w-16 h-16 rounded-full overflow-hidden">
              {avatarUrl ? (
                <img 
                  src={`http://localhost:9000/${avatarUrl}`} 
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <span className="text-xl font-bold text-gray-400">
                    {name?.charAt(0) || '?'}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Информация о канале */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate text-left">
              {name || 'Неизвестный канал'}
            </h3>
            
            <div className="flex text-gray-400 text-sm mt-1">
              <span>{formatNumber(subscribersCount || 0)} подписчиков</span>
            </div>
            
            <div className="flex text-gray-500 text-sm">
              <span>{formatNumber(videosCount || 0)} видео</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChannelCard;