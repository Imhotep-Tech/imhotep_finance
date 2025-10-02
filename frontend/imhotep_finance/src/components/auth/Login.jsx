import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Footer from '../common/Footer';
import Logo from '../../assets/Logo.jpeg';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPasswordState, setShowPasswordState] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
    if (info) setInfo('');
  };

  const loginUser = async (username, password) => {
    try {
      const response = await axios.post('/api/auth/login/', {
        username,
        password,
      });
      
      const { access, refresh, user: userData } = response.data;
      
      return { 
        success: true, 
        data: { access, refresh, user: userData }
      };
    } catch (error) {
      console.error('Login failed:', error);
      
      let errorMessage = 'Login failed';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid credentials';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      return { 
        success: false, 
        error: errorMessage,
        info: error.response?.data?.message && error.response.data.error !== error.response.data.message 
          ? error.response.data.message 
          : null
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');

    const result = await loginUser(formData.username, formData.password);
    
    if (result.success) {
      login(result.data);
      navigate('/dashboard');
    } else {
      setError(result.error);
      if (result.info) {
        setInfo(result.info);
      }
    }
    
    setLoading(false);
  };

  const getGoogleAuthUrl = async () => {
    try {
      const response = await axios.get('/api/auth/google/url/');
      return response.data.auth_url;
    } catch (error) {
      console.error('Failed to get Google auth URL:', error);
      throw error;
    }
  };

  const handleGoogleLogin = async () => {
    if (googleLoading) return;
    
    try {
      setGoogleLoading(true);
      const authUrl = await getGoogleAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      setError('Failed to initiate Google login');
      setGoogleLoading(false);
    }
  };

  const ShowPassword = () => {
    setShowPasswordState(!showPasswordState);
  };

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
 
       <div className="flex items-center justify-center min-h-screen p-4">
         <div className="relative w-full max-w-md">
           {/* Glassmorphism Card */}
          <div
            className="chef-card rounded-3xl p-8 shadow-2xl backdrop-blur-2xl"
            style={{
              border: '1px solid rgba(54,108,107,0.14)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(242,251,250,0.9))',
            }}
          >
             {/* Header with Logo and Title */}
             <div className="text-center mb-8">
               <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#366c6b] to-[#244746] rounded-full mb-4 shadow-lg border-4 border-white">
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
               <h1 className="text-3xl font-bold font-chef text-gray-800 mb-2">
                 Welcome Back!
               </h1>
               <p className="font-medium" style={{ color: '#1a3535', opacity: 0.9 }}>
                 Sign in to your Imhotep Finance account
               </p>
             </div>
 
             {/* Error & Info Messages */}
             {error && (
               <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                 <div className="flex items-center">
                   <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                   </svg>
                   <span className="text-red-700 font-medium">{error}</span>
                 </div>
               </div>
             )}
             {info && (
               <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                 <div className="flex items-center">
                   <svg className="w-5 h-5 text-blue-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                     <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                   </svg>
                   <span className="text-blue-700 font-medium">{info}</span>
                 </div>
               </div>
             )}
 
             {/* Login Form */}
             <form onSubmit={handleSubmit} className="space-y-6">
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-2">
                     Username or Email
                   </label>
                   <div className="relative">
                     <input
                       type="text"
                       name="username"
                       value={formData.username}
                       onChange={handleChange}
                       required
                       className="chef-input pl-12"
                       placeholder="Enter your username or email"
                     />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {/* finance-relevant icon: chart bars */}
                      <svg className="w-5 h-5 text-[#1a3535]/60" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 13h2v7H3zM7 9h2v11H7zM11 5h2v15h-2zM15 11h2v9h-2zM19 7h2v13h-2z" />
                      </svg>
                    </div>
                   </div>
                 </div>
                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-2">
                     Password
                   </label>
                   <div className="relative">
                     <input
                       type={showPasswordState ? "text" : "password"}
                       name="password"
                       value={formData.password}
                       onChange={handleChange}
                       required
                       className="chef-input pl-12 pr-12"
                       placeholder="Enter your password"
                     />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {/* lock icon with finance tint */}
                      <svg className="w-5 h-5 text-[#1a3535]/60" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 17a2 2 0 100-4 2 2 0 000 4z" />
                        <path d="M17 8V7a5 5 0 00-10 0v1H5a1 1 0 00-1 1v10a1 1 0 001 1h14a1 1 0 001-1V9a1 1 0 00-1-1h-2zm-8-1a3 3 0 016 0v1H9V7z" />
                      </svg>
                    </div>
                     <button
                       type="button"
                       onClick={ShowPassword}
                       className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                     >
                       {showPasswordState ? (
                        <svg className="w-5 h-5 text-[#366c6b]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                       ) : (
                        <svg className="w-5 h-5 text-[#1a3535]/70" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 3a7 7 0 00-7 7v3h14V10a7 7 0 00-7-7zm-1 11a1 1 0 112 0 1 1 0 01-2 0z" />
                        </svg>
                       )}
                     </button>
                   </div>
                 </div>
               </div>
               <div className="flex items-center justify-between">
                 <Link 
                   to="/forgot-password" 
                   className="text-sm font-medium transition-colors hover:underline"
                   style={{ color: '#366c6b' }}
                 >
                   Forgot your password?
                 </Link>
               </div>
               <button
                 type="submit"
                 disabled={loading}
                className="chef-button text-white w-full disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(90deg, #366c6b 0%, #1a3535 100%)',
                }}
               >
                 {loading ? (
                   <div className="flex items-center justify-center">
                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     Signing in...
                   </div>
                 ) : (
                   'Sign In'
                 )}
               </button>
             </form>
 
             {/* Divider */}
            <div className="my-8 flex items-center">
              <div className="flex-1 border-t" style={{ borderColor: 'rgba(26,53,53,0.12)' }}></div>
              <span className="px-4 text-sm font-medium" style={{ color: '#1a3535', opacity: 0.85 }}>or continue with</span>
              <div className="flex-1 border-t" style={{ borderColor: 'rgba(26,53,53,0.12)' }}></div>
            </div>
 
             {/* Google Login */}
             <button
               onClick={handleGoogleLogin}
               disabled={loading || googleLoading}
              className="chef-button border flex items-center justify-center w-full"
              style={{
                background: 'linear-gradient(90deg, #ffffff 0%, #f0fbfa 100%)',
                borderColor: 'rgba(54,108,107,0.12)',
                color: '#1a3535',
                padding: '0.65rem',
              }}
             >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? 'Redirecting...' : 'Sign in with Google'}
             </button>
 
             {/* Footer */}
             <div className="mt-8 text-center">
               <p className="text-gray-600">
                 Don't have an account?{' '}
                 <Link 
                   to="/register" 
                   className="font-semibold transition-colors hover:underline"
                   style={{ color: '#366c6b' }}
                 >
                   Create Account
                 </Link>
               </p>
             </div>
           </div>
 
           {/* Bottom decorative text */}
          <div className="text-center mt-8">
            <p className="text-sm font-medium" style={{ color: '#1a3535', opacity: 0.8 }}>
              📈 Imhotep Finance – Manage your finances efficiently with Imhotep Financial Manager 📈
            </p>
          </div>
         </div>
       </div>
       <Footer />
     </div>
   );
 };
 
 export default Login;