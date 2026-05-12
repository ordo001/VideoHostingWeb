import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../hooks/useUI';
import { useAuthModal } from '../hooks/useAuthModal';
import videoService from '../services/videoService';
import channelService from '../services/channelService';
import VideoPlayer from '../components/VideoPlayer';
import Button from '../components/Button';
import Loader from '../components/Loader';
import { normalizeId } from '../utils/adapterUtils';

// Функция форматирования даты загрузки видео
const formatUploadDate = (dateString) => {
  if (!dateString) return 'Неизвестная дата';
  
  const uploadDate = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - uploadDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      return diffMinutes === 0 ? 'Только что' : `${diffMinutes} минут назад`;
    }
    return `${diffHours} часов назад`;
  } else if (diffDays === 1) {
    return 'Вчера';
  } else if (diffDays < 7) {
    return `${diffDays} дней назад`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'неделю' : weeks < 5 ? 'недели' : 'недель'} назад`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'} назад`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'} назад`;
  }
};

const WatchPage = () => {
  const { videoId } = useParams();
  const { user } = useAuth();
  const { showNotification } = useUI();
  const { openAuthModal } = useAuthModal();
  
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [views, setViews] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // Комментарии к видео
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);
  
  // Загружаем данные видео
  useEffect(() => {
    const fetchVideoData = async () => {
      if (!videoId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Адаптер уже нормализует данные
        const data = await videoService.getVideoById(videoId);
        setVideoData(data);
        setLikes(data.likes || 0);
        setDislikes(data.dislikes || 0);
        setViews(data.views || 0);
        setIsSubscribed(data.is_subscribed || false);
        
        // Проверяем, что видео обрабатывается или готово к просмотру
        if (data.processing_status === 'processing') {
          // Если видео обрабатывается, проверяем периодически
          const checkStatus = setInterval(async () => {
            try {
              const statusData = await videoService.getVideoProcessingStatus(videoId);
              if (statusData.status === 'completed') {
                clearInterval(checkStatus);
                // Обновляем данные видео
                const updatedData = await videoService.getVideoById(videoId);
                setVideoData(updatedData);
              } else if (statusData.status === 'failed') {
                clearInterval(checkStatus);
                setError('Обработка видео не удалась');
              }
            } catch (err) {
              console.error('Ошибка при проверке статуса:', err);
              clearInterval(checkStatus);
            }
          }, 5000); // Проверяем каждые 5 секунд
          
          return () => clearInterval(checkStatus);
        }
        
        // Увеличиваем счетчик просмотров
        await videoService.viewVideo(videoId);
      } catch (err) {
        setError(err.message);
        showNotification({
          type: 'error',
          title: 'Ошибка загрузки',
          message: err.message
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideoData();
  }, [videoId, showNotification]);
  
  // Обработчик подписки на канал
  const handleSubscribe = async () => {
    if (!user) {
      showNotification({
        type: 'warning',
        title: 'Требуется авторизация',
        message: 'Войдите в аккаунт, чтобы подписаться на канал'
      });
      openAuthModal();
      return;
    }
    
    if (!videoData?.author?.id) {
      showNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось получить информацию о канале'
      });
      return;
    }
    
    try {
      let response;
      
      if (isSubscribed) {
        response = await channelService.unsubscribeChannel(videoData.author.id);
      } else {
        response = await channelService.subscribeChannel(videoData.author.id);
      }
      
      setIsSubscribed(!isSubscribed);
      showNotification({
        type: 'success',
        title: !isSubscribed ? 'Подписка оформлена' : 'Подписка отменена',
        message: !isSubscribed 
          ? `Вы подписались на канал ${videoData.author.name}` 
          : `Вы отписались от канала ${videoData.author.name}`
      });
    } catch (err) {
      showNotification({
        type: 'error',
        title: 'Ошибка',
        message: err.message
      });
    }
  };
  
  // Загружаем комментарии
  useEffect(() => {
    const fetchComments = async () => {
      if (!videoId) return;
      
      setCommentsLoading(true);
      
      try {
        // Используем адаптированный сервис комментариев
        const data = await videoService.getVideoComments(videoId);
        setComments(data.comments || []);
        setCommentsCount(data.count || 0);
      } catch (err) {
        showNotification({
          type: 'error',
          title: 'Ошибка загрузки',
          message: 'Не удалось загрузить комментарии'
        });
      } finally {
        setCommentsLoading(false);
      }
    };
    
    if (videoId) {
      fetchComments();
    }
  }, [videoId, showNotification]);
  
  // Обработчики лайков/дизлайков
  const handleLike = async () => {
    if (!user) {
      showNotification({
        type: 'warning',
        title: 'Требуется авторизация',
        message: 'Войдите в аккаунт, чтобы поставить лайк'
      });
      openAuthModal();
      return;
    }
    
    try {
      const response = await videoService.likeVideo(videoId);
      
      // Адаптация к формату ответа бэкенда
      // Если бэкенд возвращает просто true, обновляем счетчики вручную
      if (response === true || response.success === true) {
        const wasLiked = isLiked;
        const wasDisliked = isDisliked;
        
        // Если лайк уже стоит, убираем его
        if (wasLiked) {
          setIsLiked(false);
          setLikes(prev => Math.max(0, prev - 1));
        } 
        // Если стоит дизлайк, заменяем его лайком
        else if (wasDisliked) {
          setIsDisliked(false);
          setIsLiked(true);
          setDislikes(prev => Math.max(0, prev - 1));
          setLikes(prev => prev + 1);
        } 
        // Если нет реакции, ставим лайк
        else {
          setIsLiked(true);
          setLikes(prev => prev + 1);
        }
      } else {
        // Если бэкенд возвращает обновленные счетчики
        setLikes(response.likes || 0);
        setDislikes(response.dislikes || 0);
        setIsLiked(response.is_liked || false);
        setIsDisliked(response.is_disliked || false);
      }
    } catch (err) {
      showNotification({
        type: 'error',
        title: 'Ошибка',
        message: err.message
      });
    }
  };
  
  const handleDislike = async () => {
    if (!user) {
      showNotification({
        type: 'warning',
        title: 'Требуется авторизация',
        message: 'Войдите в аккаунт, чтобы поставить дизлайк'
      });
      openAuthModal();
      return;
    }
    
    try {
      const response = await videoService.dislikeVideo(videoId);
      
      // Адаптация к формату ответа бэкенда
      // Если бэкенд возвращает просто true, обновляем счетчики вручную
      if (response === true || response.success === true) {
        const wasLiked = isLiked;
        const wasDisliked = isDisliked;
        
        // Если дизлайк уже стоит, убираем его
        if (wasDisliked) {
          setIsDisliked(false);
          setDislikes(prev => Math.max(0, prev - 1));
        } 
        // Если стоит лайк, заменяем его дизлайком
        else if (wasLiked) {
          setIsLiked(false);
          setIsDisliked(true);
          setLikes(prev => Math.max(0, prev - 1));
          setDislikes(prev => prev + 1);
        } 
        // Если нет реакции, ставим дизлайк
        else {
          setIsDisliked(true);
          setDislikes(prev => prev + 1);
        }
      } else {
        // Если бэкенд возвращает обновленные счетчики
        setLikes(response.likes || 0);
        setDislikes(response.dislikes || 0);
        setIsLiked(response.is_liked || false);
        setIsDisliked(response.is_disliked || false);
      }
    } catch (err) {
      showNotification({
        type: 'error',
        title: 'Ошибка',
        message: err.message
      });
    }
  };
  
  // Обработчик добавления комментария
  const handleAddComment = async () => {
    if (!user) {
      showNotification({
        type: 'warning',
        title: 'Требуется авторизация',
        message: 'Войдите в аккаунт, чтобы оставить комментарий'
      });
      openAuthModal();
      return;
    }
    
    if (!newComment.trim()) return;
    
    try {
      // Временно комментарии не работают, т.к. эндпоинт не реализован в бэкенде
      showNotification({
        type: 'info',
        title: 'Функция в разработке',
        message: 'Комментарии будут доступны в ближайшее время'
      });
      
      // Код для использования, когда эндпоинт будет реализован:
      /*
      const comment = await videoService.addVideoComment(videoId, {
        text: newComment
      });
      
      setComments(prev => [comment, ...prev]);
      setCommentsCount(prev => prev + 1);
      setNewComment('');
      */
    } catch (err) {
      showNotification({
        type: 'error',
        title: 'Ошибка',
        message: err.message
      });
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ошибка загрузки видео</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Повторить попытку
          </Button>
        </div>
      </div>
    );
  }
  
  if (!videoData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Видео не найдено</h2>
          <p className="text-gray-400">Запрашиваемое видео не существует</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Основная область просмотра */}
          <div className="lg:w-2/3">
            {/* Видеоплеер */}
            {videoData.processing_status === 'processing' ? (
              <div className="relative aspect-video bg-gray-900 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                    <div className="w-10 h-10 border-4 border-gray-700 border-t-primary rounded-full animate-spin"></div>
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">Видео обрабатывается</h3>
                  <p className="text-gray-400">
                    Пожалуйста, подождите. Обычно это занимает несколько минут.
                  </p>
                </div>
              </div>
            ) : videoData.processing_status === 'failed' ? (
              <div className="relative aspect-video bg-gray-900 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-red-900 bg-opacity-20 flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">Ошибка обработки видео</h3>
                  <p className="text-gray-400">
                    Не удалось обработать это видео. Пожалуйста, попробуйте позже.
                  </p>
                </div>
              </div>
            ) : (
              <VideoPlayer
                videoUrl={videoData.hls_url}
                poster={videoData.thumbnail_url}
                title={videoData.title}
              />
            )}
            
            {/* Информация о видео */}
            <div className="mt-6">
              <h1 className="text-2xl font-bold mb-4">{videoData.title}</h1>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div className="flex items-center mb-4 sm:mb-0">
                  <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mr-3">
                    {videoData.author.avatar ? (
                      <img 
                        src={videoData.author.avatar} 
                        alt={videoData.author.name} 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="font-medium text-gray-300">
                        {videoData.author.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-left">{videoData.author.name}</div>
                    <div className="text-sm text-gray-400 text-left">
                      {videoData.author.subscribers_count?.toLocaleString() || 0} подписчиков
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    variant={isSubscribed ? "secondary" : "primary"}
                    onClick={handleSubscribe}
                  >
                    {isSubscribed ? 'Отписаться' : 'Подписаться'}
                  </Button>
                  
                  <Button 
                    variant={isLiked ? "primary" : "secondary"}
                    onClick={handleLike}
                    className="flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    {likes}
                  </Button>
                  
                  <Button 
                    variant={isDisliked ? "primary" : "secondary"}
                    onClick={handleDislike}
                    className="flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {dislikes}
                  </Button>
                  
                  <Button variant="secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Поделиться
                  </Button>
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-2xl p-4">
                <div className="flex text-sm text-gray-400 mb-2">
                  <span>{views.toLocaleString()} просмотров</span>
                  <span className="mx-2">•</span>
                  <span>{formatUploadDate(videoData.created_at)}</span>
                </div>
                <p className="text-gray-300">{videoData.description}</p>
              </div>
            </div>
            
            {/* Комментарии */}
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-6">
                Комментарии {!commentsLoading ? `(${commentsCount})` : ''}
              </h2>
              
              <div className="mb-6">
                <div className="flex">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-3 flex-shrink-0">
                    {user ? (
                      user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="font-medium text-gray-300">
                          {user.name.charAt(0)}
                        </span>
                      )
                    ) : (
                      <span className="font-medium text-gray-300">?</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full bg-gray-900 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      placeholder={user ? "Добавить комментарий..." : "Войдите, чтобы оставить комментарий"}
                      rows={3}
                      disabled={!user}
                    />
                    <div className="flex justify-end mt-2">
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={handleAddComment}
                        disabled={!user || !newComment.trim()}
                      >
                        Опубликовать
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {commentsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader size="md" />
                </div>
              ) : (
                <div className="space-y-6">
                  {comments.map(comment => (
                    <div key={comment.id} className="flex">
                      <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-3 flex-shrink-0">
                        {comment.author.avatar ? (
                          <img 
                            src={comment.author.avatar} 
                            alt={comment.author.name} 
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="font-medium text-gray-300">
                            {comment.author.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-900 rounded-2xl p-4">
                          <div className="font-medium">{comment.author.name}</div>
                          <p className="text-gray-300 mt-2">{comment.text}</p>
                          <div className="flex items-center mt-3 text-sm text-gray-500">
                            <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                            <Button variant="ghost" size="sm" className="ml-4 text-gray-500 hover:text-white">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                              </svg>
                              {comment.likes || 0}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Сайдбар с рекомендациями */}
          <div className="lg:w-1/3">
            <h3 className="text-lg font-bold mb-4">Рекомендуемые видео</h3>
            
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(id => (
                <div key={id} className="flex bg-gray-900 rounded-2xl overflow-hidden cursor-pointer hover:bg-gray-800 transition-colors duration-200">
                  <div className="w-40 aspect-video bg-gray-800 flex-shrink-0" />
                  <div className="p-3 flex-1">
                    <h4 className="font-medium text-white line-clamp-2 text-sm mb-1">
                      Как снимать качественное видео на телефон
                    </h4>
                    <p className="text-gray-400 text-xs mb-1">Марина Соколова</p>
                    <div className="flex text-gray-500 text-xs">
                      <span>12K просмотров</span>
                      <span className="mx-1">•</span>
                      <span>2 недели назад</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchPage;