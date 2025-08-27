import { Link } from 'react-router-dom';
import Logo from '../../assets/Logo.jpeg';

function Footer() {
  return (
    <footer
      className="relative z-10 py-8"
      style={{
        background: 'linear-gradient(90deg, #366c6b 0%, #1a3535 100%)',
        color: 'white',
      }}
    >
      <div className="container mx-auto px-4 max-w-2xl text-center">
        <div className="flex justify-center mb-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full shadow-lg border-2 border-white"
            style={{ background: 'linear-gradient(90deg, #366c6b 0%, #1a3535 100%)' }}>
            <img src={Logo} alt="Logo" className="w-8 h-8 object-contain" />
          </div>
        </div>
        <div
          className="font-extrabold text-xl mb-1 bg-clip-text text-transparent font-chef"
          style={{
            backgroundImage: 'linear-gradient(90deg, #eaf6f6 0%, #d6efee 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.04em',
          }}
        >
          Imhotep Finance
        </div>
        <p className="text-white/80 text-xs mb-2">
          Manage your finances efficiently with Imhotep Financial Manager
        </p>
        <div className="flex justify-center space-x-4 text-xs mb-2">
          <a href="https://imhoteptech.vercel.app/" className="hover:underline" target="_blank" rel="noopener noreferrer">Imhotep Tech</a>
          <a href="https://github.com/Imhotep-Tech/imhotep_finance" className="hover:underline" target="_blank" rel="noopener noreferrer">Source</a>
        </div>
        <p className="text-white/60 text-xs mt-4">&copy; 2025 Imhotep Finance</p>
      </div>
    </footer>
  );
}

export default Footer;