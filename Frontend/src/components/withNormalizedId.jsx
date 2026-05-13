import { useParams, Navigate } from 'react-router-dom';
import React from 'react';
import { normalizeId } from '../utils/adapterUtils';

// HOC для нормализации ID в параметрах маршрута
const withNormalizedId = (Component) => {
  return (props) => {
    const { videoId, channelId, userId } = useParams();
    
    // Проверяем, что ID является корректным форматом
    const checkAndNormalizeId = (id) => {
      try {
        const normalized = normalizeId(id);
        // Если ID изменился после нормализации, перенаправляем
        if (id && normalized && normalized !== id) {
          return { isInvalid: true, normalizedId: normalized };
        }
        return { isInvalid: false, normalizedId: normalized };
      } catch (e) {
        return { isInvalid: true, normalizedId: '' };
      }
    };
    
    // Проверяем видеo ID
    if (videoId) {
      const { isInvalid, normalizedId } = checkAndNormalizeId(videoId);
      if (isInvalid) {
        return <Navigate to={`/watch/${normalizedId}`} replace />;
      }
    }
    
    // Проверяем ID канала
    if (channelId) {
      const { isInvalid, normalizedId } = checkAndNormalizeId(channelId);
      if (isInvalid) {
        return <Navigate to={`/channel/${normalizedId}`} replace />;
      }
    }
    
    // Проверяем ID пользователя
    if (userId) {
      const { isInvalid, normalizedId } = checkAndNormalizeId(userId);
      if (isInvalid) {
        return <Navigate to={`/profile/${normalizedId}`} replace />;
      }
    }
    
    return <Component {...props} />;
  };
};

export default withNormalizedId;