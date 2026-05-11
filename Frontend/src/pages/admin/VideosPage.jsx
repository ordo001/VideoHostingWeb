import React, { useState, useEffect } from 'react';
import { useUI } from '../../hooks/useUI';
import adminService from '../../services/adminService';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import Modal from '../../components/Modal';

const VideosPage = () => {
  const { showNotification } = useUI();
  
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  
  // Загружаем список видео для модерации
  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      
      try {
        const data = await adminService.getVideosForModeration({
          page: currentPage,
          limit: 20,
          search: searchTerm
        });
        
        setVideos(data.videos || []);
        setTotalPages(data.total_pages || 1);
        setTotalCount(data.total || 0);
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
    
    fetchVideos();
  }, [currentPage, searchTerm, showNotification]);
  
  // Обработчик поиска
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  
  // Обработчик открытия модального окна удаления
  const handleDeleteClick = (video) => {
    setSelectedVideo(video);
    setDeleteReason('');
    setDeleteModalOpen(true);
  };
  
  // Обработчик подтверждения удаления
  const handleConfirmDelete = async () => {
    if (!selectedVideo || !deleteReason.trim()) {
      showNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Укажите причину удаления'
      });
      return;
    }
    
    try {
      await adminService.deleteVideo(selectedVideo.id, deleteReason);
      
      showNotification({
        type: 'success',
        title: 'Успех',
        message: 'Видео успешно удалено'
      });
      
      setDeleteModalOpen(false);
      setSelectedVideo(null);
      setDeleteReason('');
      
      // Обновляем список видео
      const data = await adminService.getVideosForModeration({
        page: currentPage,
        limit: 20,
        search: searchTerm
      });
      
      setVideos(data.videos || []);
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
            <h1 className="text-3xl font-bold text-white">Модерация видео</h1>
            <p className="text-gray-400 mt-2">
              Всего видео: {totalCount.toLocaleString()}
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск по названию..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full md:w-80 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-500"
              />
              <div className="absolute right-3 top-2.5 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Таблица видео */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Видео
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Автор
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Просмотры
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Лайки
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Дата загрузки
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {videos.map((video) => (
                <tr key={video.id} className="hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-16 w-24">
                        <div className="h-16 w-24 rounded-lg bg-gray-800 flex items-center justify-center">
                          {video.thumbnail_url ? (
                            <img 
                              src={video.thumbnail_url} 
                              alt={video.title} 
                              className="h-16 w-24 rounded-lg object-cover"
                            />
                          ) : (
                            <span className="text-gray-500">Видео</span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white line-clamp-2">
                          {video.title}
                        </div>
                        <div className="text-sm text-gray-400">
                          {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center">
                          {video.author?.avatar ? (
                            <img 
                              src={video.author.avatar} 
                              alt={video.author.name} 
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="font-medium text-gray-300 text-xs">
                              {video.author?.name?.charAt(0) || '?'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-2">
                        <div className="text-sm font-medium text-white">
                          {video.author?.name || 'Неизвестный автор'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {video.views?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    <span className="text-red-400">-{video.dislikes?.toLocaleString() || 0}</span> / 
                    <span className="text-green-400">+{video.likes?.toLocaleString() || 0}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(video.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteClick(video)}
                    >
                      Удалить
                    </Button>
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
              Показано {videos.length} из {totalCount}
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
      
      {/* Модальное окно удаления */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Удаление видео"
        size="md"
      >
        {selectedVideo && (
          <div>
            <div className="mb-4">
              <h3 className="font-medium text-white mb-2">Видео:</h3>
              <p className="text-gray-300">{selectedVideo.title}</p>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium text-white mb-2">Автор:</h3>
              <p className="text-gray-300">{selectedVideo.author?.name || 'Неизвестный автор'}</p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Причина удаления <span className="text-red-500">*</span>
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-500"
                placeholder="Укажите причину удаления видео..."
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setDeleteModalOpen(false)}
              >
                Отмена
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                disabled={!deleteReason.trim()}
              >
                Удалить видео
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VideosPage;