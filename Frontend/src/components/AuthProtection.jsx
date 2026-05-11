import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAuthModal } from '../hooks/useAuthModal'
import Button from './Button'

/**
 * HOC для защиты функций, требующих авторизации
 * Показывает модальное окно авторизации при клике, если пользователь не авторизован
 */
export const withAuthProtection = (Component) => {
  return ({ 
    onAction, 
    authMessage = 'Войдите в аккаунт, чтобы выполнить это действие',
    ...props 
  }) => {
    const { isAuthenticated } = useAuth()
    const { openAuthModal } = useAuthModal()
    
    const handleClick = () => {
      if (isAuthenticated) {
        // Если пользователь авторизован, выполняем действие
        if (onAction) onAction()
      } else {
        // Если не авторизован, открываем модальное окно
        openAuthModal()
      }
    }
    
    // Если это кнопка, добавляем обработчик клика
    if (Component === Button) {
      return <Component {...props} onClick={handleClick} />
    }
    
    // Для других компонентов оборачиваем их в div с обработчиком
    return (
      <div onClick={handleClick}>
        <Component {...props} />
      </div>
    )
  }
}

/**
 * Компонент-обертка для защиты контента
 * Показывает fallback для неавторизованных пользователей
 */
export const ProtectedContent = ({ 
  children, 
  fallback = null, 
  showAuthButton = false,
  authMessage = 'Войдите в аккаунт, чтобы увидеть этот контент',
  ...props 
}) => {
  const { isAuthenticated } = useAuth()
  const { openAuthModal } = useAuthModal()
  
  if (isAuthenticated) {
    return <>{children}</>
  }
  
  // Если предусмотрен fallback, показываем его
  if (fallback) {
    return <>{fallback}</>
  }
  
  // Показываем сообщение и кнопку входа
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-900 rounded-2xl text-center" {...props}>
      <div className="mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-gray-400 mb-2">{authMessage}</p>
      </div>
      
      {showAuthButton && (
        <Button variant="primary" onClick={() => openAuthModal()}>
          Войти в аккаунт
        </Button>
      )}
    </div>
  )
}

/**
 * HOC для защиты маршрутов
 */
export const withAuthGuard = (Component, redirectPath = null) => {
  return (props) => {
    const { isAuthenticated } = useAuth()
    const { openAuthModal } = useAuthModal()
    
    const handleAttemptAccess = () => {
      if (!isAuthenticated) {
        openAuthModal(redirectPath || window.location.pathname)
        return false
      }
      return true
    }
    
    // В реальном приложении здесь может быть перенаправление на страницу входа
    // Но в нашем случае мы просто показываем модальное окно
    if (!isAuthenticated) {
      // Проверяем, были ли уже попытки доступа
      if (typeof window !== 'undefined' && !window.authModalShown) {
        window.authModalShown = true
        openAuthModal(redirectPath || window.location.pathname)
      }
      
      // Показываем заглушку или пустую страницу
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-gray-400 mb-4">Требуется авторизация</p>
            <Button variant="primary" onClick={() => openAuthModal()}>
              Войти в аккаунт
            </Button>
          </div>
        </div>
      )
    }
    
    return <Component {...props} onAuthRequired={handleAttemptAccess} />
  }
}

/**
 * Кастомный хук для проверки авторизации
 */
export const useAuthRequired = () => {
  const { isAuthenticated } = useAuth()
  const { openAuthModal } = useAuthModal()
  
  const requireAuth = useCallback((callback, path = null) => {
    if (isAuthenticated) {
      callback()
    } else {
      openAuthModal(path)
    }
  }, [isAuthenticated, openAuthModal])
  
  return { requireAuth, isAuthorized: isAuthenticated }
}