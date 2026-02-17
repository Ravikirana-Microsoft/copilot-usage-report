import * as XLSX from 'xlsx';
import type { ProcessedData } from '../types';
import { generateFilename } from './exportService';

/**
 * Create a styled worksheet from data
 */
const createWorksheet = <T>(
  data: T[],
  columns: { key: keyof T; header: string; width?: number }[]
): XLSX.WorkSheet => {
  const headers = columns.map((col) => col.header);
  const rows = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key];
      if (value === null || value === undefined) return '';
      return value;
    })
  );

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Set column widths
  ws['!cols'] = columns.map((col) => ({
    wch: col.width || Math.max(col.header.length, 12),
  }));

  return ws;
};

/**
 * Export all data to Excel workbook
 */
export const exportToExcel = (data: ProcessedData): void => {
  const { applications, branches, users, commits, fileTypes, summary, metadata } = data;

  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ['Copilot Usage Report'],
    [''],
    ['Analysis Name', metadata?.analysisName || 'N/A'],
    ['Date Range', metadata?.dateRange || 'N/A'],
    ['Generated', metadata?.timestamp || new Date().toISOString()],
    [''],
    ['Summary Metrics'],
    ['Metric', 'Value', 'AI', 'Human', 'AI %'],
    ['Commits', summary.totalCommits, summary.aiCommits, summary.humanCommits, `${summary.aiPercentage.toFixed(2)}%`],
    ['Lines', summary.totalLines, summary.aiLines, summary.humanLines, `${summary.linesAiPercentage.toFixed(2)}%`],
    [''],
    ['Tier Distribution'],
    ['Tier', 'Count'],
    ['Tier 1 (0-20%)', summary.tiers.tier1],
    ['Tier 2 (21-40%)', summary.tiers.tier2],
    ['Tier 3 (41-60%)', summary.tiers.tier3],
    ['Tier 4 (61-80%)', summary.tiers.tier4],
    ['Tier 5 (81-100%)', summary.tiers.tier5],
    [''],
    ['Overview'],
    ['Contributors', summary.contributorCount],
    ['Applications', summary.applicationCount],
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  // Applications sheet
  const appsWs = createWorksheet(applications, [
    { key: 'name', header: 'Application', width: 30 },
    { key: 'branch', header: 'Branch', width: 20 },
    { key: 'totalCommits', header: 'Total Commits', width: 12 },
    { key: 'aiCommits', header: 'AI Commits', width: 12 },
    { key: 'humanCommits', header: 'Human Commits', width: 14 },
    { key: 'aiPercentage', header: 'AI %', width: 8 },
    { key: 'totalLines', header: 'Total Lines', width: 12 },
    { key: 'aiLines', header: 'AI Lines', width: 10 },
    { key: 'contributors', header: 'Contributors', width: 12 },
    { key: 'tier', header: 'Tier', width: 6 },
  ]);
  XLSX.utils.book_append_sheet(wb, appsWs, 'Applications');

  // Branches sheet
  const branchesWs = createWorksheet(branches, [
    { key: 'application', header: 'Application', width: 30 },
    { key: 'branch', header: 'Branch', width: 25 },
    { key: 'totalCommits', header: 'Total Commits', width: 12 },
    { key: 'aiCommits', header: 'AI Commits', width: 12 },
    { key: 'humanCommits', header: 'Human Commits', width: 14 },
    { key: 'aiPercentage', header: 'AI %', width: 8 },
    { key: 'totalLines', header: 'Total Lines', width: 12 },
    { key: 'tier', header: 'Tier', width: 6 },
  ]);
  XLSX.utils.book_append_sheet(wb, branchesWs, 'Branches');

  // Contributors sheet
  const contributors = Object.values(users);
  const contribWs = createWorksheet(contributors, [
    { key: 'name', header: 'Contributor', width: 30 },
    { key: 'totalCommits', header: 'Total Commits', width: 12 },
    { key: 'aiCommits', header: 'AI Commits', width: 12 },
    { key: 'humanCommits', header: 'Human Commits', width: 14 },
    { key: 'aiPercentage', header: 'AI %', width: 8 },
    { key: 'totalLines', header: 'Total Lines', width: 12 },
    { key: 'aiLines', header: 'AI Lines', width: 10 },
    { key: 'humanLines', header: 'Human Lines', width: 12 },
  ]);
  XLSX.utils.book_append_sheet(wb, contribWs, 'Contributors');

  // File Types sheet
  const fileTypesWs = createWorksheet(fileTypes, [
    { key: 'extension', header: 'Extension', width: 15 },
    { key: 'fileCount', header: 'File Count', width: 12 },
    { key: 'totalLines', header: 'Total Lines', width: 12 },
    { key: 'aiLines', header: 'AI Lines', width: 10 },
    { key: 'humanLines', header: 'Human Lines', width: 12 },
    { key: 'aiPercentage', header: 'AI %', width: 8 },
  ]);
  XLSX.utils.book_append_sheet(wb, fileTypesWs, 'File Types');

  // Commits sheet (limit to 10000 for Excel compatibility)
  const limitedCommits = commits.slice(0, 10000);
  const commitsWs = createWorksheet(limitedCommits, [
    { key: 'hash', header: 'Hash', width: 12 },
    { key: 'author', header: 'Author', width: 25 },
    { key: 'date', header: 'Date', width: 20 },
    { key: 'message', header: 'Message', width: 50 },
    { key: 'linesAdded', header: 'Lines', width: 8 },
    { key: 'isAI', header: 'AI', width: 6 },
    { key: 'confidenceScore', header: 'Confidence', width: 10 },
    { key: 'application', header: 'Application', width: 25 },
  ]);
  XLSX.utils.book_append_sheet(wb, commitsWs, 'Commits');

  // Write file
  const filename = generateFilename('copilot-report', 'xlsx');
  XLSX.writeFile(wb, filename);
};

/**
 * Export specific sheet to Excel
 */
export const exportSheetToExcel = (
  data: Record<string, unknown>[],
  columns: { key: string; header: string; width?: number }[],
  sheetName: string
): void => {
  const wb = XLSX.utils.book_new();
  const ws = createWorksheet(data as Record<string, unknown>[], columns as { key: keyof Record<string, unknown>; header: string; width?: number }[]);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const filename = generateFilename(`copilot-${sheetName.toLowerCase()}`, 'xlsx');
  XLSX.writeFile(wb, filename);
};
