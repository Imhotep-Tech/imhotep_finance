import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing Google authentication...');
  const [isNewUser, setIsNewUser] = useState(false);
  const hasProcessed = useRef(false);

  const googleAuth = async (code) => {
    try {
      const response = await axios.post('/api/auth/google/authenticate/', {
        code,
      });
      
      const { access, refresh, user: userData, is_new_user } = response.data;
      
      return { 
        success: true, 
        isNewUser: is_new_user || false,
        data: { access, refresh, user: userData }
      };
    } catch (error) {
      console.error('Google authentication failed:', error);
      
      let errorMessage = 'Google authentication failed';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  useEffect(() => {
    const handleGoogleCallback = async () => {
      // Prevent multiple executions
      if (hasProcessed.current) return;
      hasProcessed.current = true;
      
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage('Google authentication was cancelled or failed.');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received from Google.');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        const result = await googleAuth(code);
        
        if (result.success) {
          login(result.data);
          setStatus('success');
          setIsNewUser(result.isNewUser);
          if (result.isNewUser) {
            setMessage('Welcome to Imhotep Finance! Your account has been created successfully.');
          } else {
            setMessage('Login successful! Redirecting to dashboard...');
          }
          setTimeout(() => navigate('/dashboard'), 2000);
        } else {
          setStatus('error');
          setMessage(result.error || 'Google authentication failed.');
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (error) {
        setStatus('error');
        setMessage('An unexpected error occurred during authentication.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleGoogleCallback();
  }, [searchParams, login, navigate]);

  // Update color theme for all states
  const getBackgroundGradient = () => {
    switch (status) {
      case 'processing':
        return 'bg-chef-pattern';
      case 'success':
        return 'bg-chef-pattern';
      case 'error':
        return 'bg-chef-pattern';
      default:
        return 'bg-chef-pattern';
    }
  };

  const getBackgroundStyle = () => {
    switch (status) {
      case 'processing':
      case 'success':
        return {
          background: 'linear-gradient(135deg, #eaf6f6 0%, #d6efee 50%, #1a3535 100%)',
        };
      case 'error':
        return {
          background: 'linear-gradient(135deg, #fbeaea 0%, #f7e6e6 50%, #e7caca 100%)',
        };
      default:
        return {};
    }
  };

  const getFloatingElements = () => {
    switch (status) {
      case 'processing':
      case 'success':
        return (
          <>
            <div className="absolute top-20 left-20 w-32 h-32 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ backgroundColor: '#366c6b' }}></div>
            <div className="absolute top-40 right-20 w-24 h-24 rounded-full mix-blend-multiply filter blur-xl opacity-18 animate-float" style={{ backgroundColor: 'rgba(26,53,53,0.9)', animationDelay: '2s' }}></div>
            <div className="absolute bottom-20 left-40 w-40 h-40 rounded-full mix-blend-multiply filter blur-xl opacity-16 animate-float" style={{ backgroundColor: '#2f7775', animationDelay: '4s' }}></div>
          </>
        );
      case 'error':
        return (
          <>
            <div className="absolute top-20 left-20 w-32 h-32 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ backgroundColor: '#e7caca' }}></div>
            <div className="absolute top-40 right-20 w-24 h-24 rounded-full mix-blend-multiply filter blur-xl opacity-18 animate-float" style={{ backgroundColor: '#f7e6e6', animationDelay: '2s' }}></div>
            <div className="absolute bottom-20 left-40 w-40 h-40 rounded-full mix-blend-multiply filter blur-xl opacity-16 animate-float" style={{ backgroundColor: '#fbeaea', animationDelay: '4s' }}></div>
          </>
        );
      default:
        return null;
    }
  };

  // Card background and accent colors
  const getCardStyle = () => {
    switch (status) {
      case 'processing':
      case 'success':
        return {
          border: '1px solid rgba(54,108,107,0.14)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(242,251,250,0.9))',
        };
      case 'error':
        return {
          border: '1px solid #e7caca',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.94), #fbeaea 90%)',
        };
      default:
        return {};
    }
  };

  // Title gradient
  const getTitleStyle = () => {
    switch (status) {
      case 'processing':
      case 'success':
        return {
          letterSpacing: '0.04em',
          lineHeight: '1.1',
          backgroundImage: 'linear-gradient(90deg, #366c6b 0%, #1a3535 100%)',
          textShadow: '0 2px 8px rgba(26,53,53,0.12)',
        };
      case 'error':
        return {
          letterSpacing: '0.04em',
          lineHeight: '1.1',
          backgroundImage: 'linear-gradient(90deg, #c44d4d 0%, #a82e2e 100%)',
          textShadow: '0 2px 8px rgba(196,77,77,0.12)',
        };
      default:
        return {};
    }
  };

  // Subtitle color
  const getSubtitleColor = () => {
    switch (status) {
      case 'processing':
      case 'success':
        return { color: '#1a3535', opacity: 0.8 };
      case 'error':
        return { color: '#a82e2e', opacity: 0.8 };
      default:
        return {};
    }
  };

  // Success button color
  const getSuccessButtonStyle = () => ({
    background: 'linear-gradient(90deg, #366c6b 0%, #1a3535 100%)',
    color: 'white',
  });

  // Error button color
  const getErrorButtonStyle = () => ({
    background: 'linear-gradient(90deg, #c44d4d 0%, #a82e2e 100%)',
    color: 'white',
  });

  const getIcon = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6 shadow-lg border-2 border-gray-100">
            <svg className="animate-spin w-8 h-8" viewBox="0 0 24 24">
              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>
        );
      case 'success':
        return (
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6 shadow-lg animate-pulse-slow">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500 rounded-full mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'processing':
        return 'Connecting with Google...';
      case 'success':
        return isNewUser ? 'Welcome to the Imhotep Finance!' : 'Welcome Back!';
      case 'error':
        return 'Authentication Failed';
      default:
        return '';
    }
  };

  const getSubtitle = () => {
    switch (status) {
      case 'processing':
        return 'Please wait while we securely authenticate you with Google and prepare your chef station...';
      case 'success':
        return isNewUser 
          ? 'Your Google account has been successfully connected and your chef profile has been created. Get ready to start cooking!'
          : 'Successfully authenticated with Google! Redirecting you to your culinary dashboard...';
      case 'error':
        return message;
      default:
        return '';
    }
  };

  const getBottomMessage = () => {
    switch (status) {
      case 'processing':
        return '🔐 Securing your Google connection 🔐';
      case 'success':
        return isNewUser ? '🎉 Your culinary journey begins now! 🎉' : '📈 Ready to create manage your finance! 📈';
      case 'error':
        return '💡 Try logging in with Google again 💡';
      default:
        return '';
    }
  };

  return (
    <div
      className={`min-h-screen ${getBackgroundGradient()} flex items-center justify-center p-4`}
      style={getBackgroundStyle()}
    >
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {getFloatingElements()}
      </div>

      <div className="relative w-full max-w-md">
        {/* Main Authentication Card */}
        <div
          className="chef-card rounded-3xl p-8 shadow-2xl border backdrop-blur-xl text-center"
          style={getCardStyle()}
        >
          {/* Icon */}
          <div className="mb-6">
            {getIcon()}
          </div>
          
          {/* Title */}
          <div
            className="font-extrabold text-3xl sm:text-4xl mb-2 bg-clip-text text-transparent font-chef drop-shadow-lg tracking-wide"
            style={getTitleStyle()}
          >
            Imhotep Finance
          </div>
          <h1 className="text-3xl font-bold font-chef text-gray-800 mb-4">
            {getTitle()}
          </h1>
          
          {/* Subtitle */}
          <p className="font-medium mb-8 leading-relaxed" style={getSubtitleColor()}>
            {getSubtitle()}
          </p>
          
          {/* Loading progress for processing state */}
          {status === 'processing' && (
            <div className="mt-6">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
              </div>
              <p className="text-gray-500 text-sm mt-2">Authenticating with Google...</p>
            </div>
          )}

          {/* Success message for new users */}
          {status === 'success' && isNewUser && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="text-left">
                  <p className="text-green-700 font-medium text-sm">Account Created Successfully!</p>
                </div>
              </div>
            </div>
          )}

          {/* Countdown/redirect info for success state */}
          {status === 'success' && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="text-blue-700 font-medium text-sm">
                  Redirecting to your dashboard...
                </span>
              </div>
            </div>
          )}

          {/* Error state help */}
          {status === 'error' && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="text-left">
                    <p className="text-red-700 font-medium text-sm">Authentication Error</p>
                    <p className="text-red-600 text-sm mt-1">
                      {message}
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm">
                Redirecting you back to the login page to try again...
              </p>
            </div>
          )}

          {/* Google branding notice */}
          <div className="mt-8 pt-4 border-t border-gray-200">
            <p className="text-gray-500 text-xs">
              Powered by Google OAuth 2.0 • Secure Authentication
            </p>
          </div>
        </div>

        {/* Bottom decorative text */}
        <div className="text-center mt-8">
          <p className="text-sm font-medium" style={getSubtitleColor()}>
            {getBottomMessage()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoogleCallback;
