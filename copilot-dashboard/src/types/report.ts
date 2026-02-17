// Report metadata
export interface ReportMetadata {
  analysisName: string;
  timestamp: string;
  timestampUTC: string;
  dateRange: string;
}

// File type analysis from raw data
export interface FileTypeAnalysisItem {
  FileCount: number;
  TotalLines: number;
  AILines: number;
  AIPercentage: number;
  Extension: string;
}

// Branch analysis from raw data
export interface BranchAnalysisItem {
  Application: string;
  Branch: string;
  TotalCommits: number;
  AICommits: number;
  HumanCommits: number;
  TotalLines: number;
  AILines: number;
  HumanLines: number;
  AIPercentage: number;
  Tier1: number;
  Tier2: number;
  Tier3: number;
  Tier4: number;
  Tier5: number;
}

// Commit data from raw data
export interface CommitItem {
  Hash: string;
  Author: string;
  Date: string;
  Message: string;
  LinesAdded: number;
  IsAI: boolean;
  ConfidenceScore: number;
  TierNumber: number;
}

// User analysis from raw data
export interface UserAnalysisItem {
  Author: string;
  TotalCommits: number;
  AICommits: number;
  HumanCommits: number;
  TotalLines: number;
  AILines: number;
  HumanLines: number;
  AIPercentage: number;
  Application?: string;
}

// Raw report data structure (from JSON files)
export interface RawReportData {
  _metadata?: ReportMetadata;
  fileTypeAnalysis?: FileTypeAnalysisItem[];
  branchAnalysis?: BranchAnalysisItem[];
  userAnalysis?: UserAnalysisItem[];
  commits?: CommitItem[];
  applications?: ApplicationReportData[];
}

// Application-specific report data
export interface ApplicationReportData {
  applicationName: string;
  branch: string;
  analysisDate: string;
  branchAnalysis?: BranchAnalysisItem[];
  userAnalysis?: UserAnalysisItem[];
  commits?: CommitItem[];
  fileTypeAnalysis?: FileTypeAnalysisItem[];
}

// Processed application data for display
export interface ApplicationData {
  name: string;
  branch: string;
  totalCommits: number;
  aiCommits: number;
  humanCommits: number;
  totalLines: number;
  aiLines: number;
  humanLines: number;
  aiPercentage: number;
  contributors: number;
  tier: number;
  tiers: TierData;
}

// Tier distribution data
export interface TierData {
  tier1: number;
  tier2: number;
  tier3: number;
  tier4: number;
  tier5: number;
}

// Processed branch data for display
export interface BranchData {
  application: string;
  branch: string;
  totalCommits: number;
  aiCommits: number;
  humanCommits: number;
  totalLines: number;
  aiLines: number;
  humanLines: number;
  aiPercentage: number;
  tier: number;
  tiers: TierData;
}

// Application stats per user
export interface UserApplicationStats {
  totalCommits: number;
  aiCommits: number;
  totalLines: number;
  aiLines: number;
}

// Processed user data for display
export interface UserData {
  name: string;
  totalCommits: number;
  aiCommits: number;
  humanCommits: number;
  totalLines: number;
  aiLines: number;
  humanLines: number;
  aiPercentage: number;
  applications: Record<string, UserApplicationStats>;
}

// Processed commit data for display
export interface CommitData {
  hash: string;
  author: string;
  date: string;
  message: string;
  linesAdded: number;
  isAI: boolean;
  confidenceScore: number;
  tierNumber: number;
  application: string;
}

// File type data for display
export interface FileTypeData {
  extension: string;
  fileCount: number;
  totalLines: number;
  aiLines: number;
  humanLines: number;
  aiPercentage: number;
}

// Summary statistics
export interface SummaryData {
  totalCommits: number;
  aiCommits: number;
  humanCommits: number;
  totalLines: number;
  aiLines: number;
  humanLines: number;
  aiPercentage: number;
  linesAiPercentage: number;
  contributorCount: number;
  applicationCount: number;
  tiers: TierData;
}

// Fully processed data for the dashboard
export interface ProcessedData {
  applications: ApplicationData[];
  branches: BranchData[];
  users: Record<string, UserData>;
  commits: CommitData[];
  fileTypes: FileTypeData[];
  metadata: ReportMetadata | null;
  summary: SummaryData;
}

// Report configuration
export interface ReportOption {
  label: string;
  path: string;
  analysisName?: string;
}

export interface ReportConfig {
  latestReport: string;
  archivedReports: ReportOption[];
  lastUpdated: string;
}

// Type aliases for table components (maps to processed data types)
export type Application = ApplicationData;
export type Branch = BranchData;
export type Contributor = UserData;
export type FileType = FileTypeData;

// Commit type for tables
export interface Commit {
  hash: string;
  author: string;
  date: string;
  message: string;
  linesAdded: number;
  linesDeleted: number;
  isAI: boolean;
  confidenceScore: number;
  tierNumber: number;
  application?: string;
}

// Tier summary for tables
export interface Tier {
  tier: number;
  count: number;
  percentage: number;
  totalCommits: number;
  aiCommits: number;
  avgAIPercentage: number;
}
