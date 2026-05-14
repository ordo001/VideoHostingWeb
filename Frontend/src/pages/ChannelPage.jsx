import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../hooks/useUI';
import channelService from '../services/channelService';
import subscriptionService from '../services/subscriptionService';
import videoService from '../services/videoService';
import authService from '../services/authService';
import VideoCard from '../components/VideoCard';
import Button from '../components/Button';
import Input from '../components/Input';
import Loader from '../components/Loader';

const ChannelPage = () => {
  const { channelId } = useParams();
  const { user } = useAuth();
  const { showNotification } = useUI();
  
  const [channelData, setChannelData] = useState(null);
  const [channelVideos, setChannelVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({ name: '', description: '' });
  
  const isOwnChannel = user && channelId === user.id;
  
  // Загружаем данные канала
  useEffect(() => {
    const fetchChannelData = async () => {
      if (!channelId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        let data;
        if (isOwnChannel) {
          // Получаем данные своего канала
          data = await channelService.getMyChannel();
        } else {
          // Получаем данные чужого канала
          data = await channelService.getChannelById(channelId);
        }
        
        setChannelData(data);
        setSubscribersCount(data.subscribers_count || 0);
        
        // Проверяем подписку (если это не свой канал)
        if (!isOwnChannel) {
          const subscribed = await subscriptionService.isSubscribedToChannel(channelId);
          setIsSubscribed(subscribed);
        }
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
    
    fetchChannelData();
  }, [channelId, isOwnChannel, showNotification]);
  
  // Загружаем видео канала
  useEffect(() => {
    const fetchChannelVideos = async () => {
      if (!channelId) return;
      
      setVideosLoading(true);
      
      try {
        const data = await channelService.getChannelVideos(channelId, {
          page: 1,
          limit: 12
        });
        
        setChannelVideos(data.videos || []);
      } catch (err) {
        showNotification({
          type: 'error',
          title: 'Ошибка загрузки',
          message: 'Не удалось загрузить видео канала'
        });
      } finally {
        setVideosLoading(false);
      }
    };
    
    if (channelId) {
      fetchChannelVideos();
    }
  }, [channelId, showNotification]);
  
  // Обработчик подписки/отписки
  const handleSubscriptionToggle = async () => {
    if (!user) {
      showNotification({
        type: 'warning',
        title: 'Требуется авторизация',
        message: 'Войдите в аккаунт, чтобы подписаться на канал'
      });
      return;
    }
    
    try {
      let response;
      if (isSubscribed) {
        response = await subscriptionService.unsubscribeFromChannel(channelId);
      } else {
        response = await subscriptionService.subscribeToChannel(channelId);
      }
      
      setIsSubscribed(!isSubscribed);
      setSubscribersCount(response.subscribers_count || 0);
      
      showNotification({
        type: 'success',
        title: 'Подписка',
        message: isSubscribed ? 'Вы отписались от канала' : 'Вы подписались на канал'
      });
    } catch (err) {
      showNotification({
        type: 'error',
        title: 'Ошибка',
        message: err.message
      });
    }
  };
  
  // Обработчики редактирования профиля (только для своего канала)
  const handleEdit = () => {
    setIsEditing(true);
    setEditedData({
      name: channelData?.name || '',
      description: channelData?.description || ''
    });
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({
      name: channelData?.name || '',
      description: channelData?.description || ''
    });
  };
  
  const handleSave = async () => {
    if (!isOwnChannel) return;
    
    try {
      const updatedUser = await authService.updateProfile(editedData);
      
      // Обновляем данные канала после успешного сохранения
      setChannelData(prevData => ({
        ...prevData,
        name: updatedUser.name,
        description: updatedUser.description
      }));
      
      // Обновляем данные пользователя в authStore
      // Это предполагает, что в контексте auth есть функция для обновления данных
      // Может понадобиться обновить через getCurrentUser()
      
      setIsEditing(false);
      
      showNotification({
        type: 'success',
        title: 'Профиль обновлен',
        message: 'Ваши данные успешно сохранены'
      });
    } catch (err) {
      showNotification({
        type: 'error',
        title: 'Ошибка обновления',
        message: err.message
      });
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
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
          <h2 className="text-2xl font-bold text-white mb-4">Ошибка загрузки канала</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Повторить попытку
          </Button>
        </div>
      </div>
    );
  }
  
  if (!channelData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Канал не найден</h2>
          <p className="text-gray-400">Запрашиваемый канал не существует</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Баннер канала */}
      <div className="h-48 md:h-64 relative">
        {channelData.banner_url ? (
          <img 
            src={channelData.banner_url} 
            alt="Banner" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-900" />
        )}
        
        {/* Градиент для лучшей читаемости */}
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
      </div>
      
      {/* Информация о канале */}
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:-mt-16">
          {/* Аватар канала */}
          <div className="md:ml-8 mb-4 md:mb-0">
            <div className="w-32 h-32 rounded-full border-4 border-black overflow-hidden">
              {channelData.avatar_url ? (
                <img 
                  src={channelData.avatar_url} 
                  alt={channelData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <span className="text-4xl font-bold text-gray-400">
                    {channelData.name?.charAt(0) || '?'}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Детали канала */}
          <div className="flex-1 md:ml-6 mb-4 md:mb-0 text-left">
            {isEditing && isOwnChannel ? (
              <div className="space-y-4">
                <Input
                  label="Название канала"
                  name="name"
                  value={editedData.name}
                  onChange={handleInputChange}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Описание канала
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-500"
                    value={editedData.description}
                    onChange={(e) => setEditedData(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                  />
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl md:text-3xl font-bold text-left">{channelData.name}</h1>
                <p className="text-gray-400 mt-1 text-left">@{channelData.id}</p>
                
                <div className="flex text-gray-400 text-sm mt-2 text-left">
                  <span>{subscribersCount.toLocaleString()} подписчиков</span>
                  <span className="mx-2">•</span>
                  <span>{channelData.videos_count || 0} видео</span>
                </div>
                
                {channelData.description && (
                  <p className="mt-3 text-gray-300 max-w-2xl text-left">
                    {channelData.description}
                  </p>
                )}
              </>
            )}
          </div>
          
          {/* Кнопки действий */}
          <div className="md:mr-8">
            {!isOwnChannel ? (
              <Button 
                variant={isSubscribed ? "secondary" : "primary"}
                onClick={handleSubscriptionToggle}
                className="w-full md:w-auto"
              >
                {isSubscribed ? 'Подписаны' : 'Подписаться'}
              </Button>
            ) : (
              isEditing ? (
                <div className="flex space-x-2">
                  <Button variant="secondary" onClick={handleCancel}>
                    Отмена
                  </Button>
                  <Button variant="primary" onClick={handleSave}>
                    Сохранить
                  </Button>
                </div>
              ) : (
                <Button variant="primary" onClick={handleEdit}>
                  Редактировать канал
                </Button>
              )
            )}
          </div>
        </div>
        
        {/* Содержимое вкладки видео */}
        <div className="mt-8">
          {videosLoading ? (
            <div className="flex justify-center py-12">
              <Loader size="lg" />
            </div>
          ) : channelVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {channelVideos.map(video => (
                <VideoCard 
                  key={video.id} 
                  id={video.id}
                  title={video.title}
                  author={video.author}
                  duration={video.duration}
                  views={video.views}
                  createdAt={video.created_at}
                  thumbnail={video.thumbnail_url}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {isOwnChannel 
                  ? 'У вас пока нет видео. Загрузите свое первое видео!' 
                  : 'У этого канала пока нет видео'}
              </p>
              {isOwnChannel && (
                <Button variant="primary" className="mt-4">
                  Загрузить видео
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelPage;