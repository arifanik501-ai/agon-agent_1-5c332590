// ── Theme system ──────────────────────────────────────────────────────────────

export type Theme = 'dark' | 'light';

const LS_KEY = 'lockin_theme';

export function loadTheme(): Theme {
  try {
    const t = localStorage.getItem(LS_KEY);
    if (t === 'light' || t === 'dark') return t;
  } catch { /* */ }
  return 'dark';
}

export function saveTheme(t: Theme) {
  try { localStorage.setItem(LS_KEY, t); } catch { /* */ }
}

// ── Token maps ────────────────────────────────────────────────────────────────

export interface ThemeTokens {
  // backgrounds
  bg:           string;
  bgSecondary:  string;
  surface:      string;
  surfaceHover: string;
  surfaceActive:string;
  // borders
  border:       string;
  borderStrong: string;
  // text
  text:         string;
  textMuted:    string;
  textDim:      string;
  // accents (same in both themes)
  primary:      string;
  primaryLight: string;
  primaryGlow:  string;
  success:      string;
  danger:       string;
  amber:        string;
  // tab bar
  tabBg:        string;
  tabBorder:    string;
  // card shimmer
  shimmer:      string;
  // input
  inputBg:      string;
  inputBorder:  string;
  // scrollbar
  scrollThumb:  string;
  // orb opacity
  orbOpacity:   string;
  // shadow
  cardShadow:   string;
}

export const DARK: ThemeTokens = {
  bg:            '#07070E',
  bgSecondary:   '#0F0F1A',
  surface:       'rgba(255,255,255,0.035)',
  surfaceHover:  'rgba(255,255,255,0.06)',
  surfaceActive: 'rgba(255,255,255,0.09)',
  border:        'rgba(255,255,255,0.07)',
  borderStrong:  'rgba(255,255,255,0.13)',
  text:          '#F0F0F8',
  textMuted:     'rgba(240,240,248,0.5)',
  textDim:       'rgba(240,240,248,0.28)',
  primary:       '#7C3AED',
  primaryLight:  '#A78BFA',
  primaryGlow:   'rgba(124,58,237,0.35)',
  success:       '#10B981',
  danger:        '#EF4444',
  amber:         '#F59E0B',
  tabBg:         'rgba(7,7,14,0.92)',
  tabBorder:     'rgba(255,255,255,0.06)',
  shimmer:       'rgba(255,255,255,0.1)',
  inputBg:       'rgba(255,255,255,0.04)',
  inputBorder:   'rgba(255,255,255,0.09)',
  scrollThumb:   'rgba(124,58,237,0.4)',
  orbOpacity:    '0.07',
  cardShadow:    '0 4px 24px rgba(0,0,0,0.35)',
};

export const LIGHT: ThemeTokens = {
  bg:            '#F5F4FF',
  bgSecondary:   '#FFFFFF',
  surface:       'rgba(255,255,255,0.85)',
  surfaceHover:  'rgba(255,255,255,0.95)',
  surfaceActive: 'rgba(124,58,237,0.06)',
  border:        'rgba(124,58,237,0.12)',
  borderStrong:  'rgba(124,58,237,0.25)',
  text:          '#1A1035',
  textMuted:     'rgba(26,16,53,0.55)',
  textDim:       'rgba(26,16,53,0.35)',
  primary:       '#7C3AED',
  primaryLight:  '#6D28D9',
  primaryGlow:   'rgba(124,58,237,0.2)',
  success:       '#059669',
  danger:        '#DC2626',
  amber:         '#D97706',
  tabBg:         'rgba(245,244,255,0.94)',
  tabBorder:     'rgba(124,58,237,0.1)',
  shimmer:       'rgba(124,58,237,0.08)',
  inputBg:       'rgba(255,255,255,0.9)',
  inputBorder:   'rgba(124,58,237,0.18)',
  scrollThumb:   'rgba(124,58,237,0.3)',
  orbOpacity:    '0.06',
  cardShadow:    '0 4px 24px rgba(124,58,237,0.08)',
};

export function getTokens(theme: Theme): ThemeTokens {
  return theme === 'light' ? LIGHT : DARK;
}
