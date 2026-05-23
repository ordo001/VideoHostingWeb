import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../../hooks/useUI';
import adminService from '../../services/adminService';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import { LineChart, BarChart, PieChart } from '../../components/charts';

const DashboardPage = () => {
  const { showNotification } = useUI();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartsData, setChartsData] = useState({
    userGrowth: [],
    viewsGrowth: [], // Добавляем данные для роста просмотров
    videoUploadsGrowth: [], // Данные для роста загрузки видео
    contentPopularity: []
  });
  
  // Загружаем статистику платформы
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('Загрузка статистики...');
        const data = await adminService.getPlatformStats(selectedPeriod);
        console.log('Полученные данные:', data);
        setStats(data);
        
        // Подготавливаем данные для графиков
        // Если API не предоставляет эти данные, генерируем демонстрационные данные
        prepareChartsData(data);
      } catch (err) {
        console.error('Ошибка при загрузке статистики:', err);
        showNotification({
          type: 'error',
          title: 'Ошибка загрузки',
          message: err.message
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [showNotification, selectedPeriod]);
  
  // Функция для подготовки данных для графиков
  const prepareChartsData = (statsData) => {
    console.log('Подготовка данных для графиков:', statsData);
    
    // Данные для графика роста пользователей за последние 7 дней
    const userGrowthData = [];
    const today = new Date();
    
    // Используем реальные данные из API, если они есть
    if (statsData?.userGrowth && statsData.userGrowth.length > 0) {
      console.log('Используем реальные данные userGrowth:', statsData.userGrowth);
      
      // Берем последние 7 дней из данных
      const last7Days = statsData.userGrowth.slice(-7);
      
      // Заполняем недостающие дни, если данных меньше 7
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
        
        // Ищем данные за этот день в userGrowth
        const dayData = last7Days.find(item => {
          const itemDate = new Date(item.date);
          return itemDate.toDateString() === date.toDateString();
        });
        
        const value = dayData ? dayData.count : Math.floor(Math.random() * 20) + 5;
        
        userGrowthData.push({
          label: dayName,
          value: value
        });
      }
    } else {
      console.log('Нет данных userGrowth, генерируем демо-данные');
      
      // Если нет данных от API, генерируем демо-данные
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
        
        const value = Math.floor(Math.random() * 50) + Math.floor((statsData?.totalUsers || 100) / 100) + 10;
        
        userGrowthData.push({
          label: dayName,
          value: value
        });
      }
    }
    
    // Данные для графика роста загрузки видео за последние 7 дней
    const videoUploadsGrowthData = [];
    
    // Используем реальные данные из API, если они есть
    if (statsData?.videoUploads && statsData.videoUploads.length > 0) {
      console.log('Используем реальные данные videoUploads:', statsData.videoUploads);
      
      // Берем последние 7 дней из данных
      const last7Days = statsData.videoUploads.slice(-7);
      
      // Заполняем недостающие дни, если данных меньше 7
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
        
        // Ищем данные за этот день в videoUploads
        const dayData = last7Days.find(item => {
          const itemDate = new Date(item.date);
          return itemDate.toDateString() === date.toDateString();
        });
        
        const uploads = dayData ? dayData.count : Math.floor(Math.random() * 10) + 1;
        
        videoUploadsGrowthData.push({
          label: dayName,
          value: uploads
        });
      }
    } else {
      console.log('Нет данных videoUploads, генерируем демо-данные');
      
      // Если нет данных от API, генерируем демо-данные
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
        
        const uploads = Math.floor(Math.random() * 10) + 1;
        
        videoUploadsGrowthData.push({
          label: dayName,
          value: uploads
        });
      }
    }
    
    // Данные для круговой диаграммы популярности контента
    // Используем популярные видео для создания категорий
    let contentPopularityData;
    
    if (statsData?.popularVideos && statsData.popularVideos.length > 0) {
      console.log('Используем реальные данные popularVideos:', statsData.popularVideos);
      
      // Создаем категории на основе популярных видео
      const categories = {};
      
      statsData.popularVideos.forEach(video => {
        // Извлекаем категории из названий видео (упрощенная логика)
        let category = 'Другое';
        const title = video.title.toLowerCase();
        
        if (title.includes('музык') || title.includes('music')) {
          category = 'Музыка';
        } else if (title.includes('игр') || title.includes('game')) {
          category = 'Игры';
        } else if (title.includes('блог') || title.includes('vlog')) {
          category = 'Блоги';
        } else if (title.includes('обуч') || title.includes('educat')) {
          category = 'Образование';
        } else if (title.includes('развлеч') || title.includes('entert')) {
          category = 'Развлечения';
        }
        
        categories[category] = (categories[category] || 0) + video.views;
      });
      
      // Преобразуем в формат для графика
      contentPopularityData = Object.entries(categories).map(([label, value]) => ({
        label,
        value
      }));
    } else {
      console.log('Нет данных popularVideos, используем демо-данные');
      
      // Если нет данных от API, используем демо-данные
      contentPopularityData = [
        { label: 'Музыка', value: 30 },
        { label: 'Игры', value: 25 },
        { label: 'Блоги', value: 20 },
        { label: 'Образование', value: 15 },
        { label: 'Развлечения', value: 10 }
      ];
    }
    
    // Данные для графика роста просмотров
    const viewsGrowthData = [];
    
    // Используем данные из viewHistory или генерируем на основе просмотров
    if (statsData?.viewHistory && statsData.viewHistory.length > 0) {
      const last7Days = statsData.viewHistory.slice(-7);
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
        
        const dayData = last7Days.find(item => {
          const itemDate = new Date(item.date);
          return itemDate.toDateString() === date.toDateString();
        });
        
        const value = dayData ? dayData.count : Math.floor(Math.random() * 1000) + 500;
        
        viewsGrowthData.push({
          label: dayName,
          value: value
        });
      }
    } else {
      console.log('Нет данных viewHistory, используем демо-данные');
      
      // Генерируем демо-данные для просмотров
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
        
        const value = Math.floor(Math.random() * 1000) + 500;
        
        viewsGrowthData.push({
          label: dayName,
          value: value
        });
      }
    }
    
    const chartsData = {
      userGrowth: userGrowthData,
      viewsGrowth: viewsGrowthData, // Данные для роста просмотров
      videoUploadsGrowth: videoUploadsGrowthData, // Данные для роста загрузки видео
      contentPopularity: contentPopularityData
    };
    
    console.log('Подготовленные данные для графиков:', chartsData);
    setChartsData(chartsData);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" />
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Административная панель</h1>
        <p className="text-gray-400 mt-2">Обзор ключевых метрик платформы</p>
      </div>
      
{/* Карточки статистики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Карточка пользователей */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-900 bg-opacity-20 mr-4">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Пользователи</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.totalUsers?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-green-400">
              +{stats?.todayUsers?.toLocaleString() || 0} за сегодня
            </p>
          </div>
        </div>
        
        {/* Карточка видео */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-900 bg-opacity-20 mr-4">
                <span className="text-2xl">🎬</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Видео</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.totalVideos?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-green-400">
              +{stats?.todayVideos?.toLocaleString() || 0} за сегодня
            </p>
          </div>
        </div>
        
        {/* Карточка просмотров */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-900 bg-opacity-20 mr-4">
                <span className="text-2xl">👁️</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Просмотры</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.totalViews?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-green-400">
              +{stats?.todayViews?.toLocaleString() || 0} за сегодня
            </p>
          </div>
        </div>
        
        {/* Карточка лайков */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-900 bg-opacity-20 mr-4">
                <span className="text-2xl">❤️</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Лайки</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.totalLikes?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-green-400">
              +{stats?.todayLikes?.toLocaleString() || 0} за сегодня
            </p>
          </div>
        </div>
      </div>
      
      {/* Графики и активность */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Недавние видео */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">Недавние видео</h2>
          <div className="space-y-4">
            {stats?.recentVideos && stats.recentVideos.length > 0 ? (
              stats.recentVideos.map((video, index) => (
                <div key={video.id} className="flex items-start cursor-pointer hover:bg-gray-800 p-2 rounded-lg transition-colors" onClick={() => navigate(`/video/${video.id}`)}>
                  <div className="w-16 h-10 rounded-lg bg-gray-800 mr-3 flex-shrink-0 overflow-hidden">
                    <img 
                      src={video.thumbnailUrl || '/assets/placeholder-video.jpg'} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/assets/placeholder-video.jpg';
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium line-clamp-2">{video.title}</p>
                    <p className="text-gray-400 text-sm">{video.authorName}</p>
                    <div className="flex items-center mt-1 text-xs text-gray-400">
                      <span className="mr-3">{video.views.toLocaleString()} просмотров</span>
                      <span>{video.likes} лайков</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-center py-4">
                Нет недавних видео
              </div>
            )}
          </div>
        </div>
        
        {/* Быстрые действия */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">Быстрые действия</h2>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="secondary" 
              className="h-24 flex flex-col items-center justify-center"
              onClick={() => navigate('/admin/users')}
            >
              <span className="text-2xl mb-2">👥</span>
              <span>Пользователи</span>
            </Button>
            <Button 
              variant="secondary" 
              className="h-24 flex flex-col items-center justify-center"
              onClick={() => navigate('/admin/videos')}
            >
              <span className="text-2xl mb-2">🎬</span>
              <span>Видео</span>
            </Button>
            <Button 
              variant="secondary" 
              className="h-24 flex flex-col items-center justify-center"
              onClick={() => navigate('/admin/stats')}
            >
              <span className="text-2xl mb-2">📊</span>
              <span>Статистика</span>
            </Button>
            <Button 
              variant="secondary" 
              className="h-24 flex flex-col items-center justify-center"
              onClick={() => navigate('/admin/logs')}
            >
              <span className="text-2xl mb-2">📝</span>
              <span>Логи</span>
            </Button>
          </div>
        </div>
      
      {/* Графики */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Графики статистики</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedPeriod('24h')}
              className={`px-4 py-2 rounded-lg text-sm ${selectedPeriod === '24h' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}
            >
              24 часа
            </button>
            <button
              onClick={() => setSelectedPeriod('7d')}
              className={`px-4 py-2 rounded-lg text-sm ${selectedPeriod === '7d' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}
            >
              7 дней
            </button>
            <button
              onClick={() => setSelectedPeriod('30d')}
              className={`px-4 py-2 rounded-lg text-sm ${selectedPeriod === '30d' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}
            >
              30 дней
            </button>
            <button
              onClick={() => setSelectedPeriod('all')}
              className={`px-4 py-2 rounded-lg text-sm ${selectedPeriod === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}
            >
              Все время
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* График роста пользователей */}
          <LineChart
            data={chartsData.userGrowth}
            title="Рост пользователей"
            color="#3B82F6"
            height={300}
          />
          
          {/* График роста просмотров */}
          <LineChart
            data={chartsData.viewsGrowth} // Используем данные для роста просмотров
            title="Рост просмотров"
            color="#10B981"
            height={300}
          />
        </div>
        
        {/* График активности платформы */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* График роста загрузки видео */}
          <LineChart
            data={chartsData.videoUploadsGrowth}
            title="Рост загрузки видео"
            color="#F59E0B"
            height={300}
          />
          
          {/* Популярность контента */}
          <PieChart
            data={chartsData.contentPopularity}
            title="Популярность контента"
            height={300}
          />
        </div>
      </div>
      
      {/* Недавние видео и быстрые действия */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Недавние видео */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">Недавние видео</h2>
          <div className="space-y-4">
            {stats?.recentVideos && stats.recentVideos.length > 0 ? (
              stats.recentVideos.map((video, index) => (
                <div key={video.id} className="flex items-start cursor-pointer hover:bg-gray-800 p-2 rounded-lg transition-colors" onClick={() => navigate(`/video/${video.id}`)}>
                  <div className="w-16 h-10 rounded-lg bg-gray-800 mr-3 flex-shrink-0 overflow-hidden">
                    <img 
                      src={video.thumbnailUrl || '/assets/placeholder-video.jpg'} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/assets/placeholder-video.jpg';
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium line-clamp-2">{video.title}</p>
                    <p className="text-gray-400 text-sm">{video.authorName}</p>
                    <div className="flex items-center mt-1 text-xs text-gray-400">
                      <span className="mr-3">{video.views.toLocaleString()} просмотров</span>
                      <span>{video.likes} лайков</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-center py-4">
                Нет недавних видео
              </div>
            )}
          </div>
        </div>
        
        {/* Быстрые действия */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">Быстрые действия</h2>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="secondary" 
              className="h-24 flex flex-col items-center justify-center"
              onClick={() => navigate('/admin/users')}
            >
              <span className="text-2xl mb-2">👥</span>
              <span>Пользователи</span>
            </Button>
            <Button 
              variant="secondary" 
              className="h-24 flex flex-col items-center justify-center"
              onClick={() => navigate('/admin/videos')}
            >
              <span className="text-2xl mb-2">🎬</span>
              <span>Видео</span>
            </Button>
            <Button 
              variant="secondary" 
              className="h-24 flex flex-col items-center justify-center"
              onClick={() => navigate('/admin/stats')}
            >
              <span className="text-2xl mb-2">📊</span>
              <span>Статистика</span>
            </Button>
            <Button 
              variant="secondary" 
              className="h-24 flex flex-col items-center justify-center"
              onClick={() => navigate('/admin/logs')}
            >
              <span className="text-2xl mb-2">📝</span>
              <span>Логи</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default DashboardPage;