import { useMemo } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getTheme, ThemeColors } from '../utils/theme';

export const useTheme = (): ThemeColors => {
  const theme = useGameStore((state) => state.theme);
  return useMemo(() => getTheme(theme), [theme]);
};

export const useTranslation = () => {
  const t = useGameStore((state) => state.t);
  const language = useGameStore((state) => state.language);
  return { t, language };
};
