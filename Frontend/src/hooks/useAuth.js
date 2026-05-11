import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { registerUser, loginUser, logout, clearError, fetchCurrentUser } from '../store/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, loading, error } = useSelector(state => state.auth);
  
  const register = useCallback((userData) => {
    return dispatch(registerUser(userData));
  }, [dispatch]);
  
  const login = useCallback((credentials) => {
    return dispatch(loginUser(credentials));
  }, [dispatch]);
  
  const logoutUser = useCallback(() => {
    return dispatch(logout());
  }, [dispatch]);
  
  const clearAuthError = useCallback(() => {
    return dispatch(clearError());
  }, [dispatch]);
  
  const getCurrentUser = useCallback(() => {
    return dispatch(fetchCurrentUser());
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