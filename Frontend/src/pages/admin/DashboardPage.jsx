import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../../hooks/useUI';
import adminService from '../../services/adminService';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import { LineChart, PieChart } from '../../components/charts';

const DashboardPage = () => {
  const { showNotification } = useUI();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentVideos, setRecentVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartsData, setChartsData] = useState({
    userGrowth: [],
    viewsGrowth: [],
    videoUploads: [],
    contentPopularity: []
  });

  // Загружаем статистику платформы
  const [selectedPeriod, setSelectedPeriod] = useState('24h');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await adminService.getPlatformStats(selectedPeriod);
        setStats(data);

        // Загружаем последние видео
        const videosData = await adminService.getRecentVideos(5);
        setRecentVideos(videosData || []);

        // Подготавливаем данные для графиков
        prepareChartsData(data);
      } catch (err) {
        console.error('Ошибка при загрузке данных:', err);
        showNotification({
          type: 'error',
          title: 'Ошибка загрузки',
          message: err.message
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showNotification, selectedPeriod]);

  // Функция для подготовки данных для графиков
  const prepareChartsData = (statsData) => {
    const isHourly = selectedPeriod === '24h';

    // --- Рост пользователей ---
    const userGrowthData = [];
    if (statsData?.userGrowth && statsData.userGrowth.length > 0) {
      if (isHourly) {
        // Агрегируем данные по часам
        const hourlyMap = {};
        statsData.userGrowth.forEach(item => {
          const d = new Date(item.date);
          const key = d.toISOString().slice(0, 13); // YYYY-MM-DDTHH
          hourlyMap[key] = (hourlyMap[key] || 0) + d.count ?? item.count;
        });

        const now = new Date();
        for (let i = 23; i >= 0; i--) {
          const hour = new Date(now.getTime() - i * 3600000);
          const key = hour.toISOString().slice(0, 13);
          const entry = Object.entries(hourlyMap).find(([k]) => k === key);
          userGrowthData.push({
            label: `${hour.getHours()}:00`,
            value: entry ? entry[1] : 0
          });
        }
      } else {
        // Дневные данные — используем как есть, заполняем пустые дни
        const today = new Date();
        const days = selectedPeriod === '7d' ? 7 : 30;
        const dailyMap = {};
        statsData.userGrowth.forEach(item => {
          const d = new Date(item.date);
          const key = d.toDateString();
          dailyMap[key] = item.count;
        });

        for (let i = days - 1; i >= 0; i--) {
          const day = new Date(today);
          day.setDate(day.getDate() - i);
          day.setHours(0, 0, 0, 0);
          const key = day.toDateString();
          let label;
          if (selectedPeriod === '7d') {
            const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
            label = weekdays[day.getDay()];
          } else {
            label = day.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
          }
          userGrowthData.push({ label, value: dailyMap[key] || 0 });
        }
      }
    }

    // --- График активности (просмотры и загрузки) ---
    const viewsGrowthData = [];
    const videoUploadsData = [];

    if (statsData?.activityGraph && statsData.activityGraph.length > 0) {
      if (isHourly) {
        // Почасовые данные — backend возвращает 24 точки
        const hourlyMap = {};
        statsData.activityGraph.forEach(item => {
          const d = new Date(item.date);
          const key = d.toISOString().slice(0, 13);
          hourlyMap[key] = { views: item.views, uploads: item.uploads };
        });

        const now = new Date();
        for (let i = 23; i >= 0; i--) {
          const hour = new Date(now.getTime() - i * 3600000);
          const key = hour.toISOString().slice(0, 13);
          const entry = hourlyMap[key];
          viewsGrowthData.push({
            label: `${hour.getHours()}:00`,
            value: entry ? entry.views : 0
          });
          videoUploadsData.push({
            label: `${hour.getHours()}:00`,
            value: entry ? entry.uploads : 0
          });
        }
      } else {
        // Дневные данные
        const today = new Date();
        const days = selectedPeriod === '7d' ? 7 : 30;
        const dailyMap = {};
        statsData.activityGraph.forEach(item => {
          const d = new Date(item.date);
          const key = d.toDateString();
          dailyMap[key] = { views: item.views, uploads: item.uploads };
        });

        for (let i = days - 1; i >= 0; i--) {
          const day = new Date(today);
          day.setDate(day.getDate() - i);
          day.setHours(0, 0, 0, 0);
          const key = day.toDateString();
          let label;
          if (selectedPeriod === '7d') {
            const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
            label = weekdays[day.getDay()];
          } else {
            label = day.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
          }
          const entry = dailyMap[key];
          viewsGrowthData.push({ label, value: entry ? entry.views : 0 });
          videoUploadsData.push({ label, value: entry ? entry.uploads : 0 });
        }
      }
    }

    // --- Популярность контента (круговая диаграмма) ---
    const contentPopularityData = [];
    if (statsData?.popularVideos && statsData.popularVideos.length > 0) {
      const categories = {};
      statsData.popularVideos.forEach(video => {
        let category = 'Другое';
        const title = (video.title || '').toLowerCase();

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

        const views = video.views || 0;
        categories[category] = (categories[category] || 0) + views;
      });

      Object.entries(categories).forEach(([label, value]) => {
        contentPopularityData.push({ label, value });
      });
    }

    setChartsData({
      userGrowth: userGrowthData,
      viewsGrowth: viewsGrowthData,
      videoUploads: videoUploadsData,
      contentPopularity: contentPopularityData
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  // Функция для форматирования даты
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Сегодня';
    } else if (diffDays === 1) {
      return 'Вчера';
    } else if (diffDays < 7) {
      return `${diffDays} дня(-ей) назад`;
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  // Функция для перехода к видео
  const handleVideoClick = (videoId) => {
    navigate(`/video/${videoId}`);
  };

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
              +{stats?.newUsers?.toLocaleString() || 0} за период
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
              +{stats?.newVideos?.toLocaleString() || 0} за период
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
              +{stats?.newViews?.toLocaleString() || 0} за период
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
              +{stats?.newLikes?.toLocaleString() || 0} за период
            </p>
          </div>
        </div>
      </div>
      {/* Графики и активность */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Последние загруженные видео */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">Последние видео</h2>
          <div className="space-y-3">
            {recentVideos && recentVideos.length > 0 ? (
              recentVideos.map((video, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors duration-200"
                  onClick={() => handleVideoClick(video.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleVideoClick(video.id);
                    }
                  }}
                >
                  {/* Превью видео */}
                  <div className="w-20 h-14 rounded-lg bg-gray-800 flex-shrink-0 overflow-hidden">
                    {video.thumbnailUrl ? (
                      <img
                        src={`http://localhost:9000/${video.thumbnailUrl}`}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">🎬</span>
                      </div>
                    )}
                  </div>

                  {/* Информация о видео */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-sm truncate">{video.title}</h3>
                    <p className="text-gray-400 text-xs truncate">{video.authorName}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-gray-500 text-xs">{formatDate(video.createdAt)}</p>
                      <p className="text-gray-500 text-xs">{video.viewCount || 0} просмотров</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-center py-8">
                Нет загруженных видео
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
              onClick={() => navigate('/admin')}
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
      <br/>
      <br/>
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
          </div>
        </div>

        <div className="space-y-6">
          {/* График роста пользователей */}
          <div className="w-full">
            <LineChart
              data={chartsData.userGrowth}
              title="Рост пользователей"
              color="#3B82F6"
              height={300}
            />
          </div>

          {/* График роста просмотров */}
          <div className="w-full">
            <LineChart
              data={chartsData.viewsGrowth}
              title="Рост просмотров"
              color="#10B981"
              height={300}
            />
          </div>

          {/* График роста загрузки видео */}
          <div className="w-full">
            <LineChart
              data={chartsData.videoUploads}
              title="Рост загрузки видео"
              color="#F59E0B"
              height={300}
            />
          </div>

          {/* Популярность контента */}
          <div className="w-full">
            <PieChart
              data={chartsData.contentPopularity}
              title="Популярность контента"
              height={300}
            />
          </div>
        </div>
     </div>
     </div>
  );
};

export default DashboardPage;
