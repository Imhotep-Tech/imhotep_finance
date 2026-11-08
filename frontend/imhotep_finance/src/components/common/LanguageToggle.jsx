import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function LanguageToggle({ className = '', align = 'right' }) {
  const { language, setLanguage, supportedLanguages, currentLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (langCode) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  const current = currentLanguage || supportedLanguages[language] || supportedLanguages.en;

  const alignClass = align === 'left' ? 'left-0' : 'right-0';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold
          bg-white/85 dark:bg-gray-800/85 backdrop-blur-xl border border-white/40 dark:border-gray-700
          text-gray-800 dark:text-gray-200 shadow-md hover:shadow-lg hover:scale-105
          transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#366c6b]/50"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Change language"
      >
        <span className="text-base" role="img" aria-hidden="true">
          {current.flag || '🌐'}
        </span>
        <span className="font-medium">{current.nativeName}</span>
        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
          {language.toUpperCase()}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute ${alignClass} mt-2 w-48 rounded-2xl shadow-2xl z-50
            bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-gray-200/80 dark:border-gray-700/80
            py-1.5 focus:outline-none animate-fadeIn`}
          role="listbox"
          aria-label="Available languages"
        >
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
            Select Language / اختر اللغة
          </div>
          {Object.values(supportedLanguages).map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left rtl:text-right
                  transition-colors duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-[#eaf6f6] dark:bg-[#366c6b]/20 text-[#366c6b] dark:text-teal-300 font-bold'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base" role="img" aria-hidden="true">
                    {lang.flag}
                  </span>
                  <div>
                    <div className="font-semibold">{lang.nativeName}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">{lang.name}</div>
                  </div>
                </div>
                {isSelected && (
                  <svg className="w-4 h-4 text-[#366c6b] dark:text-teal-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}