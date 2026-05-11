import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Header from './components/Header';
import Button from './components/Button';
import VideoCard from './components/VideoCard';
import Loader from './components/Loader';
import Notification from './components/Notification';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import WatchPage from './pages/WatchPage';
import UploadPage from './pages/UploadPage';
import ChannelPage from './pages/ChannelPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import {
  AdminLayout,
  DashboardPage,
  UsersPage,
  VideosPage,
  StatsPage,
  LogsPage
} from './pages/admin';
import './App.css';

function App() {
  const { getCurrentUser, isAuthenticated } = useAuth();
  
  // При монтировании приложения проверяем, есть ли токен и получаем данные пользователя
  useEffect(() => {
    if (localStorage.getItem('token')) {
      getCurrentUser();
    }
  }, [getCurrentUser]);
  
  // Пример данных для видео
  const sampleVideos = [
    {
      id: '1',
      title: 'Введение в цифровое кино',
      author: { name: 'Алексей Петров', avatar: null },
      duration: 320,
      views: 15000,
      createdAt: '2026-05-01T10:00:00Z',
      thumbnail: null
    },
    {
      id: '2',
      title: 'Технологии HDR в современном кино',
      author: { name: 'Марина Соколова', avatar: null },
      duration: 540,
      views: 8900,
      createdAt: '2026-05-05T14:30:00Z',
      thumbnail: null
    },
    {
      id: '3',
      title: 'Работа с цветокоррекцией',
      author: { name: 'Дмитрий Козлов', avatar: null },
      duration: 720,
      views: 12500,
      createdAt: '2026-05-08T09:15:00Z',
      thumbnail: null
    },
    {
      id: '4',
      title: 'Съемка в условиях низкой освещенности',
      author: { name: 'Елена Волкова', avatar: null },
      duration: 480,
      views: 9800,
      createdAt: '2026-05-09T16:45:00Z',
      thumbnail: null
    },
    {
      id: '5',
      title: 'Монтаж документальных фильмов',
      author: { name: 'Андрей Смирнов', avatar: null },
      duration: 620,
      views: 11300,
      createdAt: '2026-05-10T11:20:00Z',
      thumbnail: null
    },
    {
      id: '6',
      title: 'Работа со звуком в полевых условиях',
      author: { name: 'Ольга Морозова', avatar: null },
      duration: 390,
      views: 7600,
      createdAt: '2026-05-10T14:10:00Z',
      thumbnail: null
    }
  ];

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
                    {sampleVideos.slice(0, 3).map(video => (
                      <VideoCard key={video.id} {...video} />
                    ))}
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
                    {sampleVideos.slice(3, 6).map(video => (
                      <VideoCard key={video.id} {...video} />
                    ))}
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
    </Router>
  );
}

export default App;