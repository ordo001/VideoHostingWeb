import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import {
  setLoading,
  addNotification,
  removeNotification,
  clearNotifications,
  openModal,
  closeModal,
  toggleTheme,
  setTheme,
  toggleSidebar,
  closeSidebar,
  openSidebar,
} from '../store/uiSlice';

export const useUI = () => {
  const dispatch = useDispatch();
  const {
    isLoading,
    notifications,
    modals,
    theme,
    sidebarOpen,
  } = useSelector(state => state.ui);
  
  // Управление загрузкой
  const setLoadingState = useCallback((loading) => {
    dispatch(setLoading(loading));
  }, [dispatch]);
  
  // Управление уведомлениями
  const showNotification = useCallback((notification) => {
    dispatch(addNotification(notification));
  }, [dispatch]);
  
  const hideNotification = useCallback((id) => {
    dispatch(removeNotification(id));
  }, [dispatch]);
  
  const clearAllNotifications = useCallback(() => {
    dispatch(clearNotifications());
  }, [dispatch]);
  
  // Управление модальными окнами
  const openModalWindow = useCallback((modalName) => {
    dispatch(openModal(modalName));
  }, [dispatch]);
  
  const closeModalWindow = useCallback((modalName) => {
    dispatch(closeModal(modalName));
  }, [dispatch]);
  
  // Управление темой
  const toggleAppTheme = useCallback(() => {
    dispatch(toggleTheme());
  }, [dispatch]);
  
  const setAppTheme = useCallback((theme) => {
    dispatch(setTheme(theme));
  }, [dispatch]);
  
  // Управление боковой панелью
  const toggleAppSidebar = useCallback(() => {
    dispatch(toggleSidebar());
  }, [dispatch]);
  
  const closeAppSidebar = useCallback(() => {
    dispatch(closeSidebar());
  }, [dispatch]);
  
  const openAppSidebar = useCallback(() => {
    dispatch(openSidebar());
  }, [dispatch]);
  
  return {
    // Состояние
    isLoading,
    notifications,
    modals,
    theme,
    sidebarOpen,
    
    // Методы
    setLoading: setLoadingState,
    showNotification,
    hideNotification,
    clearAllNotifications,
    openModal: openModalWindow,
    closeModal: closeModalWindow,
    toggleTheme: toggleAppTheme,
    setTheme: setAppTheme,
    toggleSidebar: toggleAppSidebar,
    closeSidebar: closeAppSidebar,
    openSidebar: openAppSidebar,
  };
};