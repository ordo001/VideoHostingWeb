import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../Button';

const AdminLayout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Проверяем, является ли пользователь администратором
  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Доступ запрещен</h2>
          <p className="text-gray-400 mb-6">У вас нет прав для доступа к этой странице</p>
          <Link to="/">
            <Button variant="primary">Вернуться на главную</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  const menuItems = [
    { name: 'Панель', path: '/admin', icon: '📊' },
    { name: 'Пользователи', path: '/admin/users', icon: '👥' },
    { name: 'Видео', path: '/admin/videos', icon: '🎬' },
    { name: 'Логи', path: '/admin/logs', icon: '📝' },
  ];
  
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex">
        {/* Боковая панель */}
        <div className="w-64 bg-gray-900 border-r border-gray-800 min-h-screen fixed inset-y-0 left-0 z-30">
          <div className="flex items-center justify-center h-16 border-b border-gray-800">
            <h1 className="text-xl font-bold">
              Admin <span className="text-primary">ZTube</span>
            </h1>
          </div>
          
          <nav className="mt-5 px-2">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    location.pathname === item.path
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>
          
          <div className="absolute bottom-0 w-64 p-4 border-t border-gray-800">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-3 overflow-hidden">
                {user.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.name} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="font-medium text-gray-300">
                    {user.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-400">Администратор</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Основной контент */}
        <div className="flex-1 ml-64">
          <div className="p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;