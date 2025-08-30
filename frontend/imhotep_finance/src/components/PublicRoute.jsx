//The main purpose of this file is to redirect the authorized uses from this route automatically to there dashboard
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Logo from '../assets/Logo.jpeg';

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen bg-chef-pattern"
        style={{
          background: 'linear-gradient(135deg, #eaf6f6 0%, #d6efee 50%, #1a3535 100%)',
        }}
      >
        {/* Floating decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-20 left-20 w-32 h-32 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"
            style={{ backgroundColor: '#366c6b' }}
          ></div>
          <div
            className="absolute top-40 right-20 w-24 h-24 rounded-full mix-blend-multiply filter blur-xl opacity-18 animate-float"
            style={{ backgroundColor: 'rgba(26,53,53,0.9)', animationDelay: '2s' }}
          ></div>
          <div
            className="absolute bottom-20 left-40 w-40 h-40 rounded-full mix-blend-multiply filter blur-xl opacity-16 animate-float"
            style={{ backgroundColor: '#2f7775', animationDelay: '4s' }}
          ></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div
            className="chef-card rounded-3xl p-8 sm:p-12 shadow-2xl border backdrop-blur-2xl text-center max-w-md w-full"
            style={{
              border: '1px solid rgba(54,108,107,0.14)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(242,251,250,0.9))',
            }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#366c6b] to-[#244746] rounded-full mb-4 shadow-lg border-4 border-white mx-auto">
              <img 
                src={Logo} 
                alt="Logo" 
                className="w-14 h-14 object-contain"
              />
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
            <p className="text-sm mb-2" style={{ color: '#1a3535', opacity: 0.8 }}>
              Manage your finances efficiently with Imhotep Financial Manager
            </p>
            <h2 className="text-2xl font-bold font-chef text-gray-800 mb-3">
              Welcome!
            </h2>
            <p className="text-gray-600 font-medium mb-6">
              Your Financial Manager is starting up...
            </p>
            <div className="flex items-center justify-center space-x-1">
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'linear-gradient(90deg, #366c6b 0%, #1a3535 100%)' }}></div>
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'linear-gradient(90deg, #366c6b 0%, #1a3535 100%)', animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'linear-gradient(90deg, #366c6b 0%, #1a3535 100%)', animationDelay: '0.2s' }}></div>
            </div>
          </div>
          <div className="text-center mt-8 absolute left-0 right-0 bottom-0">
            <p className="text-sm font-medium" style={{ color: '#1a3535', opacity: 0.8 }}>
              📈 Imhotep Finance –  Manage your finances efficiently with Imhotep Financial Manager 📈
            </p>
          </div>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

export default PublicRoute;
