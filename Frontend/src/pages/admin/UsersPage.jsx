import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../../hooks/useUI';
import adminService from '../../services/adminService';
import Button from '../../components/Button';
import Loader from '../../components/Loader';

const UsersPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useUI();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isBannedFilter, setIsBannedFilter] = useState(null); // null, true, false
  const [isAdminFilter, setIsAdminFilter] = useState(null); // null, true, false
  
  // Загружаем список пользователей
  useEffect(() => {
const fetchUsers = async () => {
      setLoading(true);
      
      try {
        const data = await adminService.getUsers({
          page: currentPage,
          pageSize: 20,
          searchTerm: searchTerm,
          isBanned: isBannedFilter,
          isAdmin: isAdminFilter
        });
        
        setUsers(data.items || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalItems || 0);
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
    
    fetchUsers();
  }, [currentPage, searchTerm, isBannedFilter, isAdminFilter, showNotification]);
  
  // Обработчик поиска
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  
  // Обработчик блокировки/разблокировки пользователя
  const handleBanToggle = async (userId, isBanned) => {
    try {
      if (isBanned) {
        await adminService.unbanUser(userId, null);
        showNotification({
          type: 'success',
          title: 'Успех',
          message: 'Пользователь разблокирован'
        });
      } else {
        await adminService.banUser(userId, {
          reason: 'Нарушение правил платформы',
          bannedUntil: null
        });
        showNotification({
          type: 'success',
          title: 'Успех',
          message: 'Пользователь заблокирован'
        });
      }
      
      // Обновляем список пользователей
      const data = await adminService.getUsers({
        page: currentPage,
        pageSize: 20,
        searchTerm: searchTerm,
        isBanned: isBannedFilter,
        isAdmin: isAdminFilter
      });
      
      setUsers(data.items || []);
    } catch (err) {
      showNotification({
        type: 'error',
        title: 'Ошибка',
        message: err.message
      });
    }
  };
  
  // Обработчик назначения/отзыва прав администратора
  const handleAdminToggle = async (userId, isAdmin) => {
    try {
      if (isAdmin) {
        await adminService.revokeAdmin(userId, 'Отзыв прав администратора');
        showNotification({
          type: 'success',
          title: 'Успех',
          message: 'Права администратора отозваны'
        });
      } else {
        await adminService.makeAdmin(userId, 'Назначение прав администратора');
        showNotification({
          type: 'success',
          title: 'Успех',
          message: 'Назначены права администратора'
        });
      }
      
      // Обновляем список пользователей
      const data = await adminService.getUsers({
        page: currentPage,
        pageSize: 20,
        searchTerm: searchTerm,
        isBanned: isBannedFilter,
        isAdmin: isAdminFilter
      });
      
      setUsers(data.items || []);
    } catch (err) {
      showNotification({
        type: 'error',
        title: 'Ошибка',
        message: err.message
      });
    }
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
            <h1 className="text-3xl font-bold text-white">Управление пользователями</h1>
            <p className="text-gray-400 mt-2">
              Всего пользователей: {totalCount.toLocaleString()}
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск по имени или email..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full md:w-64 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-500"
              />
              <div className="absolute right-3 top-2.5 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <select
              value={isBannedFilter === null ? "all" : isBannedFilter ? "banned" : "active"}
              onChange={(e) => {
                const value = e.target.value;
                setIsBannedFilter(value === "all" ? null : value === "banned");
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white"
            >
              <option value="all">Все статусы</option>
              <option value="active">Активные</option>
              <option value="banned">Заблокированные</option>
            </select>
            
            <select
              value={isAdminFilter === null ? "all" : isAdminFilter ? "admin" : "user"}
              onChange={(e) => {
                const value = e.target.value;
                setIsAdminFilter(value === "all" ? null : value === "admin");
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white"
            >
              <option value="all">Все роли</option>
              <option value="user">Пользователи</option>
              <option value="admin">Администраторы</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Таблица пользователей */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Пользователь
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Видео
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Дата регистрации
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Статус
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                            {user.avatarUrl ? (
                                <img
                                    src={user.avatarUrl}
                                    alt={user.userName}
                                    className="h-10 w-10 rounded-full object-cover"
                                />
                            ) : (
                                <span className="font-medium text-gray-300">
                                    {user.userName ? user.userName.charAt(0) : '?'}
                                </span>
                            )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div 
                          className="text-sm font-medium text-white cursor-pointer hover:text-blue-400 transition-colors"
                          onClick={() => navigate(`/channel/${user.id}`)}
                        >
                          {user.userName}
                        </div>
                        {user.isAdmin && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900 bg-opacity-50 text-purple-300">
                            Админ
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {user.videoCount?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(user.registrationDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isBanned ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-900 bg-opacity-50 text-red-300">
                        Заблокирован
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900 bg-opacity-50 text-green-300">
                        Активен
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/channel/${user.id}`)}
                      >
                        Канал
                      </Button>
                      <Button
                        variant={user.isBanned ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => handleBanToggle(user.id, user.isBanned)}
                      >
                        {user.isBanned ? 'Разблокировать' : 'Заблокировать'}
                      </Button>
                      {user.isAdmin ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAdminToggle(user.id, true)}
                          disabled={user.id === localStorage.getItem('userId')} // Блокируем кнопку для текущего админа
                        >
                          Отозвать админ права
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAdminToggle(user.id, false)}
                        >
                          Сделать админом
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="bg-gray-900 px-6 py-3 flex items-center justify-between border-t border-gray-800">
            <div className="text-sm text-gray-400">
              Показано {users.length} из {totalCount}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Назад
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Вперед
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;