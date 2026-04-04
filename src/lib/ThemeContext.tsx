import { createContext, useContext } from 'react';
import type { ThemeTokens } from './theme';
import { DARK } from './theme';

export const ThemeContext = createContext<ThemeTokens>(DARK);

export function useTheme(): ThemeTokens {
  return useContext(ThemeContext);
}
