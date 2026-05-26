import React, { useState, useEffect } from 'react';
import { useUI } from '../../hooks/useUI';
import adminService from '../../services/adminService';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import { LineChart, PieChart } from '../../components/charts';

const StatsPage = () => {
  const { showNotification } = useUI();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // '24h', '7d', '30d', 'all'
  const [chartsData, setChartsData] = useState({
    userGrowth: [],
    viewsGrowth: [],
    videoUploads: [],
    contentPopularity: []
  });
  
  // Загружаем статистику платформы
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      
      try {
        const data = await adminService.getPlatformStats(timeRange);
        setStats(data);
        // Подготавливаем данные для графиков
        prepareChartsData(data);
      } catch (err) {
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
  }, [showNotification, timeRange]);
  
  // Функция для подготовки данных для графиков
  const prepareChartsData = (statsData) => {
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
    
    const periodDays = getPeriodDays(timeRange);
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
        // Получаем короткое имя дня недели на русском
        const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        return weekdays[date.getDay()];
      }
    };
    
    // Функция для определения смещения в зависимости от периода
    const getTimeOffset = (i, period) => {
      const date = new Date(today);
      if (period === '24h') {
        // Для 24 часов смещаем по часам
        date.setHours(today.getHours() - i);
        // Установим минуты и секунды в 0 для точного сравнения по часам
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        return date;
      } else if (period === 'all') {
        // Для "всё времени" смещаем по месяцам
        date.setMonth(today.getMonth() - i);
        // Установим день в 1 для точного сравнения по месяцам
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        return date;
      } else {
        // Для остальных периодов смещаем по дням
        date.setDate(today.getDate() - i);
        // Установим время в начало дня для точного сравнения по дням
        date.setHours(0, 0, 0, 0);
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
    
// Используем реальные данные из API
    if (statsData?.userGrowth && statsData.userGrowth.length > 0) {
      // Для "всё времени" агрегируем данные по месяцам
      if (timeRange === 'all') {
        const monthlyData = {};
        
        statsData.userGrowth.forEach(item => {
          const itemDate = normalizeDate(item.date);
          const monthKey = `${itemDate.getFullYear()}-${itemDate.getMonth()}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              date: new Date(itemDate.getFullYear(), itemDate.getMonth(), 1),
              count: 0
            };
          }
          
          monthlyData[monthKey].count += item.count;
        });
        
        // Создаем массив всех точек для периода
        const periodPoints = [];
        for (let i = periodDays - 1; i >= 0; i--) {
          const pointDate = getTimeOffset(i, timeRange);
          periodPoints.push(pointDate);
        }
        
        // Заполняем данные для каждого периода
        periodPoints.forEach(pointDate => {
          const label = getLabel(pointDate, timeRange);
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
          const pointDate = getTimeOffset(i, timeRange);
          periodPoints.push(pointDate);
        }
        
        // Для 24 часов агрегируем данные по часам
        if (timeRange === '24h') {
          const hourlyData = {};
          
          // Сначала агрегируем все данные по часам
          statsData.userGrowth.forEach(item => {
            const itemDate = normalizeDate(item.date);
            // Создаем ключ для часа
            const hourKey = `${itemDate.getFullYear()}-${itemDate.getMonth()}-${itemDate.getDate()}-${itemDate.getHours()}`;
            
            if (!hourlyData[hourKey]) {
              hourlyData[hourKey] = {
                date: new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate(), itemDate.getHours()),
                count: 0
              };
            }
            
            hourlyData[hourKey].count += item.count;
          });
          
          // Заполняем данные для каждого часа в периоде
          periodPoints.forEach(pointDate => {
            const label = getLabel(pointDate, timeRange);
            // Создаем ключ для поиска по часу
            const hourKey = `${pointDate.getFullYear()}-${pointDate.getMonth()}-${pointDate.getDate()}-${pointDate.getHours()}`;
            
            const pointData = hourlyData[hourKey];
            const value = pointData ? pointData.count : 0;
            
            userGrowthData.push({
              label,
              value
            });
          });
        } else {
          // Для дневных данных ищем по дням
          periodPoints.forEach(pointDate => {
            const label = getLabel(pointDate, timeRange);
            
            const pointDateString = pointDate.toDateString();
            const pointData = statsData.userGrowth.find(item => {
              const itemDate = normalizeDate(item.date);
              return itemDate.toDateString() === pointDateString;
            });
            const value = pointData ? pointData.count : 0;
            
            userGrowthData.push({
              label,
              value
            });
          });
        }
      }
    }
    
    // Данные для круговой диаграммы популярности контента
    let contentPopularityData = [];
    
    if (statsData?.popularVideos && statsData.popularVideos.length > 0) {
      // Создаем категории на основе популярных видео
      const categories = {};
      
      statsData.popularVideos.forEach(video => {
        // Извлекаем категории из названий видео (упрощенная логика)
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
      
      // Преобразуем в формат для графика
      contentPopularityData = Object.entries(categories).map(([label, value]) => ({
        label,
        value
      }));
    }
    
    // Данные для графика роста просмотров
    const viewsGrowthData = [];
    
    // Используем реальные данные из activityGraph
    if (statsData?.activityGraph && statsData.activityGraph.length > 0) {
      // Для "всё времени" агрегируем данные по месяцам
      if (timeRange === 'all') {
        const monthlyData = {};
        
        statsData.activityGraph.forEach(item => {
          const itemDate = normalizeDate(item.date);
          const monthKey = `${itemDate.getFullYear()}-${itemDate.getMonth()}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              date: new Date(itemDate.getFullYear(), itemDate.getMonth(), 1),
              views: 0
            };
          }
          
          monthlyData[monthKey].views += item.views;
        });
        
        // Создаем массив всех точек для периода
        const periodPoints = [];
        for (let i = periodDays - 1; i >= 0; i--) {
          const pointDate = getTimeOffset(i, timeRange);
          periodPoints.push(pointDate);
        }
        
        // Заполняем данные для каждого периода
        periodPoints.forEach(pointDate => {
          const label = getLabel(pointDate, timeRange);
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
          const pointDate = getTimeOffset(i, timeRange);
          periodPoints.push(pointDate);
        }
        
        // Для 24 часов агрегируем данные по часам
        if (timeRange === '24h') {
          const hourlyData = {};
          
          // Сначала агрегируем все данные по часам
          statsData.activityGraph.forEach(item => {
            const itemDate = normalizeDate(item.date);
            // Создаем ключ для часа
            const hourKey = `${itemDate.getFullYear()}-${itemDate.getMonth()}-${itemDate.getDate()}-${itemDate.getHours()}`;
            
            if (!hourlyData[hourKey]) {
              hourlyData[hourKey] = {
                date: new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate(), itemDate.getHours()),
                views: 0
              };
            }
            
            hourlyData[hourKey].views += item.views;
          });
          
          // Заполняем данные для каждого часа в периоде
          periodPoints.forEach(pointDate => {
            const label = getLabel(pointDate, timeRange);
            // Создаем ключ для поиска по часу
            const hourKey = `${pointDate.getFullYear()}-${pointDate.getMonth()}-${pointDate.getDate()}-${pointDate.getHours()}`;
            
            const pointData = hourlyData[hourKey];
            const value = pointData ? pointData.views : 0;
            
            viewsGrowthData.push({
              label,
              value
            });
          });
        } else {
          // Для дневных данных ищем по дням
          periodPoints.forEach(pointDate => {
            const label = getLabel(pointDate, timeRange);
            
            const pointDateString = pointDate.toDateString();
            const pointData = statsData.activityGraph.find(item => {
              const itemDate = normalizeDate(item.date);
              return itemDate.toDateString() === pointDateString;
            });
            const value = pointData ? pointData.views : 0;
            
            viewsGrowthData.push({
              label,
              value
            });
          });
        }
      }
    }
    
    // Данные для графика роста загрузки видео
    const videoUploadsData = [];
    
    // Используем реальные данные из activityGraph
    if (statsData?.activityGraph && statsData.activityGraph.length > 0) {
      // Для "всё времени" агрегируем данные по месяцам
      if (timeRange === 'all') {
        const monthlyData = {};
        
        statsData.activityGraph.forEach(item => {
          const itemDate = normalizeDate(item.date);
          const monthKey = `${itemDate.getFullYear()}-${itemDate.getMonth()}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              date: new Date(itemDate.getFullYear(), itemDate.getMonth(), 1),
              uploads: 0
            };
          }
          
          monthlyData[monthKey].uploads += item.uploads;
        });
        
        // Создаем массив всех точек для периода
        const periodPoints = [];
        for (let i = periodDays - 1; i >= 0; i--) {
          const pointDate = getTimeOffset(i, timeRange);
          periodPoints.push(pointDate);
        }
        
        // Заполняем данные для каждого периода
        periodPoints.forEach(pointDate => {
          const label = getLabel(pointDate, timeRange);
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
          const pointDate = getTimeOffset(i, timeRange);
          periodPoints.push(pointDate);
        }
        
        // Для 24 часов агрегируем данные по часам
        if (timeRange === '24h') {
          const hourlyData = {};
          
          // Сначала агрегируем все данные по часам
          statsData.activityGraph.forEach(item => {
            const itemDate = normalizeDate(item.date);
            // Создаем ключ для часа
            const hourKey = `${itemDate.getFullYear()}-${itemDate.getMonth()}-${itemDate.getDate()}-${itemDate.getHours()}`;
            
            if (!hourlyData[hourKey]) {
              hourlyData[hourKey] = {
                date: new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate(), itemDate.getHours()),
                uploads: 0
              };
            }
            
            hourlyData[hourKey].uploads += item.uploads;
          });
          
          // Заполняем данные для каждого часа в периоде
          periodPoints.forEach(pointDate => {
            const label = getLabel(pointDate, timeRange);
            // Создаем ключ для поиска по часу
            const hourKey = `${pointDate.getFullYear()}-${pointDate.getMonth()}-${pointDate.getDate()}-${pointDate.getHours()}`;
            
            const pointData = hourlyData[hourKey];
            const value = pointData ? pointData.uploads : 0;
            
            videoUploadsData.push({
              label,
              value
            });
          });
        } else {
          // Для дневных данных ищем по дням
          periodPoints.forEach(pointDate => {
            const label = getLabel(pointDate, timeRange);
            
            const pointDateString = pointDate.toDateString();
            const pointData = statsData.activityGraph.find(item => {
              const itemDate = normalizeDate(item.date);
              return itemDate.toDateString() === pointDateString;
            });
            const value = pointData ? pointData.uploads : 0;
            
            videoUploadsData.push({
              label,
              value
            });
          });
        }
      }
    }
    
    const chartsData = {
      userGrowth: userGrowthData,
      viewsGrowth: viewsGrowthData,
      videoUploads: videoUploadsData,
      contentPopularity: contentPopularityData
    };
    
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Статистика платформы</h1>
            <p className="text-gray-400 mt-2">
              Аналитика и метрики ZTube
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="flex space-x-2">
              {[
                { value: '24h', label: '24 часа' },
                { value: '7d', label: '7 дней' },
                { value: '30d', label: '30 дней' },
                { value: 'all', label: 'Все время' }
              ].map((range) => (
                <Button
                  key={range.value}
                  variant={timeRange === range.value ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setTimeRange(range.value)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
{/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Карточка пользователей */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-900 bg-opacity-20 mr-4">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Всего пользователей</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.totalUsers?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-green-400">
              Новые: +{stats?.newUsers?.toLocaleString() || 0}
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
                <p className="text-gray-400 text-sm">Всего видео</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.totalVideos?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-green-400">
              Новые: +{stats?.newVideos?.toLocaleString() || 0}
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
                <p className="text-gray-400 text-sm">Всего просмотров</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.totalViews?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-green-400">
              Новые: +{stats?.newViews?.toLocaleString() || 0}
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
                <p className="text-gray-400 text-sm">Всего лайков</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.totalLikes?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-green-400">
              Новые: +{stats?.newLikes?.toLocaleString() || 0}
            </p>
          </div>
        </div>
      </div>
      
      {/* Графики и детальная статистика */}
      <div className="space-y-6">
        {/* Рост пользователей */}
        <LineChart
          data={chartsData.userGrowth}
          title="Рост пользователей"
          color="#3B82F6"
          height={300}
        />
        
        {/* Популярные видео */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 w-full">
          <h2 className="text-xl font-bold text-white mb-4">Популярные видео</h2>
          <div className="space-y-4">
            {stats?.popularVideos?.map((video, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-white">{video.title}</p>
                  <p className="text-sm text-gray-400">{video.views.toLocaleString()} просмотров</p>
                  <p className="text-xs text-gray-500">{video.authorName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-400">+{video.likes.toLocaleString()} ❤️</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Активность платформы */}
        <LineChart
          data={chartsData.viewsGrowth}
          title="Активность платформы"
          color="#10B981"
          height={300}
        />
        
        {/* География пользователей */}
        <PieChart
          data={chartsData.contentPopularity}
          title="География пользователей"
          height={300}
        />
      </div>
    </div>
    
  );
};

export default StatsPage;