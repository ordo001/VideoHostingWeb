import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { registerUser, loginUser, logout, clearError, fetchCurrentUser } from '../store/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, loading, error } = useSelector(state => state.auth);
  
  const register = useCallback(async (userData) => {
    const result = await dispatch(registerUser(userData));
    if (registerUser.fulfilled.match(result)) {
      return result.payload;
    } else {
      throw new Error(result.payload || 'Ошибка регистрации');
    }
  }, [dispatch]);
  
  const login = useCallback(async (credentials) => {
    const result = await dispatch(loginUser(credentials));
    if (loginUser.fulfilled.match(result)) {
      return result.payload;
    } else {
      throw new Error(result.payload || 'Ошибка входа');
    }
  }, [dispatch]);
  
  const logoutUser = useCallback(() => {
    return dispatch(logout());
  }, [dispatch]);
  
  const clearAuthError = useCallback(() => {
    return dispatch(clearError());
  }, [dispatch]);
  
  const getCurrentUser = useCallback(async () => {
    const result = await dispatch(fetchCurrentUser());
    if (fetchCurrentUser.fulfilled.match(result)) {
      return result.payload;
    } else {
      throw new Error(result.payload || 'Ошибка получения данных пользователя');
    }
  }, [dispatch]);
  
  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    register,
    login,
    logout: logoutUser,
    clearError: clearAuthError,
    getCurrentUser,
  };
};