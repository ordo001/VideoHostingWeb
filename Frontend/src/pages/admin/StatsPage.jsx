import React, { useState, useEffect } from 'react';
import { useUI } from '../../hooks/useUI';
import adminService from '../../services/adminService';
import Button from '../../components/Button';
import Loader from '../../components/Loader';

const StatsPage = () => {
  const { showNotification } = useUI();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // '24h', '7d', '30d', 'all'
  
  // Загружаем статистику платформы
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      
      try {
        const data = await adminService.getPlatformStats(timeRange);
        setStats(data);
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
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-900 bg-opacity-20 mr-4">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Всего пользователей</p>
<p className="text-2xl font-bold text-white">
                {stats?.totalLikes?.toLocaleString() || 0}
              </p>
            </div>
            <div className="mt-4">
              <p className="text-sm text-green-400">
                Новые: +{stats?.newLikes?.toLocaleString() || 0}
            </p>
          </div>
        </div>
      </div>
      
      {/* Графики и детальная статистика */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Рост пользователей */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">Рост пользователей</h2>
          <div className="h-64 flex items-center justify-center bg-gray-800 rounded-lg">
            <p className="text-gray-500">График роста пользователей</p>
          </div>
        </div>
        
        {/* Популярные видео */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
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
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">Активность платформы</h2>
          <div className="h-64 flex items-center justify-center bg-gray-800 rounded-lg">
            <p className="text-gray-500">График активности</p>
          </div>
        </div>
        
        {/* География пользователей */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">География пользователей</h2>
          <div className="h-64 flex items-center justify-center bg-gray-800 rounded-lg">
            <p className="text-gray-500">Карта пользователей</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;