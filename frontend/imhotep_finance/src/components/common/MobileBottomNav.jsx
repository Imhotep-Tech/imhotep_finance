import { Link, useLocation } from 'react-router-dom';

const MobileBottomNav = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const NavItem = ({ path, label, icon }) => {
    const active = isActive(path);
    return (
      <Link 
        to={path} 
        className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
          active ? 'text-[#366c6b] dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:text-[#366c6b] dark:hover:text-emerald-400 transition-colors'
        }`}
      >
        {icon(active)}
        <span className="text-[10px] font-medium truncate max-w-[50px]">{label}</span>
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 md:hidden bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] pb-safe pt-1">
      <div className="flex justify-between items-center h-16 px-1">
        <NavItem 
          path="/dashboard" 
          label="Home" 
          icon={(active) => (
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          )} 
        />
        <NavItem 
          path="/show_trans" 
          label="Trans" 
          icon={(active) => (
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d="M3 13h2v7H3zM7 9h2v11H7zM11 5h2v15h-2zM15 11h2v9h-2zM19 7h2v13h-2z" />
            </svg>
          )} 
        />

        <NavItem 
          path="/wishlist" 
          label="Wish" 
          icon={(active) => (
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
            </svg>
          )} 
        />
        <NavItem 
          path="/reports" 
          label="Reports" 
          icon={(active) => (
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          )} 
        />
        <NavItem 
          path="/profile" 
          label="Profile" 
          icon={(active) => (
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )} 
        />
      </div>
    </nav>
  );
};

export default MobileBottomNav;
