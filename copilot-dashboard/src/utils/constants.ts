// Application constants

// Tab/View identifiers
export const VIEWS = {
  OVERVIEW: 'overview',
  APPLICATIONS: 'applications',
  BRANCHES: 'branches',
  CONTRIBUTORS: 'contributors',
  COMMITS: 'commits',
  FILE_TYPES: 'fileTypes',
  TIERS: 'tiers',
  COMPARISON: 'comparison',
  LEADERBOARD: 'leaderboard',
  PR_ANALYSIS: 'prAnalysis',
} as const;

export type ViewType = typeof VIEWS[keyof typeof VIEWS];

// Tab configuration
export const TAB_CONFIG = [
  { id: VIEWS.OVERVIEW, label: 'Overview' },
  { id: VIEWS.APPLICATIONS, label: 'Applications' },
  { id: VIEWS.BRANCHES, label: 'Branches' },
  { id: VIEWS.CONTRIBUTORS, label: 'Contributors' },
  { id: VIEWS.COMMITS, label: 'Commits' },
  { id: VIEWS.FILE_TYPES, label: 'File Types' },
  { id: VIEWS.TIERS, label: 'Tier Analysis' },
  { id: VIEWS.COMPARISON, label: 'Compare Repos' },
  { id: VIEWS.LEADERBOARD, label: 'Leaderboard' },
  { id: VIEWS.PR_ANALYSIS, label: '🔍 PR Analysis', special: true },
];

// Default pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

// Chart defaults
export const CHART_DEFAULTS = {
  TOP_CONTRIBUTORS_COUNT: 10,
  TOP_FILE_TYPES_COUNT: 10,
  TOP_APPLICATIONS_COUNT: 10,
  BAR_BORDER_RADIUS: 4,
  PIE_BORDER_WIDTH: 2,
  LINE_TENSION: 0.4,
};

// Local storage keys
export const STORAGE_KEYS = {
  THEME: 'copilot-dashboard-theme',
  LAST_REPORT: 'copilot-dashboard-last-report',
  PAGE_SIZE: 'copilot-dashboard-page-size',
};

// Report file paths
export const REPORT_PATHS = {
  CONSOLIDATED_DIR: 'consolidated',
  REPORTS_DIR: 'reports',
  DEFAULT_REPORT: 'consolidated/ConsolidatedReport_latest.json',
};

// GitHub Actions
export const GITHUB_ACTIONS = {
  WORKFLOW_FILE: 'code-analysis.yml',
  API_URL: 'https://api.github.com',
};

// Time constants
export const TIME = {
  REFRESH_INTERVAL: 30000, // 30 seconds
  DEBOUNCE_DELAY: 300, // 300ms for search
  ANIMATION_DURATION: 300,
};

// Tier descriptions
export const TIER_DESCRIPTIONS = {
  1: 'High AI confidence (90%+) - Likely AI-generated',
  2: 'Medium-high AI confidence (70-90%)',
  3: 'Medium AI confidence (50-70%)',
  4: 'Low AI confidence (30-50%)',
  5: 'Very low AI confidence (<30%) - Likely human-written',
};

// Export formats
export const EXPORT_FORMATS = {
  CSV: 'csv',
  PDF: 'pdf',
  EXCEL: 'xlsx',
} as const;

export type ExportFormat = typeof EXPORT_FORMATS[keyof typeof EXPORT_FORMATS];
