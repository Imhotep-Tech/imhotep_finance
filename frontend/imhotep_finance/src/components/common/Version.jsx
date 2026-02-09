import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { versionEntries } from '../../utils/versionData';

// Mock Footer component for standalone functionality
const Footer = () => (
  <footer className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm mt-12 py-6 text-center text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800">
    <p>&copy; 2025 Imhotep Financial Manager. All rights reserved.</p>
  </footer>
);

const Version = () => {
  const navigate = useNavigate();

  // Handles navigation back to the previous page
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1); // Go to previous page
    } else {
      navigate('/dashboard'); // Fallback to dashboard
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors relative overflow-hidden"
    >
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 left-20 w-32 h-32 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"
          style={{ backgroundColor: '#366c6b' }}
        ></div>
        <div
          className="absolute top-40 right-20 w-24 h-24 rounded-full mix-blend-multiply filter blur-xl opacity-8 animate-pulse"
          style={{ backgroundColor: 'rgba(26,53,53,0.9)', animationDelay: '1s' }}
        ></div>
        <div
          className="absolute bottom-20 left-40 w-40 h-40 rounded-full mix-blend-multiply filter blur-xl opacity-6 animate-pulse"
          style={{ backgroundColor: '#2f7775', animationDelay: '2s' }}
        ></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Back Button */}
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

        {/* Header Section */}
        <div className="bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-teal-500 to-slate-600 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">Version History</h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Discover the evolution of Imhotep Financial Manager through our journey of continuous improvement and innovation
            </p>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 text-center shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
            <div className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-2">7</div>
            <div className="text-gray-700 dark:text-gray-300">Major Versions</div>
          </div>
          <div className="bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 text-center shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
            <div className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-2">100+</div>
            <div className="text-gray-700 dark:text-gray-300">Features Added</div>
          </div>
          <div className="bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 text-center shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
            <div className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-2">19</div>
            <div className="text-gray-700 dark:text-gray-300">Months of Development</div>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative space-y-8">
          {versionEntries.map((entry) => (
            <div key={entry.version} className="bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 sm:p-8 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Version {entry.version}</h3>
                    {entry.badge && (
                      <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${entry.badge.color === 'red'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {entry.badge.label}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 mt-2 md:mt-0">{entry.date}</span>
              </div>
              {entry.summary && (
                <p className="text-gray-600 dark:text-gray-300 mb-4" dangerouslySetInnerHTML={{ __html: entry.summary.replace(/\n/g, '<br />') }}></p>
              )}
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {entry.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Ready to experience the latest version?</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">Join thousands of users managing their finances with Imhotep Financial Manager</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-teal-500 to-slate-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg shadow-md border border-gray-200 hover:shadow-lg hover:scale-105 transition-all duration-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Version;

