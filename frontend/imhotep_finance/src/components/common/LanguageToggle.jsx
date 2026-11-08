import { useLanguage } from '../../contexts/LanguageContext';

export default function LanguageToggle({ className = '' }) {
  const { language, setLanguage, supportedLanguages } = useLanguage();

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'ar' : 'en';
    setLanguage(nextLang);
  };

  const current = supportedLanguages[language] || supportedLanguages.en;

  return (
    <button
      onClick={toggleLanguage}
      className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold
        bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/30 dark:border-gray-700
        text-gray-700 dark:text-gray-200 shadow-md hover:shadow-lg hover:scale-105
        transition-all duration-200 cursor-pointer ${className}`}
      title={`Switch to ${language === 'en' ? 'العربية' : 'English'}`}
      aria-label="Toggle language"
    >
      <span className="text-sm" role="img" aria-hidden="true">
        🌐
      </span>
      <span>{current.nativeName}</span>
      <span className="text-[10px] uppercase font-mono px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
        {language.toUpperCase()}
      </span>
    </button>
  );
}
