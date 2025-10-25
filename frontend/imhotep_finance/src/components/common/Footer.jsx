import { Link } from 'react-router-dom';
import { usePWA } from '../../hooks/usePWA';
import Logo from '../../assets/Logo.jpeg';

function Footer() {
  const { updateApp } = usePWA();

  // Function to clear cache and reload the app
  const clearCacheAndReload = async () => {
    if ('caches' in window) {
      // Delete all caches
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      console.log('Cache cleared successfully');
    }

    // Trigger the updateApp function to activate the new service worker
    updateApp();

    // Reload the page to fetch the latest updates
    window.location.reload();
  };

  return (
    <footer
      className="relative z-10 py-8 bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white dark:from-gray-950 dark:to-gray-900"
    >
      <div className="container mx-auto px-4 max-w-2xl text-center">
        <div className="flex justify-center mb-3">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-full shadow-lg border-2 border-white bg-gradient-to-r from-[#366c6b] to-[#1a3535]"
          >
            <img src={Logo} alt="Logo" className="w-8 h-8 object-contain" />
          </div>
        </div>
        <div className="font-extrabold text-xl mb-1 font-chef">Imhotep Finance</div>
        <p className="text-white/80 text-xs mb-2">
          Manage your finances efficiently with Imhotep Financial Manager
        </p>
        <div className="flex justify-center space-x-4 text-xs mb-2">
          <a
            href="https://imhoteptech.vercel.app/"
            className="hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Imhotep Tech
          </a>
          <a
            href="https://github.com/Imhotep-Tech/imhotep_finance"
            className="hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Source
          </a>
          <a
            href="https://tally.so/r/nPKe1P"
            className="hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Feedback & Bugs
          </a>
          <Link to="/version-history" className="hover:underline">
            Version 7.1.0
          </Link>
        </div>

        {/* Always-visible Update Button */}
        <div className="mt-4">
          <button
            onClick={clearCacheAndReload}
            className="bg-white text-[#366c6b] px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-transform"
          >
            Update
          </button>
        </div>

        <p className="text-white/60 text-xs mt-4">&copy; 2025 Imhotep Finance</p>
      </div>
    </footer>
  );
}

export default Footer;