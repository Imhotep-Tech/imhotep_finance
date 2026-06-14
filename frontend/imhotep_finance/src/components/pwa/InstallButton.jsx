import { usePWA } from '../../hooks/usePWA';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const InstallButton = ({ className = '' }) => {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const navigate = useNavigate();
  const [deviceType, setDeviceType] = useState('desktop');

  useEffect(() => {
    const userAgent = navigator.userAgent;
    if (/Android/i.test(userAgent)) {
      setDeviceType('android');
    }
  }, []);

  const handleClick = () => {
    if (deviceType === 'android') {
      navigate('/download-app');
    } else {
      installApp();
    }
  };

  if (isInstalled || (!isInstallable && deviceType !== 'android')) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className={`group flex items-center p-4 rounded-2xl text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:shadow-lg transition-all duration-300 hover:scale-105 ${className}`}
    >
      <div className="w-10 h-10 rounded-xl bg-orange-400 flex items-center justify-center mr-3 transition-colors duration-300">
        <span className="text-xl">📱</span>
      </div>
      <span className="font-semibold">{deviceType === 'android' ? 'Download App' : 'Install App'}</span>
    </button>
  );
};

export default InstallButton;

