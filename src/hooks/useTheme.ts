import { useColorScheme } from 'react-native';
import { useEffect, useState } from 'react';

import { getTheme, type AppTheme } from '@/db/preferences';

import { darkColors, lightColors } from '@/theme/colors';

export function useTheme() {
  const systemTheme = useColorScheme();

  const [theme, setTheme] = useState<AppTheme>('system');

  useEffect(() => {
    getTheme().then(setTheme);
  }, []);

  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  return {
    theme,
    resolvedTheme,
    colors: resolvedTheme === 'dark' ? darkColors : lightColors,
  };
}
