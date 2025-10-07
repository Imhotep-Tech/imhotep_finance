import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import Logo from '../../assets/Logo.jpeg';
import axios from 'axios';
import ThemeToggle from './ThemeToggle';

const Navbar = ({ onToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      const shouldBeOpen = !mobile;
      setIsOpen(shouldBeOpen);
      if (onToggle) onToggle(shouldBeOpen);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [onToggle]);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const toggleNavbar = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onToggle) onToggle(newState);
  };

  const closeNavbar = () => {
    if (isMobile) {
      setIsOpen(false);
      if (onToggle) onToggle(false);
    }
  };

  return (
    <>
      {/* Floating decorative elements - visible when navbar is open */}
      {isOpen && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-20 left-20 w-32 h-32 rounded-full filter blur-xl opacity-20 animate-float bg-[#366c6b] mix-blend-multiply dark:bg-emerald-600/40 dark:mix-blend-screen"></div>
          <div className="absolute top-40 right-20 w-24 h-24 rounded-full filter blur-xl opacity-20 animate-float bg-[#1a3535]" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-20 left-40 w-40 h-40 rounded-full filter blur-xl opacity-20 animate-float bg-blue-200 dark:bg-cyan-700/30 dark:mix-blend-screen" style={{animationDelay: '4s'}}></div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        className="fixed top-4 left-4 z-50 w-12 h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/30 dark:border-gray-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
        onClick={toggleNavbar}
        aria-label="Toggle navigation"
        title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <svg 
          className={`w-6 h-6 text-gray-700 dark:text-gray-200 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} group-hover:text-[#366c6b]`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Theme toggle - top right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Navbar Container */}
      <nav className={`fixed left-0 top-0 h-full z-40 transition-all duration-300 ${
        isMobile 
          ? (isOpen ? 'translate-x-0' : '-translate-x-full') 
          : (isOpen ? 'translate-x-0' : '-translate-x-64')
      }`}>
        <div className="h-full w-64 bg-gradient-to-b from-white/95 via-white/90 to-white/95 dark:from-gray-950/90 dark:via-gray-900/90 dark:to-gray-950/90 backdrop-blur-2xl border-r border-white/30 dark:border-gray-800 shadow-2xl">
          <div className="flex flex-col h-full">
            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 p-6">
              {/* Logo/Brand Section */}
              <div className="mb-8 pt-12">
                <div className="flex items-center justify-center mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#366c6b] to-[#1a3535] rounded-full shadow-lg border-4 border-white">
                    <img 
                      src={Logo} 
                      alt="Logo" 
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                </div>
                <div
                  className="font-extrabold text-2xl sm:text-3xl mb-2 bg-gradient-to-r from-[#366c6b] via-[#1a3535] to-[#366c6b] bg-clip-text text-transparent font-chef drop-shadow-lg tracking-wide text-center"
                  style={{
                    letterSpacing: '0.04em',
                    lineHeight: '1.1',
                    textShadow: '0 2px 8px rgba(124,58,237,0.12)'
                  }}
                >
                  Imhotep Finance
                </div>
              </div>

              {/* User Info Card */}
              <div className="mb-8">
                <div className="chef-card rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#366c6b] to-[#1a3535] rounded-xl shadow-md flex items-center justify-center text-white font-bold text-lg">
                      {user?.first_name ? user.first_name.charAt(0).toUpperCase() : user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 dark:text-gray-100 font-semibold text-sm truncate">
                        {user?.first_name && user?.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : user?.username || 'User'
                        }
                      </p>
                      <p className="text-gray-600 dark:text-gray-300 text-xs truncate">{user?.email}</p>
                    </div>
                  </div>
                  {!user?.email_verify && (
                    <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950/40 dark:border-amber-900">
                      <span className="text-amber-700 dark:text-amber-300 text-xs font-medium flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Email not verified
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Links */}
              <div className="space-y-2 mb-8">
                <Link 
                  to="/dashboard" 
                  className={`navbar-link group flex items-center p-4 rounded-2xl transition-all duration-300 ${
                    isActive('/dashboard') 
                      ? 'bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white shadow-lg transform scale-105' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-gray-800/60 hover:shadow-md hover:scale-105'
                  }`}
                  onClick={closeNavbar}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 transition-colors duration-300 ${
                    isActive('/dashboard') 
                      ? 'bg-white/20' 
                      : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-[#eaf6f6] group-hover:dark:bg-gray-700'
                  }`}>
                    <svg className={`w-5 h-5 ${isActive('/dashboard') ? 'text-white' : 'text-[#366c6b]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <span className="font-semibold">Dashboard</span>
                </Link>

                <Link 
                  to="/show_trans"
                  className={`navbar-link group flex items-center p-4 rounded-2xl transition-all duration-300 ${
                    isActive('/show_trans') 
                      ? 'bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white shadow-lg transform scale-105' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-gray-800/60 hover:shadow-md hover:scale-105'
                  }`}
                  onClick={closeNavbar}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 transition-colors duration-300 ${
                    isActive('/show_trans') 
                      ? 'bg-white/20' 
                      : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-[#eaf6f6] group-hover:dark:bg-gray-700'
                  }`}>
                    <svg className={`w-5 h-5 ${isActive('/show_trans') ? 'text-white' : 'text-[#366c6b]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13h2v7H3zM7 9h2v11H7zM11 5h2v15h-2zM15 11h2v9h-2zM19 7h2v13h-2z"/>
                    </svg>
                  </div>
                  <span className="font-semibold">Transactions</span>
                </Link>

                <Link 
                  to="/show_scheduled_trans"
                  className={`navbar-link group flex items-center p-4 rounded-2xl transition-all duration-300 ${
                    isActive('/show_scheduled_trans') 
                      ? 'bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white shadow-lg transform scale-105' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-gray-800/60 hover:shadow-md hover:scale-105'
                  }`}
                  onClick={closeNavbar}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 transition-colors duration-300 ${
                    isActive('/show_scheduled_trans') 
                      ? 'bg-white/20' 
                      : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-[#eaf6f6] group-hover:dark:bg-gray-700'
                  }`}>
                    <svg className={`w-5 h-5 ${isActive('/show_scheduled_trans') ? 'text-white' : 'text-[#366c6b]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="font-semibold">Scheduled</span>
                </Link>

                <Link 
                  to="/wishlist"
                  className={`navbar-link group flex items-center p-4 rounded-2xl transition-all duration-300 ${
                    isActive('/wishlist') 
                      ? 'bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white shadow-lg transform scale-105' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-gray-800/60 hover:shadow-md hover:scale-105'
                  }`}
                  onClick={closeNavbar}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 transition-colors duration-300 ${
                    isActive('/wishlist') 
                      ? 'bg-white/20' 
                      : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-[#eaf6f6] group-hover:dark:bg-gray-700'
                  }`}>
                    {/* Wishlist Heart Icon */}
                    <svg className={`w-5 h-5 ${isActive('/wishlist') ? 'text-white' : 'text-[#366c6b]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                    </svg>
                  </div>
                  <span className="font-semibold">Wishlist</span>
                </Link>
                  
                <Link 
                  to="/reports" 
                  className={`navbar-link group flex items-center p-4 rounded-2xl transition-all duration-300 ${
                    isActive('/reports') 
                      ? 'bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white shadow-lg transform scale-105' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-gray-800/60 hover:shadow-md hover:scale-105'
                  }`}
                  onClick={closeNavbar}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 transition-colors duration-300 ${
                    isActive('/reports') 
                      ? 'bg-white/20' 
                      : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-[#eaf6f6] group-hover:dark:bg-gray-700'
                  }`}>
                    <svg className={`w-5 h-5 ${isActive('/reports') ? 'text-white' : 'text-[#366c6b]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="font-semibold">Reports</span>
                </Link>

                <Link 
                  to="/profile" 
                  className={`navbar-link group flex items-center p-4 rounded-2xl transition-all duration-300 ${
                    isActive('/profile') 
                      ? 'bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white shadow-lg transform scale-105' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-gray-800/60 hover:shadow-md hover:scale-105'
                  }`}
                  onClick={closeNavbar}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 transition-colors duration-300 ${
                    isActive('/profile') 
                      ? 'bg-white/20' 
                      : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-[#eaf6f6] group-hover:dark:bg-gray-700'
                  }`}>
                    <svg className={`w-5 h-5 ${isActive('/profile') ? 'text-white' : 'text-[#366c6b]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="font-semibold">Profile</span>
                </Link>
                
              </div>
            </div>

            {/* Fixed Bottom Section - Logout Button and Footer */}
            <div className="flex-shrink-0 border-t border-gray-200/50 dark:border-gray-800 p-6 bg-gradient-to-t from-white/95 to-transparent dark:from-gray-950/90 dark:to-transparent">
              <button
                onClick={handleLogout}
                className="w-full group flex items-center p-4 rounded-2xl text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 hover:shadow-md transition-all duration-300 hover:scale-105 mb-4"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 flex items-center justify-center mr-3 transition-colors duration-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <span className="font-semibold">Logout</span>
              </button>
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                  📈 Imhotep Finance –  Manage your finances efficiently 📈
                </p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay for mobile only */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 transition-opacity duration-300" 
          onClick={closeNavbar}
        ></div>
      )}
    </>
  );
};

export default Navbar;