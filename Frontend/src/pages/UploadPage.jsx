import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthModal } from '../hooks/useAuthModal';
import { ProtectedContent } from '../components/AuthProtection';
import VideoUpload from '../components/VideoUpload';

const UploadPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  
  // Если пользователь не авторизован, показываем модальное окно авторизации
  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal('/upload');
    }
  }, [isAuthenticated, openAuthModal]);
  
  const handleUploadSuccess = (video) => {
    // После успешной загрузки перенаправляем на страницу видео
    navigate(`/`);
  };
  
  const handleCancel = () => {
    // При отмене возвращаемся на главную страницу
    navigate('/');
  };
  
  return (
    <div className="min-h-screen bg-black py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <ProtectedContent
            authMessage="Чтобы загрузить видео, необходимо войти в аккаунт"
            showAuthButton
          >
            <VideoUpload 
              onSuccess={handleUploadSuccess}
              onCancel={handleCancel}
            />
          </ProtectedContent>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;