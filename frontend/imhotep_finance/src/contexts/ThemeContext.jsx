import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const THEME_KEY = 'theme-preference';

function getSystemPreference() {
	if (typeof window === 'undefined' || !window.matchMedia) return 'light';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeClass(theme) {
	if (typeof document === 'undefined') return;
	const root = document.documentElement;
	if (theme === 'dark') {
		root.classList.add('dark');
	} else {
		root.classList.remove('dark');
	}
}

export function ThemeProvider({ children }) {
	const [theme, setTheme] = useState(() => {
		const stored = localStorage.getItem(THEME_KEY);
		return stored === 'light' || stored === 'dark' ? stored : getSystemPreference();
	});

	useEffect(() => {
		applyThemeClass(theme);
		localStorage.setItem(THEME_KEY, theme);
	}, [theme]);

	useEffect(() => {
		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const handleChange = () => {
			const stored = localStorage.getItem(THEME_KEY);
			if (!stored) {
				setTheme(getSystemPreference());
			}
		};
		media.addEventListener?.('change', handleChange);
		return () => media.removeEventListener?.('change', handleChange);
	}, []);

	const value = useMemo(() => ({
		theme,
		setTheme,
		toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
	}), [theme]);

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

export function useTheme() {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
	return ctx;
}


