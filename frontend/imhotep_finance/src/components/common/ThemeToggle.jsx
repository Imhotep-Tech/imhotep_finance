import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
	const { theme, toggleTheme } = useTheme();

	return (
		<button
			onClick={toggleTheme}
			aria-label="Toggle color theme"
			title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
			className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-200 bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 hover:scale-105 shadow-sm ${className}`}
		>
			{theme === 'dark' ? (
				/* Sun icon */
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-400">
					<path d="M12 18a6 6 0 100-12 6 6 0 000 12z" />
					<path fillRule="evenodd" d="M12 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm0 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm10-7a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM4 12a1 1 0 01-1 1H2a1 1 0 110-2h1a1 1 0 011 1zm14.95 6.364a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM6.464 6.464a1 1 0 010 1.414l-.707.707A1 1 0 113.343 7.17l.707-.707a1 1 0 011.414 0zm11.314-2.828a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM6.464 17.536a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414z" clipRule="evenodd" />
				</svg>
			) : (
				/* Moon icon */
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-700">
					<path d="M21.752 15.002A9.718 9.718 0 0112 21.75 9.75 9.75 0 1112 3a9.718 9.718 0 019.752 6.748A7.5 7.5 0 0021.75 12c0 1.077-.224 2.102-.629 3.002h.631z" />
				</svg>
			)}
		</button>
	);
};

export default ThemeToggle;


