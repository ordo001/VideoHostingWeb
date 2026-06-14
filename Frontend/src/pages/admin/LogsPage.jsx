import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUI } from '../../hooks/useUI';
import adminService from '../../services/adminService';
import Button from '../../components/Button';
import Loader from '../../components/Loader';

const LogsPage = () => {
  const { showNotification } = useUI();

  const [logs, setLogs] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimeoutRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [adminId, setAdminId] = useState('');
  const [debouncedAdminId, setDebouncedAdminId] = useState('');
  const adminIdTimeoutRef = useRef(null);

  // Загружаем логи администраторов
  const fetchLogs = useCallback(async () => {
    const isLoading = initialLoading;
    if (isLoading) {
      setInitialLoading(true);
    } else {
      setFetching(true);
    }

    try {
      const data = await adminService.getAdminLogs({
        page: currentPage,
        pageSize: 20,
        searchTerm: debouncedSearch,
        actionType: filter !== 'All' ? filter : undefined,
        dateFrom: dateFrom ? new Date(dateFrom).toISOString() : null,
        dateTo: dateTo ? new Date(dateTo + 'T23:59:59').toISOString() : null,
        adminId: debouncedAdminId || null
      });

      setLogs(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalItems || 0);
    } catch (err) {
      showNotification({
        type: 'error',
        title: 'Ошибка загрузки',
        message: err.message
      });
    } finally {
      if (isLoading) {
        setInitialLoading(false);
      } else {
        setFetching(false);
      }
    }
  }, [currentPage, debouncedSearch, filter, dateFrom, dateTo, debouncedAdminId, showNotification, initialLoading]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Debounce search term
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Debounce adminId
  useEffect(() => {
    if (adminIdTimeoutRef.current) {
      clearTimeout(adminIdTimeoutRef.current);
    }
    adminIdTimeoutRef.current = setTimeout(() => {
      setDebouncedAdminId(adminId);
    }, 300);

    return () => {
      if (adminIdTimeoutRef.current) {
        clearTimeout(adminIdTimeoutRef.current);
      }
    };
  }, [adminId]);

  if (initialLoading) {
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
            <h1 className="text-3xl font-bold text-white">Логи администраторов</h1>
            <p className="text-gray-400 mt-2">
              Всего записей: {totalCount.toLocaleString()}
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск по действию..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-500"
              />
              <div className="absolute right-3 top-2.5 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white"
            >
              <option value="All">Все действия</option>
              <option value="User">Пользователи</option>
              <option value="Video">Видео</option>
              <option value="Admin">Администрирование</option>
            </select>

            <input
              type="text"
              value={adminId}
              onChange={(e) => {
                setAdminId(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-500 w-40"
              placeholder="ID админа"
            />

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white"
            />

            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white"
            />
          </div>
        </div>
      </div>

      {/* Таблица логов */}
      <div className="relative bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {fetching && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-10 rounded-2xl">
            <Loader size="md" />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-48">
                  Администратор
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-48">
                  Действие
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-32">
                  Объект
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Причина
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-44">
                  Дата
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                            {log.adminAvatarUrl ? (
                                <img
                                    src={`http://localhost:9000/${log.adminAvatarUrl}`}
                                    alt={log.adminName}
                                    className="h-10 w-10 rounded-full object-cover"
                                />
                            ) : (
                                <span className="font-medium text-gray-300">
                                    {log.adminName?.charAt(0) || '?'}
                                </span>
                            )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">
                          {log.adminName || 'Неизвестный админ'}
                        </div>
                        <div className="text-sm text-gray-400">
                          ID: {log.adminId?.toString().substring(0, 8) || 'Неизвестен'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      {log.action}
                    </div>
                    <div className="text-sm text-gray-400">
                      {log.actionType}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-400">
                      {log.targetType}: {log.targetId ? log.targetId.toString().substring(0, 8) + '...' : 'Нет'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {log.reason || log.details || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(log.timestamp).toLocaleString()}
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
              Показано {logs.length} из {totalCount}
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

export default LogsPage;
