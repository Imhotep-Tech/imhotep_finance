import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Footer from '../../components/common/Footer';
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
  const [demoLoading, setDemoLoading] = useState(false);
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

  const handleDemoLogin = async () => {
    if (loading || googleLoading || demoLoading) return;
    
    try {
      setDemoLoading(true);
      setError('');
      setInfo('');
      
      const response = await axios.post('/api/auth/login/demo/');
      const { access, refresh, user: userData } = response.data;
      
      login({ access, refresh, user: userData });
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Demo login failed:', error);
      setError('Failed to login as demo user');
    } finally {
      setDemoLoading(false);
    }
  };

  const ShowPassword = () => {
    setShowPasswordState(!showPasswordState);
  };

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
 
       <div className="flex items-center justify-center min-h-screen p-4">
         <div className="relative w-full max-w-md">
           {/* Glassmorphism Card */}
          <div
            className="chef-card rounded-3xl p-8 shadow-2xl backdrop-blur-2xl"
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
              <p className="text-sm mb-2 text-[#1a3535] dark:text-gray-300 opacity-80">
                 Manage your finances efficiently with Imhotep Financial Manager
               </p>
              <h1 className="text-3xl font-bold font-chef text-gray-800 dark:text-gray-100 mb-2">
                 Welcome Back!
               </h1>
              <p className="font-medium text-[#1a3535] dark:text-gray-300 opacity-90">
                 Sign in to your Imhotep Finance account
               </p>
             </div>
 
             {/* Error & Info Messages */}
             {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
                 <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 dark:text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                   </svg>
                  <span className="text-red-700 dark:text-red-300 font-medium">{error}</span>
                 </div>
               </div>
             )}
             {info && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl">
                 <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                     <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                   </svg>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">{info}</span>
                 </div>
               </div>
             )}
 
             {/* Login Form */}
             <form onSubmit={handleSubmit} className="space-y-6">
               <div className="space-y-4">
                 <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
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
                      <svg className="w-5 h-5 text-[#1a3535]/60 dark:text-gray-300/70" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 13h2v7H3zM7 9h2v11H7zM11 5h2v15h-2zM15 11h2v9h-2zM19 7h2v13h-2z" />
                      </svg>
                    </div>
                   </div>
                 </div>
                 <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
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
                      <svg className="w-5 h-5 text-[#1a3535]/60 dark:text-gray-300/70" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 17a2 2 0 100-4 2 2 0 000 4z" />
                        <path d="M17 8V7a5 5 0 00-10 0v1H5a1 1 0 00-1 1v10a1 1 0 001 1h14a1 1 0 001-1V9a1 1 0 00-1-1h-2zm-8-1a3 3 0 016 0v1H9V7z" />
                      </svg>
                    </div>
                     <button
                       type="button"
                       onClick={ShowPassword}
                       className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                     >
                       {showPasswordState ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                       ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                       )}
                     </button>
                   </div>
                 </div>
               </div>
               <div className="flex items-center justify-between">
                 <Link 
                   to="/forgot-password" 
                   className="text-sm font-medium transition-colors hover:underline text-[#366c6b] dark:text-emerald-400"
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
              <span className="px-4 text-sm font-medium dark:text-gray-300" style={{ color: '#1a3535', opacity: 0.85 }}>or continue with</span>
              <div className="flex-1 border-t" style={{ borderColor: 'rgba(26,53,53,0.12)' }}></div>
            </div>
 
            {/* Google Login */}
           <button
             onClick={handleGoogleLogin}
             disabled={loading || googleLoading}
             className="chef-button flex items-center justify-center w-full disabled:opacity-50 disabled:cursor-not-allowed"
             style={{ background: 'linear-gradient(90deg, #366c6b 0%, #1a3535 100%)' }}
           >
             <svg className="w-5 h-5 mr-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.35 11.1H12v2.8h5.35c-.25 1.45-1.62 4.1-5.35 4.1-3.23 0-5.86-2.67-5.86-5.99s2.63-5.99 5.86-5.99c1.84 0 3.08.78 3.79 1.45l1.96-1.88C16.3 3.99 14.35 3 12 3 6.98 3 2.94 7.03 2.94 12S6.98 21 12 21c6.69 0 7.86-5.86 7.86-8.39 0-.56-.05-.92-.11-1.51z" />
              </svg>
             {googleLoading ? 'Redirecting...' : 'Sign in with Google'}
            </button>

            {/* Demo Login */}
            <button
             onClick={handleDemoLogin}
             disabled={loading || googleLoading || demoLoading}
             className="chef-button flex items-center justify-center w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
             style={{ background: 'linear-gradient(90deg, #d97706 0%, #b45309 100%)' }}
             type="button"
           >
             <svg className="w-5 h-5 mr-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
             {demoLoading ? 'Setting up Demo...' : 'Try Demo Account'}
            </button>
 
             {/* Footer */}
             <div className="mt-8 text-center">
               <p className="text-gray-600 dark:text-gray-300">
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
            <p className="text-sm font-medium text-[#1a3535] dark:text-gray-300 opacity:80">
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