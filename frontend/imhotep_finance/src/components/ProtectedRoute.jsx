import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Navbar from './common/Navbar';
import { useState, useEffect } from 'react';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const [navbarOpen, setNavbarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setNavbarOpen(!mobile);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (loading) {
    return (
      <div
        className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors relative"
      >
        {/* Floating decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-32 h-32 rounded-full filter blur-xl opacity-20 animate-float bg-[#366c6b] mix-blend-multiply dark:bg-emerald-600/40 dark:mix-blend-screen"></div>
          <div className="absolute top-40 right-20 w-24 h-24 rounded-full filter blur-xl opacity-18 animate-float bg-[rgba(26,53,53,0.9)] dark:bg-teal-800/40" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-20 left-40 w-40 h-40 rounded-full filter blur-xl opacity-16 animate-float bg-[#2f7775] dark:bg-cyan-700/30 dark:mix-blend-screen" style={{animationDelay: '4s'}}></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div
            className="chef-card rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-2xl text-center max-w-md w-full"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#366c6b] to-[#244746] rounded-full mb-6 shadow-lg border-4 border-white mx-auto">
              <svg className="w-10 h-10 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div
              className="font-extrabold text-3xl sm:text-4xl mb-2 bg-clip-text text-transparent font-chef drop-shadow-lg tracking-wide"
              style={{
                letterSpacing: '0.04em',
                lineHeight: '1.1',
                backgroundImage: 'linear-gradient(90deg, #366c6b 0%, #1a3535 100%)',
                textShadow: '0 2px 8px rgba(26,53,53,0.12)',
              }}
            >
              Imhotep Finance
            </div>
            <p className="text-sm mb-2 text-[#1a3535] dark:text-gray-300 opacity-80">
              Manage your finances efficiently with Imhotep Financial Manager
            </p>
            <h2 className="text-2xl font-bold font-chef text-gray-800 dark:text-gray-100 mb-3">
              Loading your workspace...
            </h2>
            <p className="text-gray-600 dark:text-gray-300 font-medium">
              Please wait while we check your authentication status.
            </p>
            <div className="mt-6 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-[#366c6b] to-[#1a3535] h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
          </div>
          <div className="text-center mt-8 absolute left-0 right-0 bottom-0">
            <p className="text-sm font-medium text-[#1a3535] dark:text-gray-300 opacity-80">
              📈 Imhotep Finance 📈
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div
      className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors"
    >
      <Navbar onToggle={setNavbarOpen} />
      <div
        className={`transition-all duration-300 ease-in-out min-h-screen ${
          !isMobile && navbarOpen ? 'ml-72' : 'ml-0'
        }`}
        style={{
          minHeight: '100vh'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default ProtectedRoute;
