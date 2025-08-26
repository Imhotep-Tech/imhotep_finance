import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Footer from '../common/Footer';
import PharaohfolioLogo from '../../assets/PharaohfolioLogo.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  const requestPasswordReset = async (email) => {
    try {
      const response = await axios.post('/api/auth/password-reset/', {
        email,
      });
      
      return { 
        success: true, 
        message: response.data.message 
      };
    } catch (error) {
      console.error('Password reset request failed:', error);
      
      let errorMessage = 'Password reset request failed';
      
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

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    const result = await requestPasswordReset(email);
    
    if (result.success) {
      setSuccess(true);
      setMessage(result.message);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 bg-chef-pattern">
        {/* Floating decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-20 left-40 w-40 h-40 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '4s'}}></div>
        </div>
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="relative w-full max-w-md">
            <div className="chef-card rounded-3xl p-8 shadow-2xl border border-white/30 backdrop-blur-2xl bg-white/90 text-center">
              {/* Success Icon */}
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
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
              <h2 className="text-3xl font-bold font-chef text-gray-800 mb-4">
                Check Your Email!
              </h2>
              <p className="text-gray-600 font-medium mb-8 leading-relaxed">
                {message || "We've sent you a password reset link. Please check your email and follow the instructions to reset your password."}
              </p>
              <Link 
                to="/login" 
                className="chef-button inline-block text-center no-underline"
              >
                Back to Login
              </Link>
            </div>
            <div className="text-center mt-8">
              <p className="text-gray-500 text-sm font-medium">
                👑 Pharaohfolio – Simple Hosting for Single-Page Portfolios 👑
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 bg-chef-pattern">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 left-40 w-40 h-40 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '4s'}}></div>
      </div>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative w-full max-w-md">
          {/* Main Forgot Password Card */}
          <div className="chef-card rounded-3xl p-8 shadow-2xl border border-white/30 backdrop-blur-2xl bg-white/90">
            {/* Header with Logo and Brand */}
            <div className="text-center mb-8">
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
              <h1 className="text-3xl font-bold font-chef text-gray-800 mb-2">
                Forgot Password?
              </h1>
              <p className="text-gray-600 font-medium leading-relaxed">
                No worries! Enter your email address and we'll send you a magic link to reset your password
              </p>
            </div>
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-700 font-medium text-sm">{error}</span>
                </div>
              </div>
            )}
            {/* Reset Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={handleChange}
                    required
                    className="chef-input pl-12"
                    placeholder="Enter your email address"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="chef-button bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Magic Link...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Reset Link
                  </div>
                )}
              </button>
            </form>
            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Remember your password?{' '}
                <Link 
                  to="/login" 
                  className="text-purple-600 hover:text-purple-800 font-semibold transition-colors hover:underline"
                >
                  Back to Login
                </Link>
              </p>
            </div>
          </div>
          {/* Bottom decorative text */}
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm font-medium">
              👑 Pharaohfolio – Simple Hosting for Single-Page Portfolios 👑
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
