import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Logo from '../../assets/Logo.jpeg';

const EmailVerification = () => {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.post('/api/auth/verify-email/', {
          uid,
          token,
        });
        setStatus('success');
        setMessage('Your email has been verified successfully!');
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              navigate('/login', { 
                state: { message: 'Email verified! You can now log in.' }
              });
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        return () => clearInterval(timer);
      } catch (error) {
        setStatus('error');
        setMessage(
          error.response?.data?.error || 
          'The verification link is invalid or has expired.'
        );
      }
    };

    if (uid && token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('Invalid verification link.');
    }
  }, [uid, token, navigate]);

  // Theme helpers
  const getBackgroundStyle = (status) => {
    switch (status) {
      case 'verifying':
      case 'success':
        return { background: 'linear-gradient(135deg, #eaf6f6 0%, #d6efee 50%, #1a3535 100%)' };
      case 'error':
        return { background: 'linear-gradient(135deg, #fbeaea 0%, #f7e6e6 50%, #e7caca 100%)' };
      default:
        return {};
    }
  };

  const getFloatingElements = (status) => {
    switch (status) {
      case 'verifying':
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

  const getCardStyle = (status) => {
    switch (status) {
      case 'verifying':
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

  const getTitleStyle = (status) => {
    switch (status) {
      case 'verifying':
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

  const getSubtitleColor = (status) => {
    switch (status) {
      case 'verifying':
      case 'success':
        return { color: '#1a3535', opacity: 0.8 };
      case 'error':
        return { color: '#a82e2e', opacity: 0.8 };
      default:
        return {};
    }
  };

  const getButtonStyle = (status) => {
    switch (status) {
      case 'success':
        return {
          background: 'linear-gradient(90deg, #366c6b 0%, #1a3535 100%)',
          color: 'white',
        };
      case 'error':
        return {
          background: 'linear-gradient(90deg, #c44d4d 0%, #a82e2e 100%)',
          color: 'white',
        };
      default:
        return {};
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#366c6b] to-[#244746] rounded-full mb-6 shadow-lg border-4 border-white">
            <svg className="animate-spin w-10 h-10 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
      case 'verifying':
        return 'Verifying Your Email...';
      case 'success':
        return 'Welcome to the Kitchen!';
      case 'error':
        return 'Verification Failed';
      default:
        return '';
    }
  };

  const getSubtitle = () => {
    switch (status) {
      case 'verifying':
        return 'Please wait while we verify your email address and prepare your chef station...';
      case 'success':
        return 'Your email has been verified successfully! You can now log in.';
      case 'error':
        return message;
      default:
        return '';
    }
  };

  const getButtonText = () => {
    switch (status) {
      case 'success':
        return 'Start Cooking';
      case 'error':
        return 'Try Again';
      default:
        return null;
    }
  };

  const getButtonLink = () => {
    switch (status) {
      case 'success':
        return '/login';
      case 'error':
        return '/register';
      default:
        return '/';
    }
  };

  const getBottomMessage = () => {
    switch (status) {
      case 'verifying':
        return '⏳ Setting up your culinary workspace ⏳';
      case 'success':
        return '🎉 Ready to manage you finance 🎉';
      case 'error':
        return '💡 Need help? Contact our support team 💡';
      default:
        return '';
    }
  };

  return (
    <div
      className={`min-h-screen bg-chef-pattern flex items-center justify-center p-4`}
      style={getBackgroundStyle(status)}
    >
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {getFloatingElements(status)}
      </div>
      <div className="relative w-full max-w-md">
        {/* Glassmorphism Card */}
        <div
          className="chef-card rounded-3xl p-8 shadow-2xl border backdrop-blur-2xl text-center"
          style={getCardStyle(status)}
        >
          {/* Brand Header */}
          <div className="text-center mb-6">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 shadow-lg border-4 border-white ${
              status === 'verifying' ? 'bg-gradient-to-br from-[#366c6b] to-[#244746]' :
              status === 'success' ? 'bg-gradient-to-br from-[#366c6b] to-[#244746]' :
              'bg-gradient-to-br from-[#c44d4d] to-[#a82e2e]'
            }`}>
              <img
                src={Logo}
                alt="Logo"
                className="w-14 h-14 object-contain"
              />
            </div>
            <div
              className="font-extrabold text-3xl sm:text-4xl mb-2 bg-clip-text text-transparent font-chef drop-shadow-lg tracking-wide"
              style={getTitleStyle(status)}
            >
              Imhotep Finance
            </div>
            <p className="text-sm mb-2" style={getSubtitleColor(status)}>
              Manage your finances efficiently with Imhotep Financial Manager
            </p>
          </div>
          {/* Icon */}
          {getIcon()}
          {/* Title */}
          <h1 className="text-3xl font-bold font-chef text-gray-800 mb-4">
            {getTitle()}
          </h1>
          {/* Subtitle */}
          <p className="font-medium mb-8 leading-relaxed" style={getSubtitleColor(status)}>
            {getSubtitle()}
          </p>
          {/* Action Button */}
          {status !== 'verifying' && (
            <div className="mb-6">
              <Link
                to={getButtonLink()}
                className="chef-button inline-block text-center no-underline"
                style={getButtonStyle(status)}
              >
                {getButtonText()}
              </Link>
            </div>
          )}
          {/* Countdown for success state */}
          {status === 'success' && countdown > 0 && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="text-green-700 font-medium text-sm">
                  Redirecting to login in {countdown} seconds...
                </span>
              </div>
            </div>
          )}
          {/* Loading progress for verifying state */}
          {status === 'verifying' && (
            <div className="mt-6">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-[#366c6b] to-[#1a3535] h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
              </div>
              <p className="text-gray-500 text-sm mt-2">Processing verification...</p>
            </div>
          )}
          {/* Additional help for error state */}
          {status === 'error' && (
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm mb-4">
                If you continue to experience issues, please{' '}
                <Link
                  to="/register"
                  className="font-semibold transition-colors hover:underline"
                  style={{ color: '#c44d4d' }}
                >
                  register again
                </Link>
                {' '}or contact support.
              </p>
            </div>
          )}
        </div>
        {/* Bottom decorative text */}
        <div className="text-center mt-8">
          <p className="text-sm font-medium" style={getSubtitleColor(status)}>
            {getBottomMessage()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
