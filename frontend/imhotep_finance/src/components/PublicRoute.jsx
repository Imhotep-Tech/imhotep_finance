//The main purpose of this file is to redirect the authorized uses from this route automatically to there dashboard
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import PharaohfolioLogo from '../assets/PharaohfolioLogo.png';

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 bg-chef-pattern">
        {/* Floating decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-20 left-40 w-40 h-40 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '4s'}}></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="chef-card rounded-3xl p-8 sm:p-12 shadow-2xl border border-white/30 backdrop-blur-2xl bg-white/90 text-center max-w-md w-full">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full mb-4 shadow-lg border-4 border-white mx-auto">
              <img 
                src={PharaohfolioLogo} 
                alt="Pharaohfolio Logo" 
                className="w-14 h-14 object-contain"
              />
            </div>
            <div
              className="font-extrabold text-3xl sm:text-4xl mb-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 bg-clip-text text-transparent font-chef drop-shadow-lg tracking-wide"
              style={{
                letterSpacing: '0.04em',
                lineHeight: '1.1',
                textShadow: '0 2px 8px rgba(124,58,237,0.12)'
              }}
            >
              Pharaohfolio
            </div>
            <p className="text-gray-500 text-sm mb-2">Simple Hosting for Single-Page Portfolios</p>
            <h2 className="text-2xl font-bold font-chef text-gray-800 mb-3">
              Welcome!
            </h2>
            <p className="text-gray-600 font-medium mb-6">
              Your AI-powered portfolio is starting up...
            </p>
            <div className="flex items-center justify-center space-x-1">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
          <div className="text-center mt-8 absolute left-0 right-0 bottom-0">
            <p className="text-gray-500 text-sm font-medium">
              👑 Pharaohfolio – Simple Hosting for Single-Page Portfolios 👑
            </p>
          </div>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

export default PublicRoute;
