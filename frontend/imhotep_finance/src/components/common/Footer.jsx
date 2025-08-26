import { Link } from 'react-router-dom';
import PharaohfolioLogo from '../../assets/PharaohfolioLogo.png';

function Footer() {
  return (
    <footer className="relative z-10 py-12 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full shadow-lg border-4 border-white">
              <img 
                src={PharaohfolioLogo} 
                alt="Pharaohfolio Logo" 
                className="w-10 h-10 object-contain"
              />
            </div>
          </div>
          <div
            className="font-extrabold text-2xl sm:text-3xl mb-2 bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent font-chef drop-shadow-lg tracking-wide"
            style={{
              letterSpacing: '0.04em',
              lineHeight: '1.1',
              textShadow: '0 2px 8px rgba(124,58,237,0.18)'
            }}
          >
            Pharaohfolio
          </div>
          <p className="text-indigo-200 text-sm mb-6">Simple Hosting for Single-Page Portfolios</p>
          <div className="flex justify-center space-x-6 text-sm text-indigo-200">
            <a href="https://imhoteptech.vercel.app/" className="hover:text-purple-300 transition-colors" target="_blank" rel="noopener noreferrer">Imhotep Tech</a>
            <a href="https://github.com/Imhotep-Tech/Pharaohfolio" className="hover:text-purple-300 transition-colors" target="_blank" rel="noopener noreferrer">Source Code</a>
          </div>
          <div className="border-t border-indigo-800 mt-8 pt-8">
            <p className="text-indigo-400 text-xs">&copy; 2025 Pharaohfolio. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
export default Footer;