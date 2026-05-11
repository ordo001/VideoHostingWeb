/**
 * Адаптер для нормализации данных от бэкенда к формату, ожидаемому фронтендом
 */

// Адаптация данных видео
export const adaptVideoData = (video) => {
  if (!video) return null;
  
  return {
    ...video,
    // Нормализация полей в camelCase
    id: video.id ? video.id.toString() : 
        video.Id ? video.Id.toString() : 
        video.id ? video.id.toString() : 
        '',
    
    title: video.title || video.Title || '',
    
    description: video.description || video.Description || '',
    
    // Нормализация URL изображений
    thumbnail_url: video.thumbnail_url || 
                   video.thumbnailUrl || 
                   video.ThumbnailUrl || 
                   video.thumbnail ||
                   null,
    
    hls_url: video.hls_url || 
             video.hlsUrl || 
             video.HlsUrl || 
             null,
    
    processing_status: video.processing_status || 
                       video.processingStatus || 
                       video.Status || 
                       'processing',
    
    views: video.views || 
          video.Views || 
          0,
    
    likes: video.likes || 
          video.Likes || 
          0,
    
    dislikes: video.dislikes || 
             video.Dislikes || 
             0,
    
    is_liked: video.is_liked || 
              video.IsLiked || 
              false,
    
    is_disliked: video.is_disliked || 
                video.IsDisliked || 
                false,
    
    is_subscribed: video.is_subscribed || 
                  video.IsSubscribed || 
                  false,
    
    duration: video.duration || 
             video.Duration || 
             0,
    
    created_at: video.created_at || 
               video.CreatedAt || 
               video.createdAt || 
               new Date().toISOString(),
    
    // Нормализация данных автора
    author: adaptUserData(video.author || 
                         video.Author || 
                         video.User || 
                         null)
  };
};

// Адаптация данных пользователя
export const adaptUserData = (user) => {
  if (!user) return { name: 'Неизвестный автор' };
  
  return {
    ...user,
    id: user.id ? user.id.toString() : 
        user.Id ? user.Id.toString() : 
        '',
    
    name: user.name || 
          user.Name || 
          'Без имени',
    
    email: user.email || 
           user.Email || 
           '',
    
    avatar: user.avatar || 
           user.avatar_url || 
           user.AvatarUrl || 
           user.avatarUrl || 
           null,
    
    subscribers_count: user.subscribers_count || 
                       user.SubscribersCount || 
                       0,
    
    is_admin: user.isAdmin || 
              user.is_admin || 
              user.IsAdmin || 
              false
  };
};

// Адаптация данных комментария
export const adaptCommentData = (comment) => {
  if (!comment) return null;
  
  return {
    ...comment,
    id: comment.id ? comment.id.toString() : 
        comment.Id ? comment.Id.toString() : 
        '',
    
    text: comment.text || 
          comment.Text || 
          comment.content || 
          comment.Content || 
          '',
    
    created_at: comment.created_at || 
               comment.CreatedAt || 
               comment.createdAt || 
               new Date().toISOString(),
    
    author: adaptUserData(comment.author || 
                         comment.Author || 
                         comment.User || 
                         null)
  };
};

// Адаптация массива видео
export const adaptVideosList = (videos) => {
  if (!Array.isArray(videos)) return [];
  
  return videos.map(video => adaptVideoData(video));
};

// Адаптация массива комментариев
export const adaptCommentsList = (comments) => {
  if (!Array.isArray(comments)) return [];
  
  return comments.map(comment => adaptCommentData(comment));
};

// Обработка ответа API с использованием ApiResponse<T>
export const handleApiResponse = (response) => {
  // Если ответ уже содержит нужные данные, возвращаем их
  if (!response) return null;
  
  // Если ответ имеет формат ApiResponse<T>
  if (typeof response === 'object' && 'success' in response) {
    if (response.success && 'data' in response) {
      return response.data;
    } else {
      throw new Error(response.message || 'Ошибка запроса');
    }
  }
  
  // В противном случае возвращаем ответ как есть
  return response;
};

// Нормализация ID
export const normalizeId = (id) => {
  if (!id) return '';
  
  if (typeof id === 'object') {
    return id.toString();
  }
  
  return id.toString();
};