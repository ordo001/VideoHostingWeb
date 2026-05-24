import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, BarChart } from '../../components/admin/Chart';
import Button from '../../components/Button';
import adminService from '../../services/adminService';

const DashboardPage = () => {
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [recentVideos, setRecentVideos] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getPlatformStats(selectedPeriod);
        setStats(data);
        setRecentVideos(data.recentVideos || []);
      } catch (error) {
        console.error('Ошибка при загрузке статистики:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedPeriod]);

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // Подготовка данных для графиков
  const userGrowthData = stats?.userGrowth?.map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    count: item.count
  })) || [];

  const activityGraphData = stats?.activityGraph?.map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    views: item.views,
    uploads: item.uploads,
    registrations: item.registrations
  })) || [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Административная панель</h1>
        <p className="text-gray-400 mt-2">Добро пожаловать в панель управления</p>
      </div>

      {/* Периоды */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { value: '24h', label: '24 часа' },
          { value: '7d', label: '7 дней' },
          { value: '30d', label: '30 дней' },
          { value: 'all', label: 'Все время' }
        ].map((period) => (
          <Button
            key={period.value}
            variant={selectedPeriod === period.value ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => handlePeriodChange(period.value)}
          >
            {period.label}
          </Button>
        ))}
      </div>

      {/* Статистика за сегодня */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500 bg-opacity-20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Пользователей</p>
              <p className="text-2xl font-semibold text-white">{stats?.totalUsers?.toLocaleString() || 0}</p>
              <p className="text-sm text-green-400">+{stats?.newUsersToday?.toLocaleString() || 0} сегодня</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500 bg-opacity-20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Видео</p>
              <p className="text-2xl font-semibold text-white">{stats?.totalVideos?.toLocaleString() || 0}</p>
              <p className="text-sm text-green-400">+{stats?.newVideosToday?.toLocaleString() || 0} сегодня</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500 bg-opacity-20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Просмотров</p>
              <p className="text-2xl font-semibold text-white">{stats?.totalViews?.toLocaleString() || 0}</p>
              <p className="text-sm text-green-400">+{stats?.newViewsToday?.toLocaleString() || 0} сегодня</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-500 bg-opacity-20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Лайков</p>
              <p className="text-2xl font-semibold text-white">{stats?.totalLikes?.toLocaleString() || 0}</p>
              <p className="text-sm text-green-400">+{stats?.newLikesToday?.toLocaleString() || 0} сегодня</p>
            </div>
          </div>
        </div>
      </div>

      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Рост пользователей</h3>
          <LineChart 
            data={userGrowthData} 
            dataKey="count" 
            color="#3B82F6" 
            height={300}
          />
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Рост загрузки видео</h3>
          <BarChart 
            data={activityGraphData} 
            dataKeys={['uploads']} 
            colors={['#8B5CF6']} 
            height={300}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Рост просмотров</h3>
          <LineChart 
            data={activityGraphData} 
            dataKey="views" 
            color="#10B981" 
            height={300}
          />
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Рост регистраций</h3>
          <BarChart 
            data={activityGraphData} 
            dataKeys={['registrations']} 
            colors={['#EF4444']} 
            height={300}
          />
        </div>
      </div>

      {/* Последние загруженные видео */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Последние загруженные видео</h3>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/admin/videos')}
          >
            Все видео
          </Button>
        </div>
        
        {recentVideos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentVideos.map((video) => (
              <div 
                key={video.id} 
                className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => navigate(`/watch/${video.id}`)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-16 w-24 rounded bg-gray-700 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className="text-sm font-medium text-white line-clamp-2">{video.title}</h4>
                    <p className="text-xs text-gray-400 mt-1">{video.authorName}</p>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <span>{video.views?.toLocaleString() || 0} просмотров</span>
                      <span className="mx-1">•</span>
                      <span>{video.likes?.toLocaleString() || 0} лайков</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">Нет данных</p>
        )}
      </div>

      {/* Быстрые действия */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">Быстрые действия</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            onClick={() => navigate('/admin/logs')}
          >
            <span className="text-2xl mb-2">📝</span>
            <span>Логи</span>
          </Button>
          <Button 
            variant="secondary" 
            className="h-24 flex flex-col items-center justify-center"
            onClick={() => {
              // Открываем документацию или справку
            }}
          >
            <span className="text-2xl mb-2">❓</span>
            <span>Справка</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;