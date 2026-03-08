import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useGameStore } from '../stores/gameStore';
import { getTheme, ThemeColors } from '../utils/theme';

export const useTheme = (): ThemeColors => {
  const themeMode = useGameStore((state) => state.theme);
  const systemColorScheme = useColorScheme();
  
  return useMemo(() => {
    // If theme is 'auto', use system color scheme
    if (themeMode === 'auto') {
      const effectiveTheme = systemColorScheme === 'dark' ? 'dark' : 'light';
      return getTheme(effectiveTheme);
    }
    return getTheme(themeMode);
  }, [themeMode, systemColorScheme]);
};

// Hook to get the actual effective theme (for status bar, etc.)
export const useEffectiveTheme = (): 'light' | 'dark' => {
  const themeMode = useGameStore((state) => state.theme);
  const systemColorScheme = useColorScheme();
  
  if (themeMode === 'auto') {
    return systemColorScheme === 'dark' ? 'dark' : 'light';
  }
  return themeMode === 'dark' ? 'dark' : 'light';
};

export const useTranslation = () => {
  const t = useGameStore((state) => state.t);
  const language = useGameStore((state) => state.language);
  return { t, language };
};
