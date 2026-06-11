import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthModal } from '../hooks/useAuthModal';
import Button from './Button';

const Header = () => {
  const BASE_URL = 'http://localhost:9000';
  const { isAuthenticated, user, logout } = useAuth();
  const { openAuthModal } = useAuthModal();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    navigate('/login');
  };
  
  return (
    <header className="sticky top-0 z-30 bg-black bg-opacity-80 backdrop-blur-sm border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-white">
              Z<span className="text-primary">T</span>ube
            </Link>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-300 hover:text-white transition-colors duration-200">
              Главная
            </Link>
            {isAuthenticated && (
              <Link to="/subscriptions" className="text-gray-300 hover:text-white transition-colors duration-200">
                Подписки
              </Link>
            )}
          </nav>
          
          {/* Search and auth */}
          <div className="flex items-center space-x-4">
            {/* Search button for mobile */}
            <button className="md:hidden text-gray-300 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            
            {/* Search bar for desktop */}
            <div className="hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск..."
                  className="bg-gray-900 text-white rounded-full py-2 px-4 pl-10 w-64 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Auth buttons */}
            <div className="flex items-center space-x-2">
              {isAuthenticated ? (
                <>
                  {user?.isAdmin && (
                    <Link to="/admin">
                      <Button variant="secondary" size="sm">
                        Админка
                      </Button>
                    </Link>
                  )}
                  <Link to="/upload">
                    <Button variant="primary" size="sm">
                      Загрузить
                    </Button>
                  </Link>
                  <div className="relative" ref={dropdownRef}>
                    <button 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center focus:outline-none"
                      aria-haspopup="true"
                      aria-expanded={isDropdownOpen}
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                        {user?.avatar || user?.avatar_url ? (
                          <img
                            src={`${BASE_URL}/${user.avatar}`} 
                            alt={user.name} 
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white text-sm font-medium">
                            {user?.name?.charAt(0) || 'U'}
                          </span>
                        )}
                      </div>
                    </button>
                    
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-1 z-50 border border-gray-700">
                        <Link 
                          to={`/channel/${user?.id || 'me'}`}
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Мой канал
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                        >
                          Выйти
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      Войти
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" size="sm">
                      Регистрация
                    </Button>
                  </Link>
                </>
              )}
              
              {/* User menu button for mobile */}
              <button className="md:hidden text-gray-300 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;