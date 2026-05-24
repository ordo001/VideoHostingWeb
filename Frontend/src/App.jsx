import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useAuthModal } from './hooks/useAuthModal';
import Header from './components/Header';
import Button from './components/Button';
import VideoCard from './components/VideoCard';
import Loader from './components/Loader';
import Notification from './components/Notification';
import AuthModal from './components/AuthModal';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import WatchPage from './pages/WatchPage';
import UploadPage from './pages/UploadPage';
import ChannelPage from './pages/ChannelPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import NotFoundPage from './pages/NotFoundPage';
import {
  AdminLayout,
  DashboardPage,
  UsersPage,
  VideosPage,
  LogsPage
} from './pages/admin';
import videoService from './services/videoService';
import './App.css';

function App() {
  const { getCurrentUser, isAuthenticated } = useAuth();
  const { isModalOpen, redirectPath, openAuthModal, closeAuthModal } = useAuthModal();
  
  // Состояния для видео
  const [recommendedVideos, setRecommendedVideos] = useState([]);
  const [popularVideos, setPopularVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllRecommended, setShowAllRecommended] = useState(false);
  const [showAllPopular, setShowAllPopular] = useState(false);
  
  // При монтировании приложения проверяем, есть ли токен и получаем данные пользователя
  useEffect(() => {
    if (localStorage.getItem('token')) {
      getCurrentUser();
    }
  }, [getCurrentUser]);
  
  // Загружаем видео при монтировании компонента
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        
        // Загружаем рекомендуемые видео
        const recommendedResponse = await videoService.getVideos({ 
          PageSize: 20,
          Page: 1
        });
        
        // Загружаем популярные видео за последние 7 дней
        const popularResponse = await videoService.getPopularVideos({ 
          PageSize: 20,
          Page: 1
        });
        
        // Используем адаптированные видео
        setRecommendedVideos(recommendedResponse.videos || []);
        setPopularVideos(popularResponse.videos || []);
        setError(null);
      } catch (err) {
        console.error('Ошибка при загрузке видео:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideos();
  }, []);

  return (
    <Router>
      <div className="App min-h-screen bg-black text-white">
        <Header />
        <Notification />
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={
              <div>
                
                <section className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Рекомендуемое</h2>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowAllRecommended(!showAllRecommended)}
                    >
                      {showAllRecommended ? "Скрыть" : "Смотреть все"}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {recommendedVideos && recommendedVideos.length > 0 ? (
                      (showAllRecommended ? recommendedVideos : recommendedVideos.slice(0, 10)).map(video => (
                        <VideoCard
                          thumbnail={video.thumbnail_url}
                          key={video.id} 
                          {...video} 
                          onClick={() => window.open(`/watch/${video.id}`, '_self')}
                        />
                      ))
                    ) : loading ? (
                      <div className="col-span-5 flex justify-center py-12">
                        <Loader size="lg" />
                      </div>
                    ) : (
                      <div className="col-span-5 text-center py-12 text-gray-400">
                        Не удалось загрузить видео
                      </div>
                    )}
                  </div>
                </section>
                
                <section className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Популярные видео</h2>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowAllPopular(!showAllPopular)}
                    >
                      {showAllPopular ? "Скрыть" : "Смотреть все"}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {popularVideos && popularVideos.length > 0 ? (
                      (showAllPopular ? popularVideos : popularVideos.slice(0, 10)).map(video => (
                        <VideoCard
                          thumbnail={video.thumbnail_url}
                          key={video.id} 
                          {...video} 
                          onClick={() => window.open(`/watch/${video.id}`, '_self')}
                        />
                      ))
                    ) : loading ? (
                      <div className="col-span-5 flex justify-center py-12">
                        <Loader size="lg" />
                      </div>
                    ) : (
                      <div className="col-span-5 text-center py-12 text-gray-400">
                        Не удалось загрузить видео
                      </div>
                    )}
                  </div>
                </section>
              </div>
            } />
            
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/channel/:channelId" element={<ChannelPage />} />
            <Route path="/watch/:videoId" element={<WatchPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            
            {/* Страница 404 */}
            <Route path="*" element={<NotFoundPage />} />
            
            {/* Административная панель */}
            <Route path="/admin" element={<AdminLayout><DashboardPage /></AdminLayout>} />
            <Route path="/admin/users" element={<AdminLayout><UsersPage /></AdminLayout>} />
            <Route path="/admin/videos" element={<AdminLayout><VideosPage /></AdminLayout>} />
            <Route path="/admin/logs" element={<AdminLayout><LogsPage /></AdminLayout>} />
            
            <Route path="/loading" element={
              <div className="flex items-center justify-center h-64">
                <Loader size="lg" />
              </div>
            } />
          </Routes>
        </main>
        
        <footer className="bg-gray-900 border-t border-gray-800 py-8">
          <div className="container mx-auto px-4">
            <div className="text-center text-gray-400">
              <p>&copy; 2026 ZTube. Все права защищены.</p>
            </div>
          </div>
        </footer>
      </div>
      
      {/* Модальное окно авторизации */}
      <AuthModal 
        isOpen={isModalOpen} 
        onClose={closeAuthModal} 
        redirectTo={redirectPath} 
      />
    </Router>
  );
}

export default App;