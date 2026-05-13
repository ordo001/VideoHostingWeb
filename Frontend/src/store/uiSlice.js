import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    // Состояние загрузки
    isLoading: false,
    
    // Уведомления
    notifications: [],
    
    // Модальные окна
    modals: {
      auth: false,
      videoUpload: false,
      share: false,
    },
    
    // Тема приложения
    theme: 'dark', // 'light' | 'dark'
    
    // Состояние боковой панели
    sidebarOpen: false,
  },
  reducers: {
    // Управление загрузкой
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    
    // Управление уведомлениями
    addNotification: (state, action) => {
      const notification = {
        id: Date.now(),
        ...action.payload,
      };
      state.notifications.push(notification);
    },
    
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // Управление модальными окнами
    openModal: (state, action) => {
      const modalName = action.payload;
      state.modals[modalName] = true;
    },
    
    closeModal: (state, action) => {
      const modalName = action.payload;
      state.modals[modalName] = false;
    },
    
    // Управление темой
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
    
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    
    // Управление боковой панелью
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    
    closeSidebar: (state) => {
      state.sidebarOpen = false;
    },
    
    openSidebar: (state) => {
      state.sidebarOpen = true;
    },
  },
});

export const {
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
} = uiSlice.actions;

export default uiSlice.reducer;