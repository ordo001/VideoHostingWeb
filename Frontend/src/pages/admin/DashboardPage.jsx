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
  const [recentVideos, setRecentVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartsData, setChartsData] = useState({
    userGrowth: [],
    viewsGrowth: [], // Данные для роста просмотров
    videoUploads: [], // Данные для роста загрузки видео
    contentPopularity: []
  });
  
  // Загружаем статистику платформы
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Загрузка статистики...');
        const data = await adminService.getPlatformStats(selectedPeriod);
        console.log('Полученные данные:', data);
        setStats(data);
        
        // Загружаем последние видео
        const videosData = await adminService.getRecentVideos(5);
        console.log('Последние видео:', videosData);
        setRecentVideos(videosData || []);
        
        // Подготавливаем данные для графиков
        // Если API не предоставляет эти данные, генерируем демонстрационные данные
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
    console.log('Подготовка данных для графиков:', statsData);
    
    // Определяем количество точек данных на основе выбранного периода
    const getPeriodDays = (period) => {
      switch (period) {
        case '24h': return 24; // Почасовые данные за 24 часа
        case '7d': return 7; // Дневные данные за 7 дней
        case '30d': return 30; // Дневные данные за 30 дней
        case 'all': return 12; // Месячные данные (12 месяцев)
        default: return 7;
      }
    };
    
    const periodDays = getPeriodDays(selectedPeriod);
    const today = new Date();
    
    // Функция для генерации метки в зависимости от периода
    const getLabel = (date, period) => {
      if (period === '24h') {
        // Для 24 часов показываем часы
        const hour = date.getHours();
        return `${hour}:00`;
      } else if (period === 'all') {
        // Для "всё время" показываем месяц и год
        return date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });
      } else if (period === '30d') {
        // Для 30 дней показываем день и месяц
        return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
      } else {
        // Для 7 дней показываем день недели
        return date.toLocaleDateString('ru-RU', { weekday: 'short' });
      }
    };
    
    // Функция для определения смещения в зависимости от периода
    const getTimeOffset = (i, period) => {
      const date = new Date(today);
      if (period === '24h') {
        // Для 24 часов смещаем по часам
        date.setHours(today.getHours() - i);
        return date;
      } else if (period === 'all') {
        // Для "всё время" смещаем по месяцам
        date.setMonth(today.getMonth() - i);
        return date;
      } else {
        // Для остальных периодов смещаем по дням
        date.setDate(today.getDate() - i);
        return date;
      }
    };
    
    // Вспомогательная функция для нормализации даты из данных
    const normalizeDate = (dateStr) => {
      // Пытаемся распарсить дату различными способами
      try {
        // Если это уже объект Date
        if (dateStr instanceof Date) {
          return new Date(dateStr);
        }
        
        // Если это строка, пробуем стандартный парсинг
        if (typeof dateStr === 'string') {
          // Пробуем создать дату напрямую
          let date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date;
          }
          
          // Если стандартный парсинг не удался, попробуем другие форматы
          // Например, если дата в формате "2023-12-01T00:00:00"
          date = new Date(dateStr.replace(' ', 'T'));
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
        
        // Если ничего не помогло, возвращаем новую дату
        return new Date();
      } catch (e) {
        console.warn('Ошибка при парсинге даты:', dateStr, e);
        return new Date();
      }
    };
    
    // Данные для графика роста пользователей
    const userGrowthData = [];
    
    // Используем реальные данные из API, если они есть
    if (statsData?.userGrowth && statsData.userGrowth.length > 0) {
      console.log('Используем реальные данные userGrowth:', statsData.userGrowth);
      
      if (selectedPeriod === 'all') {
        // Для "всё время" агрегируем данные по месяцам
        const monthlyData = {};
        
        statsData.userGrowth.forEach(item => {
          const itemDate = normalizeDate(item.date || item.Date);
          const monthKey = `${itemDate.getFullYear()}-${itemDate.getMonth()}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              date: new Date(itemDate.getFullYear(), itemDate.getMonth(), 1),
              count: 0
            };
          }
          
          monthlyData[monthKey].count += (item.count || item.Count || 0);
        });
        
        // Создаем массив всех точек для периода
        const periodPoints = [];
        for (let i = periodDays - 1; i >= 0; i--) {
          const pointDate = getTimeOffset(i, selectedPeriod);
          periodPoints.push(pointDate);
        }
        
        // Заполняем данные для каждого периода
        periodPoints.forEach(pointDate => {
          const label = getLabel(pointDate, selectedPeriod);
          const monthKey = `${pointDate.getFullYear()}-${pointDate.getMonth()}`;
          
          const pointData = monthlyData[monthKey];
          const value = pointData ? pointData.count : 0;
          
          userGrowthData.push({
            label,
            value
          });
        });
      } else {
        // Для остальных периодов
        
        // Создаем массив всех точек для периода
        const periodPoints = [];
        for (let i = periodDays - 1; i >= 0; i--) {
          const pointDate = getTimeOffset(i, selectedPeriod);
          periodPoints.push(pointDate);
        }
        
        // Заполняем данные для каждого периода
        periodPoints.forEach(pointDate => {
          const label = getLabel(pointDate, selectedPeriod);
          
          // Ищем данные за этот период в userGrowth
          let value = 0;
          if (selectedPeriod === '24h') {
            // Для почасовых данных ищем по часу
            const hourPoint = pointDate.getHours();
            const pointData = statsData.userGrowth.find(item => {
              const itemDate = normalizeDate(item.date || item.Date);
              return itemDate.getHours() === hourPoint && 
                     itemDate.toDateString() === pointDate.toDateString();
            });
            value = pointData ? (pointData.count || pointData.Count || 0) : 0;
          } else {
            // Для дневных данных ищем по дню
            const pointDateString = pointDate.toDateString();
            const pointData = statsData.userGrowth.find(item => {
              const itemDate = normalizeDate(item.date || item.Date);
              return itemDate.toDateString() === pointDateString;
            });
            value = pointData ? (pointData.count || pointData.Count || 0) : 0;
          }
          
          userGrowthData.push({
            label,
            value
          });
        });
      }
    } else {
      console.log('Нет данных userGrowth, генерируем демо-данные');
      
      // Если нет данных от API, генерируем демо-данные
      for (let i = periodDays - 1; i >= 0; i--) {
        const date = new Date(today);
        const adjustedDate = getTimeOffset(i, selectedPeriod);
        const label = getLabel(adjustedDate, selectedPeriod);
        
        const value = Math.floor(Math.random() * 50) + Math.floor((statsData?.totalUsers || 100) / 100) + 10;
        
        userGrowthData.push({
          label,
          value
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
        const title = (video.title || video.Title || '').toLowerCase();
        
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
        
        const views = video.views || video.Views || 0;
        categories[category] = (categories[category] || 0) + views;
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
    
    // Используем реальные данные из activityGraph
    if (statsData?.activityGraph && statsData.activityGraph.length > 0) {
      console.log('Используем данные activityGraph для просмотров:', statsData.activityGraph);
      
      if (selectedPeriod === 'all') {
        // Для "всё времени" агрегируем данные по месяцам
        const monthlyData = {};
        
        statsData.activityGraph.forEach(item => {
          const itemDate = normalizeDate(item.date || item.Date);
          const monthKey = `${itemDate.getFullYear()}-${itemDate.getMonth()}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              date: new Date(itemDate.getFullYear(), itemDate.getMonth(), 1),
              views: 0
            };
          }
          
          monthlyData[monthKey].views += (item.views || item.Views || 0);
        });
        
        // Создаем массив всех точек для периода
        const periodPoints = [];
        for (let i = periodDays - 1; i >= 0; i--) {
          const pointDate = getTimeOffset(i, selectedPeriod);
          periodPoints.push(pointDate);
        }
        
        // Заполняем данные для каждого периода
        periodPoints.forEach(pointDate => {
          const label = getLabel(pointDate, selectedPeriod);
          const monthKey = `${pointDate.getFullYear()}-${pointDate.getMonth()}`;
          
          const pointData = monthlyData[monthKey];
          const value = pointData ? pointData.views : 0;
          
          viewsGrowthData.push({
            label,
            value
          });
        });
      } else {
        // Для остальных периодов
        
        // Создаем массив всех точек для периода
        const periodPoints = [];
        for (let i = periodDays - 1; i >= 0; i--) {
          const pointDate = getTimeOffset(i, selectedPeriod);
          periodPoints.push(pointDate);
        }
        
        // Заполняем данные для каждого периода
        periodPoints.forEach(pointDate => {
          const label = getLabel(pointDate, selectedPeriod);
          
          // Ищем данные за этот период в activityGraph
          let value = 0;
          if (selectedPeriod === '24h') {
            // Для почасовых данных ищем по часу
            const hourPoint = pointDate.getHours();
            const pointData = statsData.activityGraph.find(item => {
              const itemDate = normalizeDate(item.date || item.Date);
              return itemDate.getHours() === hourPoint && 
                     itemDate.toDateString() === pointDate.toDateString();
            });
            value = pointData ? (pointData.views || pointData.Views || 0) : 0;
          } else {
            // Для дневных данных ищем по дню
            const pointDateString = pointDate.toDateString();
            const pointData = statsData.activityGraph.find(item => {
              const itemDate = normalizeDate(item.date || item.Date);
              return itemDate.toDateString() === pointDateString;
            });
            value = pointData ? (pointData.views || pointData.Views || 0) : 0;
          }
          
          viewsGrowthData.push({
            label,
            value
          });
        });
      }
    } else {
      console.log('Нет данных для просмотров, генерируем демо-данные');
      
      // Если нет данных от API, генерируем демо-данные
      for (let i = periodDays - 1; i >= 0; i--) {
        const date = new Date(today);
        const adjustedDate = getTimeOffset(i, selectedPeriod);
        const label = getLabel(adjustedDate, selectedPeriod);
        
        const value = Math.floor(Math.random() * 1000) + 500;
        
        viewsGrowthData.push({
          label,
          value
        });
      }
    }
    
    // Данные для графика роста загрузки видео
    const videoUploadsData = [];
    
    // Используем реальные данные из activityGraph
    if (statsData?.activityGraph && statsData.activityGraph.length > 0) {
      console.log('Используем данные activityGraph для загрузки видео:', statsData.activityGraph);
      
      if (selectedPeriod === 'all') {
        // Для "всё времени" агрегируем данные по месяцам
        const monthlyData = {};
        
        statsData.activityGraph.forEach(item => {
          const itemDate = normalizeDate(item.date || item.Date);
          const monthKey = `${itemDate.getFullYear()}-${itemDate.getMonth()}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              date: new Date(itemDate.getFullYear(), itemDate.getMonth(), 1),
              uploads: 0
            };
          }
          
          monthlyData[monthKey].uploads += (item.uploads || item.Uploads || 0);
        });
        
        // Создаем массив всех точек для периода
        const periodPoints = [];
        for (let i = periodDays - 1; i >= 0; i--) {
          const pointDate = getTimeOffset(i, selectedPeriod);
          periodPoints.push(pointDate);
        }
        
        // Заполняем данные для каждого периода
        periodPoints.forEach(pointDate => {
          const label = getLabel(pointDate, selectedPeriod);
          const monthKey = `${pointDate.getFullYear()}-${pointDate.getMonth()}`;
          
          const pointData = monthlyData[monthKey];
          const value = pointData ? pointData.uploads : 0;
          
          videoUploadsData.push({
            label,
            value
          });
        });
      } else {
        // Для остальных периодов
        
        // Создаем массив всех точек для периода
        const periodPoints = [];
        for (let i = periodDays - 1; i >= 0; i--) {
          const pointDate = getTimeOffset(i, selectedPeriod);
          periodPoints.push(pointDate);
        }
        
        // Заполняем данные для каждого периода
        periodPoints.forEach(pointDate => {
          const label = getLabel(pointDate, selectedPeriod);
          
          // Ищем данные за этот период в activityGraph
          let value = 0;
          if (selectedPeriod === '24h') {
            // Для почасовых данных ищем по часу
            const hourPoint = pointDate.getHours();
            const pointData = statsData.activityGraph.find(item => {
              const itemDate = normalizeDate(item.date || item.Date);
              return itemDate.getHours() === hourPoint && 
                     itemDate.toDateString() === pointDate.toDateString();
            });
            value = pointData ? (pointData.uploads || pointData.Uploads || 0) : 0;
          } else {
            // Для дневных данных ищем по дню
            const pointDateString = pointDate.toDateString();
            const pointData = statsData.activityGraph.find(item => {
              const itemDate = normalizeDate(item.date || item.Date);
              return itemDate.toDateString() === pointDateString;
            });
            value = pointData ? (pointData.uploads || pointData.Uploads || 0) : 0;
          }
          
          videoUploadsData.push({
            label,
            value
          });
        });
      }
    } else {
      console.log('Нет данных для загрузки видео, генерируем демо-данные');
      
      // Если нет данных от API, генерируем демо-данные
      for (let i = periodDays - 1; i >= 0; i--) {
        const date = new Date(today);
        const adjustedDate = getTimeOffset(i, selectedPeriod);
        const label = getLabel(adjustedDate, selectedPeriod);
        
        const value = Math.floor(Math.random() * 10) + 1;
        
        videoUploadsData.push({
          label,
          value
        });
      }
    }
    
    const chartsData = {
      userGrowth: userGrowthData,
      viewsGrowth: viewsGrowthData, // Данные для роста просмотров
      videoUploads: videoUploadsData, // Данные для роста загрузки видео
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
              +{stats?.newUsers?.toLocaleString() || 0} за сегодня
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
              +{stats?.newVideos?.toLocaleString() || 0} за сегодня
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
              +{stats?.newViews?.toLocaleString() || 0} за сегодня
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
              +{stats?.newLikes?.toLocaleString() || 0} за сегодня
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
                        src={video.thumbnailUrl} 
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
            data={chartsData.viewsGrowth}
            title="Рост просмотров"
            color="#10B981"
            height={300}
          />
        </div>
        
        {/* График загрузки видео */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* График роста загрузки видео */}
          <LineChart
            data={chartsData.videoUploads}
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
     </div>
     </div>
  );
};

export default DashboardPage;