import { useState, useEffect } from 'react';
import { usePWA } from '../../hooks/usePWA';

const InstallPrompt = () => {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [deviceType, setDeviceType] = useState('desktop');

  useEffect(() => {
    // Detect device type
    const userAgent = navigator.userAgent;
    if (/Android/i.test(userAgent)) {
      setDeviceType('android');
    } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
      setDeviceType('ios');
    } else {
      setDeviceType('desktop');
    }

    // Check if user has previously dismissed the prompt
    const hasBeenDismissed = localStorage.getItem('pwa-prompt-dismissed');
    const dismissedTime = localStorage.getItem('pwa-prompt-dismissed-time');
    
    // Show prompt again after 7 days if previously dismissed
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const shouldShowAgain = dismissedTime && (Date.now() - parseInt(dismissedTime)) > sevenDaysInMs;
    
    if ((!hasBeenDismissed || shouldShowAgain) && isInstallable && !isInstalled) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000); // Show after 5 seconds to give user time to explore

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    await installApp();
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
    localStorage.setItem('pwa-prompt-dismissed-time', Date.now().toString());
  };

  const getDeviceSpecificContent = () => {
    switch (deviceType) {
      case 'android':
        return {
          icon: '📱',
          title: 'Install Imhotep Finance App',
          subtitle: 'Add to your Android home screen',
          description: 'Enjoy a native app experience with your Finances.',
          buttonText: '📥 Add to Home Screen'
        };
      case 'ios':
        return {
          icon: '📲',
          title: 'Add Imhotep Finance to Home Screen',
          subtitle: 'Perfect for iPhone & iPad',
          description: 'Enjoy a native app experience with your Finances.',
          buttonText: '🍎 Add to Home Screen'
        };
      default:
        return {
          icon: '💻',
          title: 'Install Imhotep Finance Desktop App',
          subtitle: 'Quick access from your desktop',
          description: 'Install our PWA for faster loading and offline Finances access.',
          buttonText: '⬇️ Install App'
        };
    }
  };

  if (!showPrompt || dismissed || isInstalled) {
    return null;
  }

  const content = getDeviceSpecificContent();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-fadeIn" onClick={handleDismiss}></div>
      
      {/* Install Prompt */}
      <div className="fixed inset-x-4 bottom-4 md:left-auto md:right-4 md:bottom-6 md:w-96 z-50 animate-slideUp">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
                {content.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold leading-tight">{content.title}</h3>
                <p className="text-sm opacity-90 mt-1">{content.subtitle}</p>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              {content.description}
            </p>
            
            {/* Benefits */}
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Offline Access</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Faster Loading</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Push Notifications</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Native Experience</span>
                </div>
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleInstall}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
              >
                <span>{content.buttonText}</span>
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-3 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </>
  );
};

export default InstallPrompt;
