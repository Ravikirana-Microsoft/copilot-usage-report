import type { ProcessedData, ApplicationData, UserData } from '../types';

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';
export type ExportScope = 'summary' | 'applications' | 'branches' | 'contributors' | 'commits' | 'fileTypes' | 'all';

export interface ExportOptions {
  format: ExportFormat;
  scope: ExportScope;
  includeCharts?: boolean;
  filename?: string;
}

/**
 * Generate filename with timestamp
 */
export const generateFilename = (prefix: string, extension: string): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${prefix}_${timestamp}.${extension}`;
};

/**
 * Trigger file download
 */
export const downloadFile = (content: string | Blob, filename: string, mimeType: string): void => {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Convert data to CSV format
 */
export const convertToCSV = <T>(data: T[], columns: { key: keyof T; header: string }[]): string => {
  if (data.length === 0) return '';

  const headers = columns.map((col) => `"${col.header}"`).join(',');
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col.key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        return String(value);
      })
      .join(',')
  );

  return [headers, ...rows].join('\n');
};

/**
 * Export summary data to CSV
 */
export const exportSummaryCSV = (data: ProcessedData): void => {
  const { summary, metadata } = data;
  
  const rows = [
    ['Metric', 'Value'],
    ['Analysis Name', metadata?.analysisName || 'N/A'],
    ['Date Range', metadata?.dateRange || 'N/A'],
    ['Timestamp', metadata?.timestamp || 'N/A'],
    [''],
    ['Total Commits', summary.totalCommits],
    ['AI Commits', summary.aiCommits],
    ['Human Commits', summary.humanCommits],
    ['AI Percentage', `${summary.aiPercentage.toFixed(2)}%`],
    [''],
    ['Total Lines', summary.totalLines],
    ['AI Lines', summary.aiLines],
    ['Human Lines', summary.humanLines],
    ['Lines AI Percentage', `${summary.linesAiPercentage.toFixed(2)}%`],
    [''],
    ['Contributors', summary.contributorCount],
    ['Applications', summary.applicationCount],
    [''],
    ['Tier 1 (0-20%)', summary.tiers.tier1],
    ['Tier 2 (21-40%)', summary.tiers.tier2],
    ['Tier 3 (41-60%)', summary.tiers.tier3],
    ['Tier 4 (61-80%)', summary.tiers.tier4],
    ['Tier 5 (81-100%)', summary.tiers.tier5],
  ];

  const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  const filename = generateFilename('copilot-summary', 'csv');
  downloadFile(csv, filename, 'text/csv;charset=utf-8');
};

/**
 * Export applications data to CSV
 */
export const exportApplicationsCSV = (applications: ApplicationData[]): void => {
  const columns: { key: keyof ApplicationData; header: string }[] = [
    { key: 'name', header: 'Application' },
    { key: 'branch', header: 'Branch' },
    { key: 'totalCommits', header: 'Total Commits' },
    { key: 'aiCommits', header: 'AI Commits' },
    { key: 'humanCommits', header: 'Human Commits' },
    { key: 'aiPercentage', header: 'AI %' },
    { key: 'totalLines', header: 'Total Lines' },
    { key: 'aiLines', header: 'AI Lines' },
    { key: 'humanLines', header: 'Human Lines' },
    { key: 'contributors', header: 'Contributors' },
    { key: 'tier', header: 'Tier' },
  ];

  const csv = convertToCSV(applications, columns);
  const filename = generateFilename('copilot-applications', 'csv');
  downloadFile(csv, filename, 'text/csv;charset=utf-8');
};

/**
 * Export contributors data to CSV
 */
export const exportContributorsCSV = (users: Record<string, UserData>): void => {
  const contributors = Object.values(users);
  
  const columns: { key: keyof UserData; header: string }[] = [
    { key: 'name', header: 'Contributor' },
    { key: 'totalCommits', header: 'Total Commits' },
    { key: 'aiCommits', header: 'AI Commits' },
    { key: 'humanCommits', header: 'Human Commits' },
    { key: 'aiPercentage', header: 'AI %' },
    { key: 'totalLines', header: 'Total Lines' },
    { key: 'aiLines', header: 'AI Lines' },
    { key: 'humanLines', header: 'Human Lines' },
  ];

  const csv = convertToCSV(contributors, columns);
  const filename = generateFilename('copilot-contributors', 'csv');
  downloadFile(csv, filename, 'text/csv;charset=utf-8');
};

/**
 * Export branches data to CSV
 */
export const exportBranchesCSV = (data: ProcessedData): void => {
  const { branches } = data;
  
  const csv = convertToCSV(branches, [
    { key: 'application', header: 'Application' },
    { key: 'branch', header: 'Branch' },
    { key: 'totalCommits', header: 'Total Commits' },
    { key: 'aiCommits', header: 'AI Commits' },
    { key: 'humanCommits', header: 'Human Commits' },
    { key: 'aiPercentage', header: 'AI %' },
    { key: 'totalLines', header: 'Total Lines' },
    { key: 'aiLines', header: 'AI Lines' },
    { key: 'tier', header: 'Tier' },
  ]);
  
  const filename = generateFilename('copilot-branches', 'csv');
  downloadFile(csv, filename, 'text/csv;charset=utf-8');
};

/**
 * Export commits data to CSV
 */
export const exportCommitsCSV = (data: ProcessedData): void => {
  const { commits } = data;
  
  const csv = convertToCSV(commits, [
    { key: 'hash', header: 'Hash' },
    { key: 'author', header: 'Author' },
    { key: 'date', header: 'Date' },
    { key: 'message', header: 'Message' },
    { key: 'linesAdded', header: 'Lines Added' },
    { key: 'isAI', header: 'Is AI' },
    { key: 'confidenceScore', header: 'Confidence' },
    { key: 'tierNumber', header: 'Tier' },
    { key: 'application', header: 'Application' },
  ]);
  
  const filename = generateFilename('copilot-commits', 'csv');
  downloadFile(csv, filename, 'text/csv;charset=utf-8');
};

/**
 * Export file types data to CSV
 */
export const exportFileTypesCSV = (data: ProcessedData): void => {
  const { fileTypes } = data;
  
  const csv = convertToCSV(fileTypes, [
    { key: 'extension', header: 'Extension' },
    { key: 'fileCount', header: 'File Count' },
    { key: 'totalLines', header: 'Total Lines' },
    { key: 'aiLines', header: 'AI Lines' },
    { key: 'humanLines', header: 'Human Lines' },
    { key: 'aiPercentage', header: 'AI %' },
  ]);
  
  const filename = generateFilename('copilot-filetypes', 'csv');
  downloadFile(csv, filename, 'text/csv;charset=utf-8');
};

/**
 * Export all data to JSON
 */
export const exportJSON = (data: ProcessedData): void => {
  const json = JSON.stringify(data, null, 2);
  const filename = generateFilename('copilot-report', 'json');
  downloadFile(json, filename, 'application/json');
};
