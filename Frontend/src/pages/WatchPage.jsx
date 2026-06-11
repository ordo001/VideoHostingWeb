import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../hooks/useUI';
import { useAuthModal } from '../hooks/useAuthModal';
import videoService from '../services/videoService';
import subscriptionService from '../services/subscriptionService';
import HLSVideoPlayer from '../components/HLSVideoPlayer';
import Button from '../components/Button';
import Loader from '../components/Loader';
const BASE_URL = 'http://localhost:9000';
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

// Функция форматирования даты комментария (относительное время)
const formatCommentDate = (dateString) => {
  if (!dateString) return 'Только что';
  
  const commentDate = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - commentDate);
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) {
    return 'Только что';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${getMinuteForm(diffMinutes)} назад`;
  } else if (diffHours < 24) {
    return `${diffHours} ${getHourForm(diffHours)} назад`;
  } else if (diffDays < 7) {
    return `${diffDays} ${getDayForm(diffDays)} назад`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${getWeekForm(weeks)} назад`;
  } else {
    return commentDate.toLocaleDateString('ru-RU');
  }
};

// Вспомогательные функции для склонения
const getMinuteForm = (minutes) => {
  if (minutes % 10 === 1 && minutes % 100 !== 11) return 'минуту';
  if (minutes % 10 >= 2 && minutes % 10 <= 4 && (minutes % 100 < 10 || minutes % 100 >= 20)) return 'минуты';
  return 'минут';
};

const getHourForm = (hours) => {
  if (hours % 10 === 1 && hours % 100 !== 11) return 'час';
  if (hours % 10 >= 2 && hours % 10 <= 4 && (hours % 100 < 10 || hours % 100 >= 20)) return 'часа';
  return 'часов';
};

const getDayForm = (days) => {
  if (days % 10 === 1 && days % 100 !== 11) return 'день';
  if (days % 10 >= 2 && days % 10 <= 4 && (days % 100 < 10 || days % 100 >= 20)) return 'дня';
  return 'дней';
};

const getWeekForm = (weeks) => {
  if (weeks % 10 === 1 && weeks % 100 !== 11) return 'неделю';
  if (weeks % 10 >= 2 && weeks % 10 <= 4 && (weeks % 100 < 10 || weeks % 100 >= 20)) return 'недели';
  return 'недель';
};

const WatchPage = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
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
  
  // Проверяем статус подписки отдельно
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!user || !videoData?.author?.id) return;
      
      try {
        const isSubs = await subscriptionService.isSubscribedToChannel(videoData.author.id);
        setIsSubscribed(isSubs);
      } catch (err) {
        console.error('Ошибка проверки статуса подписки:', err);
        // В случае ошибки оставляем текущее состояние
      }
    };
    
    checkSubscriptionStatus();
  }, [videoData?.author?.id, user]);
  
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
      // Используем subscriptionService вместо channelService
      if (isSubscribed) {
        await subscriptionService.unsubscribeFromChannel(videoData.author.id);
      } else {
        await subscriptionService.subscribeToChannel(videoData.author.id);
      }
      
      setIsSubscribed(!isSubscribed);
      
      // Обновляем счетчик подписчиков в данных видео
      setVideoData(prevData => ({
        ...prevData,
        author: {
          ...prevData.author,
          subscribers_count: isSubscribed 
            ? Math.max(0, (prevData.author.subscribers_count || 0) - 1)
            : (prevData.author.subscribers_count || 0) + 1
        }
      }));
      
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
      // Если лайк уже стоит, убираем его
      if (isLiked) {
        const response = await videoService.removeReaction(videoId);
        
        // Обновляем состояние после удаления реакции
        if (response === true || response.success === true) {
          setIsLiked(false);
          setLikes(prev => Math.max(0, prev - 1));
        } else if (response?.likes !== undefined) {
          // Если бэкенд возвращает обновленные счетчики
          setLikes(response.likes || 0);
          setDislikes(response.dislikes || 0);
          setIsLiked(response.is_liked || false);
          setIsDisliked(response.is_disliked || false);
        } else {
          // Резервный вариант: обновляем вручную
          setIsLiked(false);
          setLikes(prev => Math.max(0, prev - 1));
        }
      } 
      // Если стоит дизлайк, заменяем его лайком
      else if (isDisliked) {
        const response = await videoService.likeVideo(videoId);
        
        if (response === true || response.success === true) {
          setIsDisliked(false);
          setIsLiked(true);
          setDislikes(prev => Math.max(0, prev - 1));
          setLikes(prev => prev + 1);
        } else if (response?.likes !== undefined) {
          // Если бэкенд возвращает обновленные счетчики
          setLikes(response.likes || 0);
          setDislikes(response.dislikes || 0);
          setIsLiked(response.is_liked || false);
          setIsDisliked(response.is_disliked || false);
        } else {
          // Резервный вариант: обновляем вручную
          setIsDisliked(false);
          setIsLiked(true);
          setDislikes(prev => Math.max(0, prev - 1));
          setLikes(prev => prev + 1);
        }
      } 
      // Если нет реакции, ставим лайк
      else {
        const response = await videoService.likeVideo(videoId);
        
        if (response === true || response.success === true) {
          setIsLiked(true);
          setLikes(prev => prev + 1);
        } else if (response?.likes !== undefined) {
          // Если бэкенд возвращает обновленные счетчики
          setLikes(response.likes || 0);
          setDislikes(response.dislikes || 0);
          setIsLiked(response.is_liked || false);
          setIsDisliked(response.is_disliked || false);
        } else {
          // Резервный вариант: обновляем вручную
          setIsLiked(true);
          setLikes(prev => prev + 1);
        }
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
      // Если дизлайк уже стоит, убираем его
      if (isDisliked) {
        const response = await videoService.removeReaction(videoId);
        
        // Обновляем состояние после удаления реакции
        if (response === true || response.success === true) {
          setIsDisliked(false);
          setDislikes(prev => Math.max(0, prev - 1));
        } else if (response?.likes !== undefined) {
          // Если бэкенд возвращает обновленные счетчики
          setLikes(response.likes || 0);
          setDislikes(response.dislikes || 0);
          setIsLiked(response.is_liked || false);
          setIsDisliked(response.is_disliked || false);
        } else {
          // Резервный вариант: обновляем вручную
          setIsDisliked(false);
          setDislikes(prev => Math.max(0, prev - 1));
        }
      } 
      // Если стоит лайк, заменяем его дизлайком
      else if (isLiked) {
        const response = await videoService.dislikeVideo(videoId);
        
        if (response === true || response.success === true) {
          setIsLiked(false);
          setIsDisliked(true);
          setLikes(prev => Math.max(0, prev - 1));
          setDislikes(prev => prev + 1);
        } else if (response?.likes !== undefined) {
          // Если бэкенд возвращает обновленные счетчики
          setLikes(response.likes || 0);
          setDislikes(response.dislikes || 0);
          setIsLiked(response.is_liked || false);
          setIsDisliked(response.is_disliked || false);
        } else {
          // Резервный вариант: обновляем вручную
          setIsLiked(false);
          setIsDisliked(true);
          setLikes(prev => Math.max(0, prev - 1));
          setDislikes(prev => prev + 1);
        }
      } 
      // Если нет реакции, ставим дизлайк
      else {
        const response = await videoService.dislikeVideo(videoId);
        
        if (response === true || response.success === true) {
          setIsDisliked(true);
          setDislikes(prev => prev + 1);
        } else if (response?.likes !== undefined) {
          // Если бэкенд возвращает обновленные счетчики
          setLikes(response.likes || 0);
          setDislikes(response.dislikes || 0);
          setIsLiked(response.is_liked || false);
          setIsDisliked(response.is_disliked || false);
        } else {
          // Резервный вариант: обновляем вручную
          setIsDisliked(true);
          setDislikes(prev => prev + 1);
        }
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
      const comment = await videoService.addVideoComment(videoId, {
        text: newComment.trim()
      });
      
      setComments(prev => [comment, ...prev]);
      setCommentsCount(prev => prev + 1);
      setNewComment('');
      
      showNotification({
        type: 'success',
        title: 'Комментарий добавлен',
        message: 'Ваш комментарий успешно опубликован'
      });
    } catch (err) {
      showNotification({
        type: 'error',
        title: 'Ошибка',
        message: err.message
      });
    }
  };

  // Обработчик удаления комментария
  const handleDeleteComment = async (commentId) => {
    if (!user) {
      showNotification({
        type: 'warning',
        title: 'Требуется авторизация',
        message: 'Войдите в аккаунт, чтобы удалить комментарий'
      });
      openAuthModal();
      return;
    }
    
    try {
      await videoService.deleteComment(commentId);
      
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      setCommentsCount(prev => Math.max(0, prev - 1));
      
      showNotification({
        type: 'success',
        title: 'Комментарий удален',
        message: 'Комментарий успешно удален'
      });
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
              <HLSVideoPlayer
                videoId={videoId}
                poster={videoData.thumbnail_url}
                title={videoData.title}
              />
            )}
            
            {/* Информация о видео */}
            <div className="mt-6">
              <h1 className="text-2xl font-bold mb-4 text-left">{videoData.title}</h1>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div className="flex items-center mb-4 sm:mb-0">
                  <div 
                    className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mr-3 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate(`/channel/${videoData.author.id}`)}
                  >
                    {videoData.author.avatar ? (
                      <img 
                        src={`${BASE_URL}/${videoData.author.avatar}`}  
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
                    <div 
                      className="font-medium text-left cursor-pointer hover:text-blue-400 transition-colors"
                      onClick={() => navigate(`/channel/${videoData.author.id}`)}
                    >
                      {videoData.author.name}
                    </div>
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
                <p className="text-gray-300 text-left">{videoData.description}</p>
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
                          src={`http://localhost:9000/${user.avatar}`} 
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
                      className="w-full bg-gray-900 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none text-left"
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
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>Пока нет комментариев. Будьте первым!</p>
                    </div>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className="flex">
                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-3 flex-shrink-0">
                          {comment.author?.avatar ? (
                            <img 
                              src={`http://localhost:9000/${comment.author.avatar}`} 
                              alt={comment.author.name} 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="font-medium text-gray-300 text-xs">
                              {comment.author?.name?.charAt(0) || '?'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-left">
                            <div className="flex items-center mb-1">
                              <span 
                                className="font-medium text-sm mr-2 cursor-pointer hover:text-blue-400 transition-colors"
                                onClick={() => navigate(`/channel/${comment.author?.id}`)}
                              >
                                @{comment.author?.name || 'anonymous'}
                              </span>
                              <span className="text-xs text-gray-500">{formatCommentDate(comment.created_at)}</span>
                            </div>
                            <div className="text-gray-300 text-sm mb-2">{comment.text || comment.content}</div>
                            {user && comment.author?.id === user.id && (
                              <Button 
                                variant="ghost" 
                                size="xs" 
                                className="text-xs text-gray-500 hover:text-red-500 p-1"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                Удалить
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Сайдбар с рекомендациями */}
          {/*<div className="lg:w-1/3">
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
          </div>*/}
        </div>
      </div>
    </div>
  );
};

export default WatchPage;