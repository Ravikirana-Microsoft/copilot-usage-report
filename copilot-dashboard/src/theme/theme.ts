import {
  createDarkTheme,
  createLightTheme,
} from '@fluentui/react-components';
import type {
  BrandVariants,
  Theme,
} from '@fluentui/react-components';

/**
 * Custom brand colors based on the dashboard's primary blue (#00bcf2)
 */
const brandVariants: BrandVariants = {
  10: '#001b24',
  20: '#003447',
  30: '#004d6a',
  40: '#00678d',
  50: '#0081b0',
  60: '#009bd3',
  70: '#00bcf2', // Primary color
  80: '#33c9f4',
  90: '#5cd5f6',
  100: '#85e0f8',
  110: '#adecfa',
  120: '#cef3fc',
  130: '#e6f9fe',
  140: '#f3fcff',
  150: '#ffffff',
  160: '#ffffff',
};

/**
 * Light theme based on Fluent UI with custom brand colors
 */
export const lightTheme: Theme = {
  ...createLightTheme(brandVariants),
};

/**
 * Dark theme based on Fluent UI with custom brand colors
 */
export const darkTheme: Theme = {
  ...createDarkTheme(brandVariants),
  // Override specific colors for better contrast in dark mode
  colorNeutralBackground1: '#1a1a2e',
  colorNeutralBackground2: '#16213e',
  colorNeutralBackground3: '#0f3460',
  colorNeutralBackground4: '#1a1a2e',
  colorBrandBackground: '#00bcf2',
  colorBrandBackgroundHover: '#009bd3',
  colorBrandBackgroundPressed: '#0081b0',
};

/**
 * Custom CSS variables for charts and other non-Fluent components
 */
export const chartColors = {
  ai: {
    primary: '#00bcf2',
    secondary: '#33c9f4',
    tertiary: '#5cd5f6',
    light: 'rgba(0, 188, 242, 0.3)',
    gradient: ['#00bcf2', '#5cd5f6'],
  },
  human: {
    primary: '#6b7280',
    secondary: '#9ca3af',
    tertiary: '#d1d5db',
    light: 'rgba(107, 114, 128, 0.3)',
    gradient: ['#6b7280', '#9ca3af'],
  },
  tiers: {
    tier1: '#ef4444', // High AI confidence - red
    tier2: '#f97316', // Medium-high AI - orange
    tier3: '#eab308', // Medium AI - yellow
    tier4: '#22c55e', // Low AI - green
    tier5: '#3b82f6', // Human - blue
  },
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  palette: [
    '#00bcf2',
    '#8b5cf6',
    '#ec4899',
    '#f97316',
    '#22c55e',
    '#3b82f6',
    '#ef4444',
    '#eab308',
    '#14b8a6',
    '#6366f1',
  ],
};

/**
 * Typography scales
 */
export const typography = {
  heading: {
    h1: { fontSize: '2rem', fontWeight: 600, lineHeight: 1.2 },
    h2: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3 },
    h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
    h4: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
  },
  body: {
    large: { fontSize: '1rem', lineHeight: 1.5 },
    medium: { fontSize: '0.875rem', lineHeight: 1.5 },
    small: { fontSize: '0.75rem', lineHeight: 1.4 },
  },
};

/**
 * Spacing scales
 */
export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  xxl: '3rem',
};

/**
 * Border radius scales
 */
export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};

/**
 * Shadow scales
 */
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};

/**
 * CSS custom properties for the theme
 */
export const getCSSVariables = (isDarkMode: boolean) => ({
  '--color-ai-primary': chartColors.ai.primary,
  '--color-ai-secondary': chartColors.ai.secondary,
  '--color-ai-light': chartColors.ai.light,
  '--color-human-primary': chartColors.human.primary,
  '--color-human-secondary': chartColors.human.secondary,
  '--color-human-light': chartColors.human.light,
  '--color-background': isDarkMode ? '#1a1a2e' : '#ffffff',
  '--color-surface': isDarkMode ? '#16213e' : '#f8fafc',
  '--color-text-primary': isDarkMode ? '#ffffff' : '#1e293b',
  '--color-text-secondary': isDarkMode ? '#94a3b8' : '#64748b',
  '--color-border': isDarkMode ? '#334155' : '#e2e8f0',
});
