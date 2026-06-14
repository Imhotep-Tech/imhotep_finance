import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../../components/common/Footer';

const DownloadApp = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse bg-[#366c6b]"></div>
        <div className="absolute top-40 right-20 w-24 h-24 rounded-full mix-blend-multiply filter blur-xl opacity-8 animate-pulse bg-[rgba(26,53,53,0.9)]" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-40 w-40 h-40 rounded-full mix-blend-multiply filter blur-xl opacity-6 animate-pulse bg-[#2f7775]" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex justify-start">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-gray-700 dark:text-gray-200 font-medium">Back</span>
          </button>
        </div>

        <div className="bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 sm:p-12 shadow-xl border border-gray-100 dark:border-gray-700 text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-gradient-to-br from-teal-500 to-slate-600 rounded-2xl flex items-center justify-center shadow-lg mb-8">
            <span className="text-4xl sm:text-5xl">📱</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Download Imhotep Finance
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-12">
            Get the native mobile experience. Track your expenses, manage your wishlist, and achieve your financial goals anytime, anywhere.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Google Play Store - Recommended */}
            <a
              href="https://play.google.com/store/apps/details?id=com.imhoteptech.imhotep_finance"
              target="_blank"
              rel="noopener noreferrer"
              className="relative group flex flex-col items-center p-8 bg-gradient-to-b from-emerald-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-emerald-500 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="absolute -top-4 bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                ⭐ Recommended
              </div>
              <div className="w-16 h-16 mb-4">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-emerald-500">
                  <path d="M17.523 15.3414L5.49836 22.2598C4.54256 22.8097 3.33331 22.102 3.33331 21.0006V2.99951C3.33331 1.89808 4.54252 1.19036 5.49836 1.74026L17.523 8.65866C18.4988 9.22013 18.4988 10.7799 17.523 11.3414ZM22.5693 11.2319L19.7895 9.63229L16.4429 12.0001L19.7895 14.3678L22.5693 12.7682C23.1436 12.4379 23.1436 11.5622 22.5693 11.2319Z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Google Play Store</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">
                Get the app directly from the Play Store for automatic updates and the best experience.
              </p>
              <span className="mt-auto px-6 py-2 bg-emerald-500 text-white font-semibold rounded-lg group-hover:bg-emerald-600 transition-colors w-full text-center">
                Get it on Google Play
              </span>
            </a>

            {/* GitHub Releases */}
            <a
              href="https://github.com/Imhotep-Tech/imhotep_finance/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="w-16 h-16 mb-4 text-gray-800 dark:text-gray-200">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">GitHub Releases</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">
                Download the raw APK file directly from our GitHub repository for manual installation.
              </p>
              <span className="mt-auto px-6 py-2 bg-gray-800 text-white font-semibold rounded-lg group-hover:bg-gray-900 dark:bg-gray-700 dark:group-hover:bg-gray-600 transition-colors w-full text-center">
                Download APK
              </span>
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DownloadApp;
