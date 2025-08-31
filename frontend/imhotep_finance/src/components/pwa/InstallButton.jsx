import { usePWA } from '../../hooks/usePWA';

const InstallButton = ({ className = '' }) => {
  const { isInstallable, isInstalled, installApp } = usePWA();

  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <button
      onClick={installApp}
      className={`group flex items-center p-4 rounded-2xl text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:shadow-lg transition-all duration-300 hover:scale-105 ${className}`}
    >
      <div className="w-10 h-10 rounded-xl bg-orange-400 flex items-center justify-center mr-3 transition-colors duration-300">
        <span className="text-xl">📱</span>
      </div>
      <span className="font-semibold">Install App</span>
    </button>
  );
};

export default InstallButton;
