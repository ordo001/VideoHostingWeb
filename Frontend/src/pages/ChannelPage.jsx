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
import ImageUpload from '../components/ImageUpload';

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
  const [editedData, setEditedData] = useState({ name: '', description: '', banner_url: null, avatar_url: null });
  
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
        setEditedData({
          name: data.name || '',
          description: data.description || '',
          banner_url: data.banner_url || null,
          avatar_url: data.avatar_url || null
        });
        
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
      description: channelData?.description || '',
      banner_url: channelData?.banner_url || null,
      avatar_url: channelData?.avatar_url || null
    });
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({
      name: channelData?.name || '',
      description: channelData?.description || '',
      banner_url: channelData?.banner_url || null,
      avatar_url: channelData?.avatar_url || null
    });
  };
  
  const handleSave = async () => {
    if (!isOwnChannel) return;
    
    try {
      const updatedUser = await authService.updateProfile(editedData, channelId);
      
      // Обновляем данные канала после успешного сохранения
      setChannelData(prevData => ({
        ...prevData,
        name: updatedUser.name,
        description: updatedUser.description,
        avatar_url: editedData.avatar_url || prevData.avatar_url,
        banner_url: editedData.banner_url || prevData.banner_url
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
  
  const handleAvatarChange = (avatarUrl) => {
    setEditedData(prev => ({
      ...prev,
      avatar_url: avatarUrl
    }));
  };
  
  const handleBannerChange = (bannerUrl) => {
    setEditedData(prev => ({
      ...prev,
      banner_url: bannerUrl
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
      <div className="h-48 md:h-64 relative z-0">
        {isEditing && isOwnChannel ? (
          <ImageUpload
            value={editedData.banner_url}
            onChange={handleBannerChange}
            uploadType="banner"
            aspectRatio="banner"
            className="w-full h-full"
            showPreview={true}
          />
        ) : channelData.banner_url ? (
          <img 
            src={channelData.banner_url} 
            alt="Banner" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-900" />
        )}
      </div>
      
      {/* Информация о канале */}
      <div className="container mx-auto px-4">
        <div className="bg-gray-900 rounded-2xl p-4 md:p-6 -mt-12 relative z-20">
          <div className="flex flex-col md:flex-row items-start md:items-center pb-4 md:pb-6">
            {/* Аватар канала */}
            <div className="flex-shrink-0 mb-3 md:mb-0 md:mr-6">
              {isEditing && isOwnChannel ? (
                <ImageUpload
                  value={editedData.avatar_url}
                  onChange={handleAvatarChange}
                  uploadType="avatar"
                  aspectRatio="square"
                  className="w-20 h-20 md:w-24 md:h-24 border-2 border-gray-800"
                />
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-gray-800 overflow-hidden bg-gray-800">
                  {channelData.avatar_url ? (
                    <img 
                      src={channelData.avatar_url} 
                      alt={channelData.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                      <span className="text-3xl font-bold text-gray-400">
                        {channelData.name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Детали канала */}
            <div className="flex-1 text-left">
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
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-500"
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
                  <h1 className="text-xl md:text-2xl font-bold">{channelData.name}</h1>
                  
                  <div className="flex text-gray-400 text-sm mt-1">
                    <span>{subscribersCount.toLocaleString()} подписчиков</span>
                    <span className="mx-2">•</span>
                    <span>{channelVideos.length || channelData.videos_count || 0} видео</span>
                  </div>
                  
                  {channelData.description && (
                    <p className="mt-2 text-gray-300 text-sm md:text-base max-w-2xl">
                      {channelData.description}
                    </p>
                  )}
                </>
              )}
            </div>
            
            {/* Кнопки действий */}
            <div className="mt-4 md:mt-0 md:ml-6">
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
        <div className="mt-6">
          {videosLoading ? (
            <div className="flex justify-center py-12">
              <Loader size="lg" />
            </div>
          ) : channelVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {channelVideos.map(video => (
                /*<VideoCard 
                  key={video.id} 
                  id={video.id}
                  title={video.title}
                  author={video.author}
                  duration={video.duration}
                  views={video.views}
                  createdAt={video.created_at}
                  thumbnail={video.thumbnail_url}
                />*/
                  <VideoCard
                      thumbnail={video.thumbnail_url}
                      key={video.id}
                      {...video}
                      onClick={() => window.open(`/watch/${video.id}`, '_self')}
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
    </div>
  );
};

export default ChannelPage;