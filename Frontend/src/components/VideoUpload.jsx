import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../hooks/useUI';
import videoService from '../services/videoService';
import Button from './Button';
import Loader from './Loader';

const VideoUpload = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { showNotification } = useUI();
  const fileInputRef = useRef(null);
  
  const [currentStep, setCurrentStep] = useState(1); // 1: файл, 2: миниатюра, 3: метаданные
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Данные видео
  const [videoData, setVideoData] = useState({
    videoFile: null,
    thumbnailFile: null,
    title: '',
    description: '',
  });
  
  // Ошибки валидации
  const [errors, setErrors] = useState({});
  
  // Обработка выбора видео файла
  const handleVideoFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Проверка типа файла
    if (!file.type.startsWith('video/')) {
      showNotification({
        type: 'error',
        title: 'Некорректный файл',
        message: 'Пожалуйста, выберите видео файл'
      });
      return;
    }
    
    // Проверка размера файла (максимум 10GB)
    if (file.size > 10 * 1024 * 1024 * 1024) {
      showNotification({
        type: 'error',
        title: 'Файл слишком большой',
        message: 'Максимальный размер видео 10GB'
      });
      return;
    }
    
    setVideoData(prev => ({
      ...prev,
      videoFile: file
    }));
    
    // Автоматически генерируем название из имени файла
    const title = file.name.replace(/\.[^/.]+$/, ""); // Убираем расширение
    setVideoData(prev => ({
      ...prev,
      title: title
    }));
    
    setCurrentStep(2);
  };
  
  // Обработка выбора миниатюры
  const handleThumbnailSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      showNotification({
        type: 'error',
        title: 'Некорректный файл',
        message: 'Пожалуйста, выберите изображение'
      });
      return;
    }
    
    // Проверка размера файла (максимум 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showNotification({
        type: 'error',
        title: 'Файл слишком большой',
        message: 'Максимальный размер изображения 2MB'
      });
      return;
    }
    
    setVideoData(prev => ({
      ...prev,
      thumbnailFile: file
    }));
  };
  
  // Обработка изменения полей ввода
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVideoData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Очищаем ошибки при вводе
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Валидация формы
  const validateForm = () => {
    const newErrors = {};
    
    if (!videoData.videoFile) {
      newErrors.videoFile = 'Выберите видео файл';
    }
    
    if (!videoData.title.trim()) {
      newErrors.title = 'Введите название видео';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Загрузка видео
  const handleUpload = async () => {
    if (!validateForm()) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('video_file', videoData.videoFile);
      
      if (videoData.thumbnailFile) {
        formData.append('thumbnail_file', videoData.thumbnailFile);
      }
      
      formData.append('title', videoData.title);
      formData.append('description', videoData.description);
      // Все видео в системе являются публичными по умолчанию
      
      const response = await videoService.uploadVideo(
        formData,
        (progress) => {
          setUploadProgress(progress);
        }
      );
      
      showNotification({
        type: 'success',
        title: 'Видео загружено',
        message: 'Видео успешно загружено и находится в обработке'
      });
      
      // Вызываем callback при успешной загрузке
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Ошибка загрузки',
        message: error.message
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Переход к следующему шагу
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  // Переход к предыдущему шагу
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Загрузка видео</h2>
        <p className="text-gray-400">Следуйте инструкциям для загрузки вашего видео</p>
      </div>
      
      {/* Индикатор прогресса */}
      <div className="mb-8">
        <div className="flex justify-between mb-2 relative px-8">
          <div className="absolute top-4 left-4 right-4 h-1 bg-gray-800"></div>
          <div 
            className={`absolute top-4 left-4 h-1 transition-all duration-300 ease-out ${
              currentStep === 2 ? 'w-[calc(50%-2rem)]' : 
              currentStep === 3 ? 'w-[calc(100%-4rem)]' : 'w-0'
            } ${currentStep > 1 ? 'bg-primary' : ''}`}
          ></div>
          {[1, 2, 3].map(step => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 ${
                currentStep >= step ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400'
              }`}>
                {step}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-gray-400 px-8">
          <span>Файл</span>
          <span>Миниатюра</span>
          <span>Информация</span>
        </div>
      </div>
      
      {/* Шаг 1: Выбор видео файла */}
      {currentStep === 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div 
            className="border-2 border-dashed border-gray-700 rounded-2xl p-8 cursor-pointer hover:border-primary transition-colors duration-200"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Выберите видео для загрузки</h3>
            <p className="text-gray-400 mb-4">Перетащите файл сюда или нажмите для выбора</p>
            <p className="text-sm text-gray-500">MP4, MOV, AVI до 10GB</p>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="video/*"
            onChange={handleVideoFileSelect}
          />
        </motion.div>
      )}
      
      {/* Шаг 2: Загрузка миниатюры */}
      {currentStep === 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-4">Выберите миниатюру</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Предпросмотр видео */}
              <div>
                <h4 className="text-gray-400 text-sm mb-2">Предпросмотр видео</h4>
                <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">{videoData.videoFile?.name}</p>
                  </div>
                </div>
              </div>
              
              {/* Загрузка миниатюры */}
              <div>
                <h4 className="text-gray-400 text-sm mb-2">Миниатюра</h4>
                <div 
                  className="border-2 border-dashed border-gray-700 rounded-lg p-6 cursor-pointer hover:border-primary transition-colors duration-200 h-full flex flex-col items-center justify-center"
                  onClick={() => document.getElementById('thumbnail-input')?.click()}
                >
                  {videoData.thumbnailFile ? (
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-lg bg-gray-800 flex items-center justify-center mx-auto mb-2 overflow-hidden">
                        <img 
                          src={URL.createObjectURL(videoData.thumbnailFile)} 
                          alt="Thumbnail" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-gray-400 text-sm truncate max-w-full">
                        {videoData.thumbnailFile.name}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-400 text-sm">Выберите изображение</p>
                    </>
                  )}
                </div>
                <input
                  id="thumbnail-input"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleThumbnailSelect}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button variant="secondary" onClick={prevStep}>
              Назад
            </Button>
            <Button variant="primary" onClick={nextStep}>
              Далее
            </Button>
          </div>
        </motion.div>
      )}
      
      {/* Шаг 3: Метаданные видео и загрузка */}
      {currentStep === 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-4">Информация о видео</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Название <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={videoData.title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 bg-gray-900 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Введите название видео"
                />
                {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Описание
                </label>
                <textarea
                  name="description"
                  value={videoData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-500"
                  placeholder="Опишите ваше видео"
                />
              </div>
            </div>
          </div>
          
          {isUploading ? (
            <div className="py-8 text-center">
              <Loader size="lg" className="mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Загрузка видео</h3>
              <p className="text-gray-400 mb-4">Пожалуйста, подождите, это может занять несколько минут</p>
              <div className="w-full bg-gray-800 rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-400 mt-2">{uploadProgress}%</p>
            </div>
          ) : (
            <div className="flex justify-between">
              <Button variant="secondary" onClick={prevStep}>
                Назад
              </Button>
              <Button variant="primary" onClick={handleUpload}>
                Загрузить видео
              </Button>
            </div>
          )}
        </motion.div>
      )}
      
      {/* Кнопка отмены */}
      <div className="mt-6 text-center">
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
        >
          Отмена
        </button>
      </div>
    </div>
  );
};

export default VideoUpload;