import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../common/Footer';
import PharaohfolioLogo from '../../assets/PharaohfolioLogo.png';

function LandingPage() {
  const [currentFeature, setCurrentFeature] = useState(0);

  // Features from README
  const features = [
    {
      icon: "🤖",
      title: "AI-Generated Code Support",
      description: "Works with any AI assistant (ChatGPT, Claude, Gemini, etc.)"
    },
    {
      icon: "📋",
      title: "Simple Paste & Deploy",
      description: "Just paste your HTML/CSS/JS code and get a live link instantly"
    },
    {
      icon: "🌐",
      title: "Instant Hosting",
      description: "Your portfolio goes live at pharaohfolio.vercel.app/u/username immediately"
    },
    {
      icon: "💻",
      title: "Built-in Code Editor",
      description: "Monaco editor for quick tweaks and customizations"
    },
    {
      icon: "👁️",
      title: "Live Preview",
      description: "See your portfolio in real-time as you edit"
    },
    {
      icon: "🔐",
      title: "Secure Authentication",
      description: "Email/password and Google OAuth for account management"
    },
    {
      icon: "📱",
      title: "Mobile-Optimized",
      description: "All hosted portfolios work perfectly on mobile devices"
    },
    {
      icon: "🛡️",
      title: "Safe Code Execution",
      description: "HTML/CSS/JS sanitization to prevent malicious code"
    },
    {
      icon: "📊",
      title: "Simple Analytics",
      description: "Basic visit tracking for your portfolio"
    },
    {
      icon: "⚡",
      title: "Lightning Fast",
      description: "Instant deployment with global CDN delivery"
    },
  ];

  // Auto-rotate features every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 bg-chef-pattern relative overflow-hidden">
        {/* Floating background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-20 left-40 w-40 h-40 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '4s'}}></div>
        </div>

        {/* Hero Section */}
        <section className="relative z-10 pt-16 pb-20 lg:pt-24 lg:pb-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="text-center mb-16">
              <div className="inline-block p-4 bg-white rounded-full mb-6 shadow-2xl border border-gray-100">
                <img 
                  src={PharaohfolioLogo} 
                  alt="Pharaohfolio Logo" 
                  className="w-16 h-16 object-contain"
                />
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 bg-clip-text text-transparent">
                  Pharaohfolio
                </span>
              </h1>
              <h2 className="text-xl sm:text-2xl lg:text-3xl text-gray-700 mb-8 font-medium max-w-4xl mx-auto leading-relaxed">
                Simple Hosting for AI-Generated Single-Page Portfolios
              </h2>
              <p className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                Instantly deploy your AI-generated HTML/CSS/JS portfolio. No technical skills required. Paste your code, get your live link, and share your work with the world!
              </p>
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                <Link
                  to="/register"
                  className="chef-button bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 min-w-48"
                >
                  🚀 Get Started Free
                </Link>
                <Link
                  to="/login"
                  className="chef-button-secondary bg-white text-purple-700 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-purple-500 hover:bg-purple-50 transform hover:scale-105 transition-all duration-300 min-w-48"
                >
                  🔓 Sign In
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Showcase */}
        <section className="relative z-10 py-20 bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Why Choose <span className="text-purple-600">Pharaohfolio</span>?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                The easiest way to host your AI-generated portfolio. No servers, no deployment headaches, no technical knowledge required.
              </p>
            </div>
            {/* Interactive Feature Display */}
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Feature Description */}
                <div className="order-2 lg:order-1">
                  <div className="chef-card bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/30">
                    <div className="text-6xl mb-4">{features[currentFeature].icon}</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{features[currentFeature].title}</h3>
                    <p className="text-gray-600 text-lg leading-relaxed mb-6">{features[currentFeature].description}</p>
                    {/* Feature indicators */}
                    <div className="flex space-x-2">
                      {features.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentFeature(index)}
                          className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            index === currentFeature 
                              ? 'bg-purple-500 w-8' 
                              : 'bg-gray-300 hover:bg-purple-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {/* Feature Grid */}
                <div className="order-1 lg:order-2 grid grid-cols-2 gap-4">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      onClick={() => setCurrentFeature(index)}
                      className={`cursor-pointer transition-all duration-300 p-4 rounded-xl ${
                        index === currentFeature
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-xl scale-105'
                          : 'bg-white/80 hover:bg-white text-gray-800 hover:shadow-lg hover:scale-102'
                      }`}
                    >
                      <div className="text-3xl mb-2">{feature.icon}</div>
                      <h4 className="font-semibold text-sm">{feature.title}</h4>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="relative z-10 py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                How <span className="text-purple-600">Pharaohfolio</span> Works
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Go live in three simple steps
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  step: "1",
                  icon: "🤖",
                  title: "Generate with AI",
                  description: "Ask any AI assistant to create your portfolio code (HTML/CSS/JS in one file)."
                },
                {
                  step: "2",
                  icon: "📋",
                  title: "Paste & Deploy",
                  description: "Paste the code into Pharaohfolio's editor and hit Save & Deploy."
                },
                {
                  step: "3",
                  icon: "🌐",
                  title: "Get Your Link",
                  description: "Your portfolio is live at pharaohfolio.com/u/yourusername. Share it instantly!"
                }
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-4xl shadow-xl">
                      {item.icon}
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="relative z-10 py-20 bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Who Is Pharaohfolio For?
              </h2>
              <p className="text-xl opacity-90 max-w-3xl mx-auto">
                Perfect for anyone who wants a professional web presence without the hassle.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: "🎨", title: "Artists & Designers", description: "Showcase your creative work without coding" },
                { icon: "💼", title: "Freelancers", description: "Professional portfolios that convert clients" },
                { icon: "🎓", title: "Students", description: "Academic projects and resume portfolios" },
                { icon: "🚀", title: "Entrepreneurs", description: "Quick business and startup showcases" }
              ].map((benefit, index) => (
                <div key={index} className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl">
                  <div className="text-4xl mb-4">{benefit.icon}</div>
                  <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-sm opacity-90">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative z-10 py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
            <div className="chef-card bg-white/90 backdrop-blur-sm p-12 rounded-3xl shadow-2xl border border-white/30">
              <div className="flex justify-center mb-6">
                <img 
                  src={PharaohfolioLogo} 
                  alt="Pharaohfolio Logo" 
                  className="w-20 h-20 object-contain"
                />
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Ready to Share Your Portfolio with the World?
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Join Pharaohfolio today and get your AI-generated portfolio online in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to="/register"
                  className="chef-button bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-10 py-4 rounded-xl font-semibold text-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  🚀 Get Started for Free
                </Link>
                <p className="text-sm text-gray-500">
                  No credit card required • Start in minutes
                </p>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    </>
  );
}
export default LandingPage