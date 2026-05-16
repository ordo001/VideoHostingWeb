import React, { useState, useEffect } from 'react';
import { useUI } from '../../hooks/useUI';
import adminService from '../../services/adminService';
import Button from '../../components/Button';
import Loader from '../../components/Loader';

const DashboardPage = () => {
  const { showNotification } = useUI();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Загружаем статистику платформы
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getPlatformStats();
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
  }, [showNotification]);
  
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
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-900 bg-opacity-20 mr-4">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Пользователи</p>
<p className="text-2xl font-bold text-white">
                {stats?.totalLikes?.toLocaleString() || 0}
              </p>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-400">
                +{stats?.newLikes?.toLocaleString() || 0} за период
            </p>
          </div>
        </div>
      </div>
      
      {/* Графики и активность */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Недавняя активность */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">Недавняя активность</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-gray-400">👤</span>
                </div>
                <div>
                  <p className="text-white font-medium">Новый пользователь зарегистрирован</p>
                  <p className="text-gray-400 text-sm">2 часа назад</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Быстрые действия */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">Быстрые действия</h2>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="secondary" className="h-24 flex flex-col items-center justify-center">
              <span className="text-2xl mb-2">👥</span>
              <span>Пользователи</span>
            </Button>
            <Button variant="secondary" className="h-24 flex flex-col items-center justify-center">
              <span className="text-2xl mb-2">🎬</span>
              <span>Видео</span>
            </Button>
            <Button variant="secondary" className="h-24 flex flex-col items-center justify-center">
              <span className="text-2xl mb-2">📊</span>
              <span>Статистика</span>
            </Button>
            <Button variant="secondary" className="h-24 flex flex-col items-center justify-center">
              <span className="text-2xl mb-2">📝</span>
              <span>Логи</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;