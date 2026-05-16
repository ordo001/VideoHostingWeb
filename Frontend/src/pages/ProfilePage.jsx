import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../hooks/useUI';
import Button from '../components/Button';
import Input from '../components/Input';
import Loader from '../components/Loader';
import ImageUpload from '../components/ImageUpload';
import authService from '../services/authService';

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showNotification } = useUI();
  const isOwnProfile = !userId || (user && user.id === userId);
  
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({ name: '', description: '', avatar: null });
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Загружаем данные профиля
  useEffect(() => {
    const fetchProfileData = async () => {
      setProfileLoading(true);
      try {
        let data;
        if (isOwnProfile && user) {
          // Если это профиль текущего пользователя, используем данные из store
          data = user;
        } else if (userId) {
          // Если это чужой профиль, получаем данные с сервера
          // В реальном приложении здесь будет вызов API для получения данных пользователя по ID
          data = {
            id: userId,
            name: 'Имя пользователя',
            email: 'user@example.com',
            description: 'Описание пользователя',
            avatar: null,
            banner: null
          };
        } else {
          data = user;
        }
        
        setProfileData(data);
        setEditedData({
          name: data.name || '',
          description: data.description || '',
          avatar: data.avatar || null
        });
      } catch (error) {
        showNotification({
          type: 'error',
          title: 'Ошибка загрузки',
          message: 'Не удалось загрузить данные профиля'
        });
      } finally {
        setProfileLoading(false);
      }
    };
    
    if (isAuthenticated || userId) {
      fetchProfileData();
    }
  }, [userId, user, isAuthenticated, isOwnProfile, showNotification]);
  
  // Пример данных для видео пользователя
  const userVideos = [
    {
      id: '1',
      title: 'За кулисами съемок документального фильма',
      duration: 420,
      views: 12500,
      createdAt: '2026-05-01T10:00:00Z',
      thumbnail: null
    },
    {
      id: '2',
      title: 'Техника стабилизации камеры в полевых условиях',
      duration: 310,
      views: 8900,
      createdAt: '2026-04-25T14:30:00Z',
      thumbnail: null
    },
    {
      id: '3',
      title: 'Цветокоррекция в DaVinci Resolve',
      duration: 680,
      views: 15200,
      createdAt: '2026-04-20T09:15:00Z',
      thumbnail: null
    }
  ];
  
  const handleEdit = () => {
    setIsEditing(true);
    setEditedData({
      name: profileData?.name || '',
      description: profileData?.description || '',
      avatar: profileData?.avatar || null
    });
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({
      name: profileData?.name || '',
      description: profileData?.description || '',
      avatar: profileData?.avatar || null
    });
  };
  
  const handleSave = async () => {
    setLoading(true);
    try {
      const channelId = user?.id || userId;
      const updatedUser = await authService.updateProfile(editedData, channelId);
      setProfileData(prev => ({
        ...prev,
        ...updatedUser
      }));
      setIsEditing(false);
      
      showNotification({
        type: 'success',
        title: 'Профиль обновлен',
        message: 'Ваши данные успешно сохранены'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Ошибка обновления',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleAvatarChange = (avatarUrl) => {
    setEditedData(prev => ({
      ...prev,
      avatar: avatarUrl
    }));
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }
  
  if (!profileData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Профиль не найден</h2>
          <p className="text-gray-400">Запрашиваемый профиль не существует</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Banner */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-gray-800 to-gray-900 relative">
        {profileData.banner ? (
          <img 
            src={profileData.banner} 
            alt="Banner" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-900" />
        )}
        
        {/* Avatar */}
        <div className="absolute -bottom-16 left-8">
          {isEditing && isOwnProfile ? (
            <ImageUpload
              value={editedData.avatar}
              onChange={handleAvatarChange}
              uploadType="avatar"
              aspectRatio="square"
              className="border-4 border-black"
            />
          ) : (
            <div className="w-32 h-32 rounded-full border-4 border-black bg-gray-800 flex items-center justify-center overflow-hidden">
              {profileData.avatar ? (
                <img 
                  src={profileData.avatar} 
                  alt={profileData.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-gray-400">
                  {profileData.name.charAt(0)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="container mx-auto px-4 pt-20 pb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between">
          <div className="md:ml-40">
            {isEditing ? (
              <div className="space-y-4">
                <Input
                  label="Имя"
                  name="name"
                  value={editedData.name}
                  onChange={handleInputChange}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Описание
                  </label>
                  <textarea
                    name="description"
                    rows={4}
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
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{profileData.name}</h1>
                <p className="text-gray-400 mt-2">{profileData.email}</p>
                {profileData.description && (
                  <p className="mt-4 text-gray-300 max-w-2xl">{profileData.description}</p>
                )}
              </div>
            )}
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="flex flex-col sm:flex-row gap-2">
              {!isOwnProfile && (
                <Button 
                  variant="primary"
                  onClick={() => navigate(`/channel/${userId}`)}
                >
                  Перейти к каналу
                </Button>
              )}
              {isOwnProfile && (
                isEditing ? (
                  <div className="flex space-x-2">
                    <Button variant="secondary" onClick={handleCancel} disabled={loading}>
                      Отмена
                    </Button>
                    <Button variant="primary" onClick={handleSave} disabled={loading}>
                      {loading ? (
                        <div className="flex items-center">
                          <Loader size="sm" className="mr-2" />
                          Сохранение...
                        </div>
                      ) : (
                        'Сохранить'
                      )}
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button variant="secondary" onClick={() => navigate(`/channel/${user.id}`)}>
                      Мой канал
                    </Button>
                    <Button variant="primary" onClick={handleEdit}>
                      Редактировать профиль
                    </Button>
                  </>
                )
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6">Видео</h2>
          
          {userVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {userVideos.map(video => (
                <div key={video.id} className="bg-gray-900 rounded-2xl overflow-hidden">
                  <div className="aspect-video bg-gray-800 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                      </svg>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-white line-clamp-2">{video.title}</h3>
                    <div className="flex text-gray-500 text-sm mt-2">
                      <span>{video.views.toLocaleString()} просмотров</span>
                      <span className="mx-2">•</span>
                      <span>2 дня назад</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">У этого пользователя пока нет видео</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;