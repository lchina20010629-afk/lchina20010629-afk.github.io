import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getTheme, setTheme as saveTheme } from '../lib/storage';

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';
type ThemePalette = 'cream-green' | 'fresh-blue' | 'warm-apricot' | 'light-purple';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  palette: ThemePalette;
  setTheme: (theme: ThemeMode) => void;
  setPalette: (palette: ThemePalette) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [palette, setPaletteState] = useState<ThemePalette>('cream-green');
  const [isInitialized, setIsInitialized] = useState(false);

  // 从系统获取偏好
  const getSystemTheme = (): ResolvedTheme => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // 解析主题
  const resolveTheme = (themeMode: ThemeMode): ResolvedTheme => {
    if (themeMode === 'system') {
      return getSystemTheme();
    }
    return themeMode;
  };

  // 初始化主题和调色板 (防止闪烁)
  useEffect(() => {
    const init = async () => {
      // Load saved theme
      const savedTheme = await getTheme();
      
      // Load saved palette from localStorage
      const savedPalette = localStorage.getItem('theme-palette') as ThemePalette | null;
      
      setThemeState(savedTheme);
      setResolvedTheme(resolveTheme(savedTheme));
      if (savedPalette && ['cream-green', 'fresh-blue', 'warm-apricot', 'light-purple'].includes(savedPalette)) {
        setPaletteState(savedPalette);
      }
      
      setIsInitialized(true);
    };
    
    init();
  }, []);

  // 监听系统主题变化
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') {
        setResolvedTheme(getSystemTheme());
      }
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  // 应用主题和调色板到 DOM (after initialization to prevent flash)
  useEffect(() => {
    if (!isInitialized) return;
    
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    document.documentElement.setAttribute('data-palette', palette);
  }, [resolvedTheme, palette, isInitialized]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    setResolvedTheme(resolveTheme(newTheme));
    saveTheme(newTheme);
  };

  const setPalette = (newPalette: ThemePalette) => {
    setPaletteState(newPalette);
    // Save palette to localStorage (non-sensitive UI preference)
    localStorage.setItem('theme-palette', newPalette);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, palette, setTheme, setPalette }}>
      {children}
    </ThemeContext.Provider>
  );
}
