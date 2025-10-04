import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../../components/common/Footer';
import Logo from '../../assets/Logo.jpeg';

// Features data with emojis
const features = [
  {
    icon: "💸",
    title: "Expense Tracking",
    description: "Easily track your daily expenses and stay on budget."
  },
  {
    icon: "🌍",
    title: "Multi-Currency Support",
    description: "170+ currencies supported for global finance."
  },
  {
    icon: "🛡️",
    title: "Secure & Private",
    description: "Your financial data is protected and open source."
  },
  {
    icon: "⏰",
    title: "Scheduled Transactions",
    description: "Automate your recurring payments and never miss a bill."
  },
];

function LandingPage() {
  const [currentFeature, setCurrentFeature] = useState(0);

  return (
    <div
      className="min-h-screen bg-chef-pattern relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #eaf6f6 0%, #d6efee 50%, #1a3535 100%)',
      }}
    >
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ backgroundColor: '#366c6b' }}></div>
        <div className="absolute top-40 right-20 w-24 h-24 rounded-full mix-blend-multiply filter blur-xl opacity-18 animate-float" style={{ backgroundColor: 'rgba(26,53,53,0.9)', animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-40 w-40 h-40 rounded-full mix-blend-multiply filter blur-xl opacity-16 animate-float" style={{ backgroundColor: '#2f7775', animationDelay: '4s' }}></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 lg:pt-24 lg:pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center">
          <div className="inline-block p-4 bg-white rounded-full mb-6 shadow-2xl border border-gray-100">
            <img src={Logo} alt="Logo" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Take Control of Your{' '}
            <span className="bg-gradient-to-r from-[#366c6b] to-[#1a3535] bg-clip-text text-transparent">
              Financial Future
            </span>
          </h1>
          <p className="text-xl sm:text-2xl lg:text-3xl text-[#1a3535] mb-8 font-medium max-w-4xl mx-auto leading-relaxed opacity-90">
            Simplify your financial management with powerful tools for tracking expenses, managing investments, and achieving your dreams.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link
              to="/register"
              className="chef-button text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-105"
              style={{
                background: 'linear-gradient(90deg, #366c6b 0%, #1a3535 100%)',
              }}
            >
              🚀 Get Started Free
            </Link>
            <Link
              to="/login"
              className="chef-button text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg border-2 border-white transition-all duration-300 transform hover:scale-105"
              style={{
                background: 'linear-gradient(90deg, #366c6b 0%, #1a3535 100%)',
              }}
            >
              🔓 Sign In
            </Link>
          </div>
          {/* Stats */}
          <div className="mt-16 flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-center">
              <div className="glass-effect rounded-lg p-6 text-center transform hover:scale-105 transition-all duration-300">
                <div className="text-3xl font-bold text-[#366c6b] mb-2">170+</div>
                <div className="text-[#1a3535] opacity-90">Currencies Supported</div>
              </div>
              <div className="glass-effect rounded-lg p-6 text-center transform hover:scale-105 transition-all duration-300">
                <div className="text-3xl font-bold text-[#366c6b] mb-2">99.9%</div>
                <div className="text-[#1a3535] opacity-90">Uptime</div>
              </div>
            </div>
          </div>
        </div>
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-[#366c6b] animate-bounce">
          <i className="fas fa-chevron-down text-2xl"></i>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1a3535] mb-4">
              Why Choose Imhotep Finance?
            </h2>
            <p className="text-xl text-[#366c6b]">
              Powerful features designed to make financial management effortless
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 text-center">
                <div className="w-16 h-16 bg-[#eaf6f6] rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-[#1a3535] mb-4">{feature.title}</h3>
                <p className="text-[#366c6b]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1a3535] mb-4">
              Get Started in 3 Simple Steps
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-24 h-24 bg-[#366c6b] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-semibold text-[#1a3535] mb-4">Sign Up</h3>
              <p className="text-[#366c6b]">Create your free account in less than 2 minutes</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-[#366c6b] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-semibold text-[#1a3535] mb-4">Connect</h3>
              <p className="text-[#366c6b]">Add your accounts and start tracking your finances</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-[#366c6b] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-semibold text-[#1a3535] mb-4">Achieve</h3>
              <p className="text-[#366c6b]">Reach your financial goals with our smart tools</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Financial Life?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who have already taken control of their finances with Imhotep.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="chef-button text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-105"
              style={{
                background: 'linear-gradient(90deg, #366c6b 0%, #1a3535 100%)',
              }}
            >
              🚀 Start Your Journey
            </Link>
            <Link
              to="/login"
              className="chef-button text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg border-2 border-white transition-all duration-300 transform hover:scale-105"
              style={{
                background: 'linear-gradient(90deg, #366c6b 0%, #1a3535 100%)',
              }}
            >
              🔓 Sign In
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
export default LandingPage;