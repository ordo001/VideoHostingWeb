import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../hooks/useUI';
import Input from '../components/Input';
import Button from '../components/Button';
import Loader from '../components/Loader';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const { showNotification } = useUI();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен для заполнения';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Некорректный формат email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Пароль обязателен для заполнения';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await login({
        email: formData.email,
        password: formData.password
      });
      
      showNotification({
        type: 'success',
        title: 'Вход выполнен',
        message: 'Добро пожаловать обратно!'
      });
      
      // Перенаправляем на главную страницу
      navigate('/');
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Ошибка входа',
        message: error.message
      });
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Вход в аккаунт
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Нет аккаунта?{' '}
            <Link to="/register" className="font-medium text-primary hover:text-blue-400">
              Зарегистрируйтесь здесь
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <Input
              id="email"
              name="email"
              type="email"
              label="Email"
              placeholder="your@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />
            
            <Input
              id="password"
              name="password"
              type="password"
              label="Пароль"
              placeholder="Введите пароль"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-primary hover:text-blue-400">
                Забыли пароль?
              </Link>
            </div>
          </div>
          
          <div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader size="sm" className="mr-2" />
                  Вход...
                </div>
              ) : (
                'Войти'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;