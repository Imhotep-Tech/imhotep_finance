import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import PharaohfolioLogo from '../../assets/PharaohfolioLogo.png';

const EmailChangeVerification = () => {
  const { uid, token, new_email } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const verifyEmailChange = async () => {
      try {
        const response = await axios.post('/api/profile/verify-email-change/', {
          uid,
          token,
          new_email: new_email, // This is already the encoded email from URL params
        });
        
        setStatus('success');
        setMessage('Your email has been changed successfully!');
        
        // Start countdown
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              navigate('/login', { 
                state: { message: 'Email changed successfully! Please log in again.' }
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

    if (uid && token && new_email) {
      verifyEmailChange();
    } else {
      setStatus('error');
      setMessage('Invalid verification link.');
    }
  }, [uid, token, new_email, navigate]);

  // Theme helpers
  const getBackgroundGradient = () => {
    switch (status) {
      case 'verifying':
        return 'from-purple-100 via-indigo-100 to-blue-100';
      case 'success':
        return 'from-green-50 via-emerald-50 to-teal-50';
      case 'error':
        return 'from-red-50 via-rose-50 to-pink-50';
      default:
        return 'from-purple-100 via-indigo-100 to-blue-100';
    }
  };

  const getFloatingElements = () => {
    switch (status) {
      case 'verifying':
        return (
          <>
            <div className="absolute top-20 left-20 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
            <div className="absolute top-40 right-20 w-24 h-24 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
            <div className="absolute bottom-20 left-40 w-40 h-40 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '4s'}}></div>
          </>
        );
      case 'success':
        return (
          <>
            <div className="absolute top-20 left-20 w-32 h-32 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
            <div className="absolute top-40 right-20 w-24 h-24 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
            <div className="absolute bottom-20 left-40 w-40 h-40 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '4s'}}></div>
          </>
        );
      case 'error':
        return (
          <>
            <div className="absolute top-20 left-20 w-32 h-32 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
            <div className="absolute top-40 right-20 w-24 h-24 bg-rose-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
            <div className="absolute bottom-20 left-40 w-40 h-40 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '4s'}}></div>
          </>
        );
      default:
        return null;
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full mb-6 shadow-lg border-4 border-white">
            <svg className="animate-spin w-10 h-10 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        );
      case 'success':
        return (
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6 shadow-lg animate-pulse-slow">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 1.26a2 2 0 001.28-.74L15 5.26a2 2 0 011.28-.74L21 4m-18 8l7.89 1.26a2 2 0 001.28-.74L15 9.26a2 2 0 011.28-.74L21 8m-18 8l7.89 1.26a2 2 0 001.28-.74L15 13.26a2 2 0 011.28-.74L21 12" />
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
        return 'Updating Your Profile...';
      case 'success':
        return 'Email Updated Successfully!';
      case 'error':
        return 'Update Failed';
      default:
        return '';
    }
  };

  const getSubtitle = () => {
    const decodedEmail = new_email ? decodeURIComponent(new_email) : '';
    switch (status) {
      case 'verifying':
        return `Please wait while we update your email address${decodedEmail ? ` to ${decodedEmail}` : ''}...`;
      case 'success':
        return `Your email address has been successfully updated${decodedEmail ? ` to ${decodedEmail}` : ''}. For security reasons, please log in again with your new email.`;
      case 'error':
        return message;
      default:
        return '';
    }
  };

  const getBottomMessage = () => {
    switch (status) {
      case 'verifying':
        return '📧 Securing your new email address 📧';
      case 'success':
        return '🔐 Email updated! Please log in again for security 🔐';
      case 'error':
        return '💡 Having trouble? Try updating your email again 💡';
      default:
        return '';
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBackgroundGradient()} bg-chef-pattern flex items-center justify-center p-4`}>
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {getFloatingElements()}
      </div>
      <div className="relative w-full max-w-md">
        {/* Glassmorphism Card */}
        <div className="chef-card rounded-3xl p-8 shadow-2xl border border-white/30 backdrop-blur-2xl bg-white/90 text-center">
          {/* Brand Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full mb-4 shadow-lg border-4 border-white">
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
          </div>
          {/* Icon */}
          {getIcon()}
          {/* Title */}
          <h1 className="text-3xl font-bold font-chef text-gray-800 mb-4">
            {getTitle()}
          </h1>
          {/* Subtitle */}
          <p className="text-gray-600 font-medium mb-8 leading-relaxed">
            {getSubtitle()}
          </p>
          {/* Action Button */}
          {status !== 'verifying' && (
            <div className="mb-6">
              <Link 
                to="/login"
                className="chef-button inline-block text-center no-underline"
              >
                {status === 'success' ? 'Log In Again' : 'Go to Login'}
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
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full animate-pulse" style={{width: '80%'}}></div>
              </div>
              <p className="text-gray-500 text-sm mt-2">Updating email address...</p>
            </div>
          )}
          {/* Security notice for success state */}
          {status === 'success' && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <div className="text-left">
                  <p className="text-blue-700 font-medium text-sm">Security Notice</p>
                  <p className="text-blue-600 text-sm mt-1">
                    For your account security, you'll need to log in again using your new email address.
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* Additional help for error state */}
          {status === 'error' && (
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm mb-4">
                If you continue to experience issues, please try updating your email from your profile settings or contact support.
              </p>
              <Link 
                to="/profile" 
                className="text-purple-600 hover:text-purple-800 font-semibold transition-colors hover:underline text-sm"
              >
                Go to Profile Settings
              </Link>
            </div>
          )}
        </div>
        {/* Bottom decorative text */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm font-medium">
            {getBottomMessage()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailChangeVerification;