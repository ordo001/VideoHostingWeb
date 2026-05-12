import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useUI } from '../hooks/useUI'
import Button from './Button'
import Input from './Input'

const AuthModal = ({ isOpen, onClose, redirectTo }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const { login, register, loading, error, clearError } = useAuth()
  const navigate = useNavigate()
  const { showNotification } = useUI()

  // Сброс формы при переключении между авторизацией и регистрацией
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      })
      setErrors({})
      clearError()
    }
  }, [isLogin, isOpen, clearError])

  // Обработчик изменения полей формы
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Сбрасываем ошибку для поля при изменении
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  // Валидация формы
  const validateForm = () => {
    const newErrors = {}
    
    // Валидация email
    if (!formData.email.trim()) {
      newErrors.email = 'Email не может быть пустым'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Некорректный формат email'
    }
    
    // Валидация пароля
    if (!formData.password.trim()) {
      newErrors.password = 'Пароль не может быть пустым'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов'
    }
    
    // Дополнительная валидация для регистрации
    if (!isLogin) {
      if (!formData.name.trim()) {
        newErrors.name = 'Имя не может быть пустым'
      } else if (formData.name.length < 2) {
        newErrors.name = 'Имя должно содержать минимум 2 символа'
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Пароли не совпадают'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      if (isLogin) {
        await login({
          email: formData.email,
          password: formData.password
        })
        
        showNotification({
          type: 'success',
          title: 'Вход выполнен',
          message: 'Добро пожаловать в ZTube!'
        })
      } else {
        await register({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
        
        showNotification({
          type: 'success',
          title: 'Регистрация успешна',
          message: 'Добро пожаловать в ZTube!'
        })
      }
      
      // Закрываем модальное окно
      onClose()
      
      // Перенаправляем пользователя если указан путь, иначе на главную
      if (redirectTo) {
        navigate(redirectTo)
      } else {
        navigate('/')
      }
    } catch (err) {
      showNotification({
        type: 'error',
        title: 'Ошибка',
        message: err.message || 'Произошла ошибка при авторизации'
      })
    }
  }

  const toggleAuthMode = () => {
    setIsLogin(prev => !prev)
    clearError()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Фон */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-75"
            onClick={onClose}
          />
          
          {/* Модальное окно */}
          <div className="relative flex items-center justify-center min-h-full p-4">
            <motion.div
              className="relative bg-gray-900 rounded-2xl max-w-md w-full p-6 md:p-8"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Кнопка закрытия */}
              <button 
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
                onClick={onClose}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Заголовок */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {isLogin ? 'Вход в аккаунт' : 'Регистрация'}
                </h2>
                <p className="text-gray-400 mt-2">
                  {isLogin 
                    ? 'Войдите, чтобы получить доступ ко всем функциям' 
                    : 'Создайте аккаунт, чтобы загрузить видео и оставлять комментарии'
                  }
                </p>
              </div>
              
              {/* Форма */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Поле имени (только для регистрации) */}
                {!isLogin && (
                  <div>
                    <Input
                      label="Имя"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      error={errors.name}
                      placeholder="Введите ваше имя"
                      required
                    />
                  </div>
                )}
                
                {/* Поле email */}
                <div>
                  <Input
                    label="Email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    placeholder="example@mail.com"
                    required
                    autoComplete={isLogin ? "username" : "email"}
                  />
                </div>
                
                {/* Поле пароля */}
                <div>
                  <Input
                    label="Пароль"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    placeholder="Минимум 6 символов"
                    required
                    autoComplete={isLogin ? "current-password" : "new-password"}
                  />
                </div>
                
                {/* Поле подтверждения пароля (только для регистрации) */}
                {!isLogin && (
                  <div>
                    <Input
                      label="Подтверждение пароля"
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      error={errors.confirmPassword}
                      placeholder="Повторите пароль"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                )}
                
                {/* Кнопка отправки */}
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="lg" 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
                </Button>
              </form>
              
              {/* Переключение между авторизацией и регистрацией */}
              <div className="mt-6 text-center">
                <p className="text-gray-400">
                  {isLogin ? 'Еще нет аккаунта?' : 'Уже есть аккаунт?'}
                  <button 
                    type="button"
                    className="ml-1 text-primary hover:underline focus:outline-none"
                    onClick={toggleAuthMode}
                  >
                    {isLogin ? 'Зарегистрироваться' : 'Войти'}
                  </button>
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AuthModal