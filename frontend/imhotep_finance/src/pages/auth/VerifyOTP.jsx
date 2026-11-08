import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Footer from '../../components/common/Footer';
import Logo from '../../assets/Logo.jpeg';
import LanguageToggle from '../../components/common/LanguageToggle';

const VerifyOTP = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (location.state?.email) {
            setEmail(location.state.email);
        }
    }, [location.state]);

    const handleChange = (e) => {
        setOtp(e.target.value);
        if (error) setError('');
    };

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        if (error) setError('');
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/api/auth/verify-otp/', {
                email: email,
                otp: otp
            });

            setSuccess(true);
            setTimeout(() => navigate('/login', {
                state: { message: 'Account verified successfully! Please log in.' }
            }), 2000);

        } catch (error) {
            console.error('OTP Verification failed:', error);
            let errorMessage = 'Verification failed';

            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            setError(errorMessage);
        }
        setLoading(false);
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors relative">
                {/* Floating decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-20 w-32 h-32 rounded-full filter blur-xl opacity-20 animate-float bg-[#366c6b] mix-blend-multiply dark:bg-emerald-600/40 dark:mix-blend-screen"></div>
                    <div className="absolute top-40 right-20 w-24 h-24 rounded-full filter blur-xl opacity-18 animate-float bg-[rgba(26,53,53,0.9)] dark:bg-teal-800/40" style={{ animationDelay: '2s' }}></div>
                    <div className="absolute bottom-20 left-40 w-40 h-40 rounded-full filter blur-xl opacity-16 animate-float bg-[#2f7775] dark:bg-cyan-700/30 dark:mix-blend-screen" style={{ animationDelay: '4s' }}></div>
                </div>

                {/* Top right language switch */}
            <div className="fixed top-4 right-4 z-50">
                <LanguageToggle />
            </div>
            <div className="flex items-center justify-center min-h-screen p-4">
                    <div className="relative w-full max-w-md">
                        <div className="chef-card rounded-3xl p-8 shadow-2xl backdrop-blur-2xl text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#366c6b] rounded-full mb-6 shadow-lg animate-pulse-slow">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold font-chef text-gray-800 dark:text-gray-100 mb-4">
                                Verified!
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 font-medium mb-8">
                                Your account has been successfully verified. Redirecting to login...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors relative">
            {/* Floating decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-20 w-32 h-32 rounded-full filter blur-xl opacity-20 animate-float bg-[#366c6b] mix-blend-multiply dark:bg-emerald-600/40 dark:mix-blend-screen"></div>
                <div className="absolute top-40 right-20 w-24 h-24 rounded-full filter blur-xl opacity-18 animate-float bg-[rgba(26,53,53,0.9)] dark:bg-teal-800/40" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-20 left-40 w-40 h-40 rounded-full filter blur-xl opacity-16 animate-float bg-[#2f7775] dark:bg-cyan-700/30 dark:mix-blend-screen" style={{ animationDelay: '4s' }}></div>
            </div>

            {/* Top right language switch */}
            <div className="fixed top-4 right-4 z-50">
                <LanguageToggle />
            </div>
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="relative w-full max-w-md">
                    {/* Main Card */}
                    <div className="chef-card rounded-3xl p-8 shadow-2xl backdrop-blur-2xl">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#366c6b] to-[#244746] rounded-full mb-4 shadow-lg border-4 border-white">
                                <img src={Logo} alt="Logo" className="w-14 h-14 object-contain" />
                            </div>
                            <div className="font-extrabold text-3xl sm:text-4xl mb-2 bg-clip-text text-transparent font-chef drop-shadow-lg tracking-wide"
                                style={{
                                    letterSpacing: '0.04em',
                                    lineHeight: '1.1',
                                    backgroundImage: 'linear-gradient(90deg, #366c6b 0%, #1a3535 100%)',
                                    textShadow: '0 2px 8px rgba(26,53,53,0.12)',
                                }}
                            >
                                Imhotep Finance
                            </div>
                            <h1 className="text-2xl font-bold font-chef text-gray-800 dark:text-gray-100 mb-2">
                                Verify Account
                            </h1>
                            <p className="text-gray-600 dark:text-gray-300 font-medium">
                                Enter the OTP sent to your email
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

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={handleEmailChange}
                                    required
                                    className="chef-input w-full"
                                    placeholder="Enter your email"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                    Start Cooking Code (OTP)
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={handleChange}
                                    required
                                    className="chef-input w-full text-center tracking-widest text-2xl font-mono"
                                    placeholder="000000"
                                    maxLength={6}
                                />
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
                                        Verifying...
                                    </div>
                                ) : (
                                    'Verify Account'
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Didn't receive the code?{' '}
                                <Link to="/register" className="font-semibold transition-colors hover:underline" style={{ color: '#366c6b' }}>
                                    Register again
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default VerifyOTP;
