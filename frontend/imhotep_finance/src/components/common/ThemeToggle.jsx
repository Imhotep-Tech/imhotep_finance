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
				// Sun icon (outline)
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-yellow-400">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3v2.25M12 18.75V21M4.219 4.219l1.591 1.591M18.19 18.19l1.591 1.591M3 12h2.25M18.75 12H21M4.219 19.781l1.591-1.591M18.19 5.81l1.591-1.591M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
				</svg>
			) : (
				// Moon icon (outline)
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-gray-700">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21.752 15.002A9.718 9.718 0 0112 21.75a9.75 9.75 0 01-9.75-9.75 9.718 9.718 0 016.748-9.752 7.5 7.5 0 109.754 12.754z" />
				</svg>
			)}
		</button>
	);
};

export default ThemeToggle;


