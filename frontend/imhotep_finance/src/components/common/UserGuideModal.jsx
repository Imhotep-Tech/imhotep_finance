import { useState } from 'react';

const UserGuideModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Welcome to Imhotep Finance! 📈',
      description: 'Manage your finances efficiently with our premium wealth manager. This simple guide will show you how to navigate and use the key features of the application.',
      icon: (
        <svg className="w-16 h-16 text-[#366c6b] dark:text-teal-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      title: 'Dashboard & Quick Actions ⚡',
      description: 'Your central hub! View your total Net Worth consolidated across all places in your favorite currency, check your Target Savings score, and use "Add Transaction" buttons to quickly log deposits and withdrawals.',
      icon: (
        <svg className="w-16 h-16 text-blue-500 dark:text-blue-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      title: 'Detailed Net Worth & Move Money 💼',
      description: 'Click on your Net Worth card to see a detailed breakdown. You can toggle between viewing your assets "By Place" or grouped "By Currency". Use "Move Money" to transfer funds between places, or "Convert Currency" using live exchange rates.',
      icon: (
        <svg className="w-16 h-16 text-amber-500 dark:text-amber-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-20c5.302 0 9.6 4.3 9.6 9.6S17.3 19.2 12 19.2 2.4 14.9 2.4 9.6 6.7 0 12 0zm0 6v10m6-5H6" />
        </svg>
      )
    },
    {
      title: 'Reports & Savings Targets 📊',
      description: 'Navigate to Reports to view historical spending analytics, cash flow, and monthly savings rates. Setup targets in your Profile settings to calculate your financial score and keep track of your financial goals!',
      icon: (
        <svg className="w-16 h-16 text-indigo-500 dark:text-indigo-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('has_seen_guide', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden flex flex-col justify-between">
        
        {/* Step Indicator */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Guide: Step {currentStep + 1} of {steps.length}
          </span>
          <button 
            onClick={handleComplete}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Content */}
        <div className="text-center py-4 flex-1">
          {steps[currentStep].icon}
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 font-chef mb-4">
            {steps[currentStep].title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
            {steps[currentStep].description}
          </p>
        </div>

        {/* Progress Bar Dots */}
        <div className="flex justify-center space-x-2 my-6">
          {steps.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentStep ? 'w-6 bg-[#366c6b] dark:bg-teal-400' : 'w-2 bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex justify-between items-center mt-2 space-x-4">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`px-4 py-2.5 font-semibold text-sm rounded-xl border border-gray-200 dark:border-gray-750 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
              currentStep === 0 ? 'opacity-30 cursor-not-allowed' : ''
            }`}
          >
            Previous
          </button>
          
          <button
            onClick={handleNext}
            className="flex-1 px-5 py-2.5 bg-[#366c6b] dark:bg-[#51adac] hover:bg-[#2c5756] dark:hover:bg-[#439190] text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all text-center"
          >
            {currentStep === steps.length - 1 ? 'Get Started!' : 'Next'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default UserGuideModal;
