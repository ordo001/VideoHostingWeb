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
  StatsPage,
  LogsPage
} from './pages/admin';
import videoService from './services/videoService';
import './App.css';

function App() {
  const { getCurrentUser, isAuthenticated } = useAuth();
  const { isModalOpen, redirectPath, openAuthModal, closeAuthModal } = useAuthModal();
  
  // Состояния для видео
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
        // Загружаем популярные видео с бэкенда, адаптируемся к параметрам бэкенда
        const response = await videoService.getVideos({ 
          SortBy: 'Views', 
          SortDescending: true, 
          PageSize: 6,
          Page: 1
        });
        
        // Используем адаптированные видео
        setVideos(response.videos || []);
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
                  <div className="text-center py-12">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">
                      Премиальная платформа для <span className="text-primary">профессионалов</span>
                    </h1>
                    <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                      ZTube - это цифровой архив кино, место для кураторского контента и профессиональных видеопроектов
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button variant="primary" size="lg">
                        Начать просмотр
                      </Button>
                      <Button variant="outline" size="lg">
                        Узнать больше
                      </Button>
                    </div>
                  </div>
                </section>
                
                <section className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Рекомендуемое</h2>
                    <Button variant="ghost" size="sm">
                      Смотреть все
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos && videos.length > 0 ? (
                      videos.slice(0, 3).map(video => (
                        <VideoCard
                          thumbnail={video.thumbnail_url}
                          key={video.id} 
                          {...video} 
                          onClick={() => window.open(`/watch/${video.id}`, '_self')}
                        />
                      ))
                    ) : loading ? (
                      <div className="col-span-3 flex justify-center py-12">
                        <Loader size="lg" />
                      </div>
                    ) : (
                      <div className="col-span-3 text-center py-12 text-gray-400">
                        Не удалось загрузить видео
                      </div>
                    )}
                  </div>
                </section>
                
                <section className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Популярные видео</h2>
                    <Button variant="ghost" size="sm">
                      Смотреть все
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos && videos.length > 0 ? (
                      videos.slice(3, 6).map(video => (
                        <VideoCard
                          thumbnail={video.thumbnail_url}
                          key={video.id} 
                          {...video} 
                          onClick={() => window.open(`/watch/${video.id}`, '_self')}
                        />
                      ))
                    ) : loading ? (
                      <div className="col-span-3 flex justify-center py-12">
                        <Loader size="lg" />
                      </div>
                    ) : (
                      <div className="col-span-3 text-center py-12 text-gray-400">
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
            <Route path="/admin/stats" element={<AdminLayout><StatsPage /></AdminLayout>} />
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