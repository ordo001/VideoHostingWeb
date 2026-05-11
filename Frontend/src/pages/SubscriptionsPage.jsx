import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../hooks/useUI';
import subscriptionService from '../services/subscriptionService';
import ChannelCard from '../components/ChannelCard';
import Loader from '../components/Loader';

const SubscriptionsPage = () => {
  const { isAuthenticated } = useAuth();
  const { showNotification } = useUI();
  
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Загружаем список подписок
  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!isAuthenticated) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await subscriptionService.getMySubscriptions();
        setSubscriptions(data.channels || []);
      } catch (err) {
        setError(err.message);
        showNotification({
          type: 'error',
          title: 'Ошибка загрузки',
          message: err.message
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubscriptions();
  }, [isAuthenticated, showNotification]);
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Требуется авторизация</h2>
          <p className="text-gray-400">Войдите в аккаунт, чтобы просматривать подписки</p>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ошибка загрузки подписок</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Повторить попытку
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Подписки</h1>
          <p className="text-gray-400 mt-2">
            {subscriptions.length} {subscriptions.length === 1 ? 'канал' : 'каналов'}
          </p>
        </div>
        
        {subscriptions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptions.map(channel => (
              <ChannelCard
                key={channel.id}
                id={channel.id}
                name={channel.name}
                avatarUrl={channel.avatar_url}
                subscribersCount={channel.subscribers_count}
                videosCount={channel.videos_count}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 rounded-full bg-gray-900 flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Нет подписок</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Вы еще не подписались ни на один канал. Найдите интересные каналы и подпишитесь на них.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionsPage;