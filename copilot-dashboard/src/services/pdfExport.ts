import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ProcessedData } from '../types';
import { generateFilename } from './exportService';
import { formatNumber, formatPercentage } from '../utils/formatters';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: { finalY: number };
  }
}

// Colors
const COLORS = {
  primary: [0, 188, 242] as [number, number, number],      // AI Blue
  secondary: [107, 114, 128] as [number, number, number],  // Gray
  success: [34, 197, 94] as [number, number, number],      // Green
  warning: [249, 115, 22] as [number, number, number],     // Orange
  danger: [239, 68, 68] as [number, number, number],       // Red
  dark: [30, 30, 30] as [number, number, number],
  light: [250, 250, 250] as [number, number, number],
};

/**
 * Add header to PDF page
 */
const addHeader = (doc: jsPDF, title: string, y: number = 15): number => {
  // Title
  doc.setFontSize(20);
  doc.setTextColor(...COLORS.dark);
  doc.text(title, 14, y);
  
  // Underline
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(14, y + 3, 196, y + 3);
  
  return y + 12;
};

/**
 * Add section header
 */
const addSectionHeader = (doc: jsPDF, title: string, y: number): number => {
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primary);
  doc.text(title, 14, y);
  return y + 8;
};

/**
 * Add metadata section
 */
const addMetadata = (doc: jsPDF, data: ProcessedData, y: number): number => {
  const { metadata } = data;
  
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.secondary);
  
  const items = [
    `Analysis: ${metadata?.analysisName || 'N/A'}`,
    `Date Range: ${metadata?.dateRange || 'N/A'}`,
    `Generated: ${new Date().toLocaleString()}`,
  ];
  
  items.forEach((item, index) => {
    doc.text(item, 14, y + (index * 5));
  });
  
  return y + 20;
};

/**
 * Add summary stats
 */
const addSummaryStats = (doc: jsPDF, data: ProcessedData, y: number): number => {
  const { summary } = data;
  
  y = addSectionHeader(doc, 'Summary Statistics', y);
  
  const statsData = [
    ['Metric', 'Total', 'AI', 'Human', 'AI %'],
    [
      'Commits',
      formatNumber(summary.totalCommits),
      formatNumber(summary.aiCommits),
      formatNumber(summary.humanCommits),
      formatPercentage(summary.aiPercentage),
    ],
    [
      'Lines',
      formatNumber(summary.totalLines),
      formatNumber(summary.aiLines),
      formatNumber(summary.humanLines),
      formatPercentage(summary.linesAiPercentage),
    ],
  ];

  autoTable(doc, {
    startY: y,
    head: [statsData[0]],
    body: statsData.slice(1),
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      4: { textColor: COLORS.primary },
    },
  });

  return doc.lastAutoTable.finalY + 10;
};

/**
 * Add tier distribution
 */
const addTierDistribution = (doc: jsPDF, data: ProcessedData, y: number): number => {
  const { summary } = data;
  
  y = addSectionHeader(doc, 'Tier Distribution', y);
  
  const tierData = [
    ['Tier', 'Range', 'Count'],
    ['Tier 1', '0-20% AI', String(summary.tiers.tier1)],
    ['Tier 2', '21-40% AI', String(summary.tiers.tier2)],
    ['Tier 3', '41-60% AI', String(summary.tiers.tier3)],
    ['Tier 4', '61-80% AI', String(summary.tiers.tier4)],
    ['Tier 5', '81-100% AI', String(summary.tiers.tier5)],
  ];

  autoTable(doc, {
    startY: y,
    head: [tierData[0]],
    body: tierData.slice(1),
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: 255,
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
  });

  return doc.lastAutoTable.finalY + 10;
};

/**
 * Add top applications table
 */
const addTopApplications = (doc: jsPDF, data: ProcessedData, y: number): number => {
  const { applications } = data;
  
  // Check if we need a new page
  if (y > 220) {
    doc.addPage();
    y = 20;
  }
  
  y = addSectionHeader(doc, 'Top Applications by AI Usage', y);
  
  // Sort by AI percentage and take top 15
  const topApps = [...applications]
    .sort((a, b) => b.aiPercentage - a.aiPercentage)
    .slice(0, 15);

  const appData = topApps.map((app) => [
    app.name.length > 30 ? app.name.substring(0, 27) + '...' : app.name,
    formatNumber(app.totalCommits),
    formatNumber(app.aiCommits),
    formatPercentage(app.aiPercentage),
    String(app.tier),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Application', 'Commits', 'AI Commits', 'AI %', 'Tier']],
    body: appData,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: 255,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 70 },
      3: { textColor: COLORS.primary },
    },
  });

  return doc.lastAutoTable.finalY + 10;
};

/**
 * Add top contributors table
 */
const addTopContributors = (doc: jsPDF, data: ProcessedData, y: number): number => {
  const { users } = data;
  
  // Check if we need a new page
  if (y > 200) {
    doc.addPage();
    y = 20;
  }
  
  y = addSectionHeader(doc, 'Top Contributors by AI Usage', y);
  
  // Sort by AI percentage and take top 15
  const contributors = Object.values(users)
    .sort((a, b) => b.aiPercentage - a.aiPercentage)
    .slice(0, 15);

  const contribData = contributors.map((c) => [
    c.name.length > 25 ? c.name.substring(0, 22) + '...' : c.name,
    formatNumber(c.totalCommits),
    formatNumber(c.aiCommits),
    formatPercentage(c.aiPercentage),
    formatNumber(c.totalLines),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Contributor', 'Commits', 'AI Commits', 'AI %', 'Lines']],
    body: contribData,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: 255,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      3: { textColor: COLORS.primary },
    },
  });

  return doc.lastAutoTable.finalY + 10;
};

/**
 * Add footer with page numbers
 */
const addFooter = (doc: jsPDF): void => {
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.secondary);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    doc.text(
      'Generated by Copilot Usage Dashboard',
      14,
      doc.internal.pageSize.height - 10
    );
  }
};

/**
 * Export full report to PDF
 */
export const exportToPDF = (data: ProcessedData): void => {
  const doc = new jsPDF();
  
  let y = addHeader(doc, 'Copilot Usage Report');
  y = addMetadata(doc, data, y);
  y = addSummaryStats(doc, data, y);
  y = addTierDistribution(doc, data, y);
  y = addTopApplications(doc, data, y);
  y = addTopContributors(doc, data, y);
  
  addFooter(doc);

  const filename = generateFilename('copilot-report', 'pdf');
  doc.save(filename);
};

/**
 * Export summary-only PDF
 */
export const exportSummaryPDF = (data: ProcessedData): void => {
  const doc = new jsPDF();
  
  let y = addHeader(doc, 'Copilot Usage Summary');
  y = addMetadata(doc, data, y);
  y = addSummaryStats(doc, data, y);
  y = addTierDistribution(doc, data, y);
  
  addFooter(doc);

  const filename = generateFilename('copilot-summary', 'pdf');
  doc.save(filename);
};
