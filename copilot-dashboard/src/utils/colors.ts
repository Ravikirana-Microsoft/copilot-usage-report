// Consistent color palette for the entire application
// AI = Cyan Blue (#00bcf2), Human = Gray (#6b7280)

export const CHART_COLORS = {
  // Primary data colors
  ai: '#00bcf2',        // Cyan blue for AI-assisted
  human: '#6b7280',     // Gray for human/manual
  
  // RGBA versions for fills
  aiRgba: 'rgba(0, 188, 242, 0.2)',
  humanRgba: 'rgba(107, 114, 128, 0.2)',
  
  // Multi-series palette (for applications, users, etc.)
  palette: [
    '#00bcf2', // AI Blue
    '#107c10', // Green
    '#ffb900', // Yellow
    '#e81123', // Red
    '#886ce4', // Purple
    '#00b7c3', // Teal
    '#ff8c00', // Orange
    '#5c2d91', // Dark Purple
    '#0078d4', // Microsoft Blue
    '#008272', // Dark Teal
    '#c239b3', // Magenta
    '#498205', // Olive
  ],
  
  // Tier colors (confidence levels)
  tiers: {
    tier1: '#ef4444', // Red - Highest AI confidence (90%+)
    tier2: '#f97316', // Orange (70-90%)
    tier3: '#eab308', // Yellow (50-70%)
    tier4: '#22c55e', // Green (30-50%)
    tier5: '#06b6d4', // Cyan - Lowest/Human (<30%)
  },
  
  // Progress indicator colors
  progress: {
    high: '#ef4444',    // Red (high AI percentage)
    medium: '#f59e0b',  // Orange
    low: '#22c55e',     // Green (low AI percentage)
  },
  
  // Status colors
  status: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#0078d4',
  },
  
  // UI colors (dark theme)
  ui: {
    background: '#1a1a1a',
    cardBackground: '#252526',
    border: '#3e3e42',
    textPrimary: '#e4e4e7',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
  },
};

/**
 * Get progress color based on AI percentage
 */
export const getProgressColor = (percentage: number): string => {
  if (percentage >= 70) return CHART_COLORS.progress.high;
  if (percentage >= 40) return CHART_COLORS.progress.medium;
  return CHART_COLORS.progress.low;
};

/**
 * Get tier color by tier number
 */
export const getTierColor = (tier: number): string => {
  const tierKey = `tier${tier}` as keyof typeof CHART_COLORS.tiers;
  return CHART_COLORS.tiers[tierKey] || CHART_COLORS.tiers.tier5;
};

/**
 * Get color from palette by index (cycles through)
 */
export const getPaletteColor = (index: number): string => {
  return CHART_COLORS.palette[index % CHART_COLORS.palette.length];
};

/**
 * Convert hex to rgba
 */
export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Simplified color constants for components
export const COLORS = {
  AI_PRIMARY: CHART_COLORS.ai,
  HUMAN_PRIMARY: CHART_COLORS.human,
  AI_RGBA: CHART_COLORS.aiRgba,
  HUMAN_RGBA: CHART_COLORS.humanRgba,
};

// Tier colors flat export
export const TIER_COLORS = {
  tier1: CHART_COLORS.tiers.tier1,
  tier2: CHART_COLORS.tiers.tier2,
  tier3: CHART_COLORS.tiers.tier3,
  tier4: CHART_COLORS.tiers.tier4,
  tier5: CHART_COLORS.tiers.tier5,
};
