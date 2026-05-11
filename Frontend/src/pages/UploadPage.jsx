import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import VideoUpload from '../components/VideoUpload';

const UploadPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Если пользователь не авторизован, перенаправляем на страницу входа
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }
  
  const handleUploadSuccess = (video) => {
    // После успешной загрузки перенаправляем на страницу видео
    navigate(`/watch/${video.id}`);
  };
  
  const handleCancel = () => {
    // При отмене возвращаемся на главную страницу
    navigate('/');
  };
  
  return (
    <div className="min-h-screen bg-black py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <VideoUpload 
            onSuccess={handleUploadSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
};

export default UploadPage;