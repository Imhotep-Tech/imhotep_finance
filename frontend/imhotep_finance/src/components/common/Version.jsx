import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from './Footer';
import Logo from '../../assets/Logo.jpeg';

const Version = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1); // Go to previous page
    } else {
      navigate('/dashboard'); // Fallback to dashboard
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #eaf6f6 0%, #d6efee 50%, #1a3535 100%)',
      }}
    >
      {/* Floating decorative elements (subtle and professional) */}
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
            className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-md hover:shadow-lg hover:bg-white transition-all duration-200"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-gray-700 font-medium">Back</span>
          </button>
        </div>

        {/* Header Section (professional and responsive) */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-teal-500 to-slate-600 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Version History</h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the evolution of Imhotep Financial Manager through our journey of continuous improvement and innovation
            </p>
          </div>
        </div>

        {/* Statistics Section (responsive grid, updated for v7) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 text-center shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="text-3xl font-bold text-teal-600 mb-2">7</div>
            <div className="text-gray-700">Major Versions</div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 text-center shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="text-3xl font-bold text-teal-600 mb-2">60+</div>
            <div className="text-gray-700">Features Added</div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 text-center shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="text-3xl font-bold text-teal-600 mb-2">14</div>
            <div className="text-gray-700">Months of Development</div>
          </div>
        </div>

        {/* Timeline (simplified, professional layout, with new v7.0.0 at top) */}
        <div className="relative space-y-8">
          {/* Version 7.0.0 - Current (New Addition) */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 sm:p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Version 7.0.0</h3>
                  <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">CURRENT</span>
                </div>
              </div>
              <span className="text-sm text-gray-500 mt-2 md:mt-0">September 2025</span>
            </div>
            <p className="text-gray-600 mb-4">
              Thrilled to unveil the next big chapter of my passion project: Imhotep Financial Manager v7.0.0 🎉<br />
              After 6 iterations built with Flask, I've taken a giant leap forward — this release is a complete rebuild with a modern tech stack: Backend: Django (scalable, secure, robust) | Frontend: React + Tailwind (fast, sleek, responsive).
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>API-first architecture for scalability & integrations</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Blazing fast React frontend with smoother UI/UX</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Stronger authentication & data security</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Advanced financial analytics & reports</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Cleaner dashboards & cross-device experience</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Advanced PWA features for offline access & faster performance</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>More secure & optimized for speed</span>
              </li>
            </ul>
          </div>

          {/* Version 6.0.1 - Current */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 sm:p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Version 6.0.1</h3>
                  <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">CURRENT</span>
                </div>
              </div>
              <span className="text-sm text-gray-500 mt-2 md:mt-0">18 June 2025</span>
            </div>
            <p className="text-gray-600 mb-4">Fixed issues and performance enhancements</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Fixed input only accept numbers with decimal points</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Enhanced Caching system</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Improved the net worth calculations</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Improved the app speed</span>
              </li>
            </ul>
          </div>

          {/* Version 6.0 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 sm:p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-slate-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Version 6.0.0</h3>
                </div>
              </div>
              <span className="text-sm text-gray-500 mt-2 md:mt-0">9 June 2025</span>
            </div>
            <p className="text-gray-600 mb-4">Smart Features & Enhanced Analytics</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Smart category suggestions based on your most frequent categories</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span>Enhanced transaction categorization system</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Automated scheduled monthly transactions</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Detailed pie charts for expense and income category analysis</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Export transactions to CSV for external analysis</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Comprehensive error handling system with custom error pages</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Enhanced mobile navigation with improved responsiveness</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Refined UI/UX with modern design patterns</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Advanced security measures and CSRF protection</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Performance optimizations and loading improvements</span>
              </li>
            </ul>
          </div>

          {/* Version 5.0 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 sm:p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-slate-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Version 5.0.0</h3>
                </div>
              </div>
              <span className="text-sm text-gray-500 mt-2 md:mt-0">January 28, 2025</span>
            </div>
            <p className="text-gray-600 mb-4">Speed & Security Revolution</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Significantly improved application speed and performance</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Enhanced code readability and maintainability</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Major security improvements and vulnerability fixes</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Added comprehensive Terms & Conditions page</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Implemented Privacy Policy for user data protection</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Introduced trial user feature for testing without registration</span>
              </li>
            </ul>
          </div>

          {/* Version 4.3.1 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 sm:p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-slate-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Version 4.3.1</h3>
                </div>
              </div>
              <span className="text-sm text-gray-500 mt-2 md:mt-0">October 16, 2024</span>
            </div>
            <p className="text-gray-600 mb-4">Precision & User Experience</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Added support for decimal numbers and floating-point calculations</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Auto-hide notification messages after 5 seconds</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Additional security enhancements and improvements</span>
              </li>
            </ul>
          </div>

          {/* Version 4.3 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 sm:p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-slate-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Version 4.3.0</h3>
                </div>
              </div>
              <span className="text-sm text-gray-500 mt-2 md:mt-0">October 11, 2024</span>
            </div>
            <p className="text-gray-600 mb-4">Google Integration & Performance</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Google OAuth integration for seamless sign-in</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M3 13h2v7H3zM7 9h2v11H7zM11 5h2v15h-2zM15 11h2v9h-2zM19 7h2v13h-2z" />
                </svg>
                <span>Comprehensive score history tracking</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Smart transaction sorting by date proximity</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Pagination system for faster page loads</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Multiple bug fixes and stability improvements</span>
              </li>
            </ul>
          </div>

          {/* Version 4.2 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 sm:p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-slate-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Version 4.2.0</h3>
                </div>
              </div>
              <span className="text-sm text-gray-500 mt-2 md:mt-0">September 14, 2024</span>
            </div>
            <p className="text-gray-600 mb-4">Authentication & Backup Systems</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Google account registration system</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Automated database backup system</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Major security and performance optimizations</span>
              </li>
            </ul>
          </div>

          {/* Version 4.1 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 sm:p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-slate-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Version 4.1.0</h3>
                </div>
              </div>
              <span className="text-sm text-gray-500 mt-2 md:mt-0">August 13, 2024</span>
            </div>
            <p className="text-gray-600 mb-4">Dark Mode & Desktop Optimization</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Dark mode theme implementation</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Background processes for desktop applications</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Reduced application launch times</span>
              </li>
            </ul>
          </div>

          {/* Version 4.0 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 sm:p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-slate-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Version 4.0.0</h3>
                  <span className="inline-block mt-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">MAJOR</span>
                </div>
              </div>
              <span className="text-sm text-gray-500 mt-2 md:mt-0">July 31, 2024</span>
            </div>
            <p className="text-gray-600 mb-4">Native Desktop Applications</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Native .exe and .dmg desktop applications</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Trash system for deleted items recovery</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>SEO-optimized sitemap implementation</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Redesigned login interface</span>
              </li>
            </ul>
          </div>

          {/* Version 3.1 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 sm:p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-slate-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Version 3.1.0</h3>
                </div>
              </div>
              <span className="text-sm text-gray-500 mt-2 md:mt-0">July 27, 2024</span>
            </div>
            <p className="text-gray-600 mb-4">User Management & Security</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Account deletion functionality</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Loading animations and themes</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>"Stay logged in" persistent sessions</span>
              </li>
            </ul>
          </div>

          {/* Version 3.0 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 sm:p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-slate-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Version 3.0.0</h3>
                  <span className="inline-block mt-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">MAJOR</span>
                </div>
              </div>
              <span className="text-sm text-gray-500 mt-2 md:mt-0">July 22, 2024</span>
            </div>
            <p className="text-gray-600 mb-4">Mobile Platform & Financial Goals</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Android APK mobile application</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Monthly savings targets and goals</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Dedicated download page and app distribution</span>
              </li>
            </ul>
          </div>

          {/* Version 2.1 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 sm:p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-slate-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Version 2.1.0</h3>
                </div>
              </div>
              <span className="text-sm text-gray-500 mt-2 md:mt-0">July 9, 2024</span>
            </div>
            <p className="text-gray-600 mb-4">Currency Intelligence</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Auto-selection of user's favorite currency in forms</span>
              </li>
            </ul>
          </div>

          {/* Version 2.0 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 sm:p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-slate-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Version 2.0.0</h3>
                  <span className="inline-block mt-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">MAJOR</span>
                </div>
              </div>
              <span className="text-sm text-gray-500 mt-2 md:mt-0">July 1, 2024</span>
            </div>
            <p className="text-gray-600 mb-4">Enhanced UI & Date Controls</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Custom date selection for transaction viewing</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Redesigned button styles and UI elements</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Comprehensive UI/UX bug fixes</span>
              </li>
            </ul>
          </div>

          {/* Version 1.0 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 sm:p-8 shadow-lg border-l-yellow-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-slate-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Version 1.0.0</h3>
                  <span className="inline-block mt-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">LAUNCH</span>
                </div>
              </div>
              <span className="text-sm text-gray-500 mt-2 md:mt-0">June 27, 2024</span>
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              The foundation of Imhotep Financial Manager - a comprehensive financial management solution designed to help users take control of their finances with precision and ease.
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Personalized financial dashboard with net worth tracking</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Wishlist management and goal prioritization</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Comprehensive transaction tracking and categorization</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Live currency conversion with real-time exchange rates</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Secure user authentication and profile management</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Responsive design for seamless cross-device experience</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Call to Action (professional and responsive) */}
        <div className="text-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Ready to experience the latest version?</h2>
            <p className="text-lg text-gray-600 mb-6">Join thousands of users managing their finances with Imhotep Financial Manager</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-500 to-slate-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg shadow-md border border-gray-200 hover:shadow-lg hover:scale-105 transition-all duration-200"
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