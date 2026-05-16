import React, { useState, useRef } from 'react';
import { useUI } from '../hooks/useUI';
import Loader from './Loader';
import fileService from '../services/fileService';

const ImageUpload = ({
  value,
  onChange,
  uploadType = 'avatar', // 'avatar' или 'banner'
  aspectRatio = 'square', // 'square' или 'banner'
  className = '',
  disabled = false,
  showPreview = true,
}) => {
  const { showNotification } = useUI();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(value || null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Обработка выбора файла
  const handleFileSelect = async (file) => {
    if (!file || disabled) return;
    
    try {
      // Валидация файла с указанием типа загрузки
      fileService.validateImageFile(file, uploadType);
      
      setIsUploading(true);
      
      // Создаем предпросмотр
      if (showPreview) {
        const base64 = await fileService.fileToBase64(file);
        setPreview(base64);
      }
      
      // Загрузка файла на сервер
      let result;
      if (uploadType === 'avatar') {
        result = await fileService.uploadAvatar(file);
      } else if (uploadType === 'banner') {
        result = await fileService.uploadBanner(file);
      } else {
        throw new Error('Неизвестный тип загрузки');
      }
      
      // Обновляем значение в родительском компоненте
      const fileUrl = result.url || result.file_url || result.avatar_url || result.banner_url;
      if (onChange) {
        onChange(fileUrl);
      }
      
      showNotification({
        type: 'success',
        title: 'Успешная загрузка',
        message: 'Изображение успешно загружено'
      });
    } catch (error) {
      console.error('File upload error:', error);
      
      // Возвращаем предыдущее значение предпросмотра в случае ошибки
      setPreview(value || null);
      
      showNotification({
        type: 'error',
        title: 'Ошибка загрузки',
        message: error.message
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Обработка изменения файла через input
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Сбрасываем значение input, чтобы можно было выбрать тот же файл повторно
    event.target.value = '';
  };

  // Обработка перетаскивания файлов
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Открытие файлового диалога
  const openFileDialog = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  // Удаление изображения
  const handleRemoveImage = () => {
    setPreview(null);
    if (onChange) {
      onChange(null);
    }
  };

  // Определение классов в зависимости от типа загрузки
  const containerClasses = `
    ${aspectRatio === 'square' 
      ? 'w-32 h-32' 
      : aspectRatio === 'banner' 
        ? 'w-full h-48' 
        : 'w-full h-full'
    }
    rounded-full overflow-hidden border-2 ${aspectRatio === 'banner' ? 'rounded-lg' : ''}
    ${dragActive ? 'border-primary bg-primary/10' : 'border-gray-700'}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary'}
    relative group transition-all duration-200
    ${className}
  `;

  return (
    <div className={containerClasses}>
      {/* Скрытый input для выбора файла */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
        aria-label="Загрузить изображение"
      />
      
      {/* Область для перетаскивания файла */}
      <div
        className="w-full h-full relative"
        onClick={openFileDialog}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            openFileDialog();
          }
        }}
        aria-label={dragActive ? 'Отпустите файл для загрузки' : 'Нажмите или перетащите файл для загрузки'}
      >
        {/* Предпросмотр изображения */}
        {preview ? (
          <>
            <img 
              src={preview} 
              alt="Предпросмотр" 
              className="w-full h-full object-cover"
            />
            
            {/* Кнопка удаления изображения */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                aria-label="Удалить изображение"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center">
            {isUploading ? (
              <Loader size="sm" />
            ) : (
              <div className="text-center p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-xs text-gray-500">
                  {dragActive ? 'Отпустите файл' : 'Нажмите или перетащите'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  JPG, PNG, GIF, WebP (max {uploadType === 'avatar' ? '5' : '10'}MB)
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Индикатор загрузки */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10 rounded-full">
            <div className="text-center">
              <Loader size="sm" />
              <p className="text-xs text-white mt-2">Загрузка...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;