import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ProcessedData, RawReportData } from '../../types';
import { processReportData } from '../../services/dataProcessor';

// Extend Window interface for embedded report data
declare global {
  interface Window {
    EMBEDDED_REPORT_DATA?: RawReportData;
  }
}

// Report index entry type
interface ReportIndexEntry {
  filename: string;
  name: string;
  date: string;
  dateRange: string;
}

// Historical data point for trend chart (aggregated from all reports)
export interface HistoricalReportData {
  date: string;
  name: string;
  aiCommits: number;
  humanCommits: number;
  totalCommits: number;
  aiPercentage: number;
  humanPercentage: number;
  aiLines: number;
  humanLines: number;
  totalLines: number;
}

interface ReportState {
  // Raw data from JSON
  rawData: RawReportData | null;
  // Processed data for display
  processedData: ProcessedData | null;
  // Available reports to select (from index.json)
  availableReports: ReportIndexEntry[];
  // Historical data aggregated from all reports
  historicalData: HistoricalReportData[];
  // Currently selected report path
  currentReportPath: string;
  // Loading state
  loading: boolean;
  // Historical data loading state
  historicalLoading: boolean;
  // Error message
  error: string | null;
  // Last updated timestamp
  lastUpdated: string | null;
}

const initialState: ReportState = {
  rawData: null,
  processedData: null,
  availableReports: [],
  historicalData: [],
  currentReportPath: '',
  loading: false,
  historicalLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunk to fetch report data
export const fetchReport = createAsyncThunk(
  'report/fetchReport',
  async (reportPath: string, { rejectWithValue }) => {
    try {
      const response = await fetch(reportPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch report: ${response.statusText}`);
      }
      const data = await response.json();
      return { data, path: reportPath };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch report';
      return rejectWithValue(message);
    }
  }
);

// Async thunk to fetch available reports list
export const fetchAvailableReports = createAsyncThunk(
  'report/fetchAvailableReports',
  async (_, { rejectWithValue }) => {
    try {
      // Try to fetch report config or list of reports
      const response = await fetch('reports/config.json');
      if (response.ok) {
        const config = await response.json();
        return config.reports || [];
      }
      // Fallback - return empty array
      return [];
    } catch {
      return rejectWithValue('Failed to fetch available reports');
    }
  }
);

// Async thunk to fetch reports index from public folder
export const fetchReportsIndex = createAsyncThunk(
  'report/fetchReportsIndex',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const basePath = import.meta.env.BASE_URL || '/';
      const response = await fetch(`${basePath}reports/index.json`);
      if (!response.ok) {
        throw new Error('Failed to fetch reports index');
      }
      const index = await response.json();
      
      // Auto-load the first (latest) report
      if (index.reports && index.reports.length > 0) {
        const latestReport = index.reports[0];
        dispatch(fetchReport(`${basePath}reports/${latestReport.filename}`));
        
        // Also fetch all historical data for the trend chart
        dispatch(fetchAllHistoricalData(index.reports));
      }
      
      return index.reports || [];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch reports index';
      return rejectWithValue(message);
    }
  }
);

// Async thunk to fetch all historical reports for trend data
export const fetchAllHistoricalData = createAsyncThunk(
  'report/fetchAllHistoricalData',
  async (reports: ReportIndexEntry[], { rejectWithValue }) => {
    try {
      const basePath = import.meta.env.BASE_URL || '/';
      const historicalData: HistoricalReportData[] = [];
      
      // Fetch summary data from each report (limit to last 24 reports for performance)
      const reportsToFetch = reports.slice(0, 24);
      
      const fetchPromises = reportsToFetch.map(async (report) => {
        try {
          const response = await fetch(`${basePath}reports/${report.filename}`);
          if (!response.ok) return null;
          
          const rawData = await response.json();
          
          // Extract summary statistics from the report
          let totalCommits = 0;
          let aiCommits = 0;
          let humanCommits = 0;
          let aiLines = 0;
          let humanLines = 0;
          let totalLines = 0;
          
          // Handle the report data structure: { _metadata: {...}, data: [...] } or legacy array format
          // This matches the original HTML dashboard's approach
          let items: Array<{ BranchStatistics?: { 
            TotalCommits?: number; 
            AICommits?: number; 
            HumanCommits?: number; 
            TotalLinesAdded?: number; 
            AILinesAdded?: number;
            HumanLinesAdded?: number;
          }}>;
          
          if (rawData._metadata && rawData.data) {
            // New format with metadata
            items = Array.isArray(rawData.data) ? rawData.data : [rawData.data];
          } else if (Array.isArray(rawData)) {
            // Legacy array format
            items = rawData;
          } else {
            // Single item
            items = [rawData];
          }
          
          // Aggregate from BranchStatistics (same as original HTML dashboard)
          items.forEach((item) => {
            if (item.BranchStatistics) {
              totalCommits += item.BranchStatistics.TotalCommits || 0;
              aiCommits += item.BranchStatistics.AICommits || 0;
              humanCommits += item.BranchStatistics.HumanCommits || 0;
              totalLines += item.BranchStatistics.TotalLinesAdded || 0;
              aiLines += item.BranchStatistics.AILinesAdded || 0;
              humanLines += item.BranchStatistics.HumanLinesAdded || 0;
            }
          });
          
          // Fallback: try branchAnalysis array if no BranchStatistics found
          if (totalLines === 0 && rawData.branchAnalysis && Array.isArray(rawData.branchAnalysis)) {
            rawData.branchAnalysis.forEach((branch: { TotalCommits?: number; AICommits?: number; HumanCommits?: number; AILines?: number; HumanLines?: number; TotalLines?: number }) => {
              totalCommits += branch.TotalCommits || 0;
              aiCommits += branch.AICommits || 0;
              humanCommits += branch.HumanCommits || 0;
              aiLines += branch.AILines || 0;
              humanLines += branch.HumanLines || 0;
              totalLines += branch.TotalLines || 0;
            });
          }
          
          // Calculate AI percentage based on lines (same as original dashboard)
          const aiPercentage = totalLines > 0 
            ? (aiLines / totalLines) * 100 
            : 0;
          
          const humanPercentage = totalLines > 0
            ? (humanLines / totalLines) * 100
            : 0;
          
          // Use analysis name from metadata if available
          const analysisName = rawData._metadata?.analysisName || report.name || report.dateRange || report.date;
          
          return {
            date: report.date,
            name: analysisName,
            aiCommits,
            humanCommits,
            totalCommits,
            aiPercentage,
            humanPercentage,
            aiLines,
            humanLines,
            totalLines,
          };
        } catch {
          return null;
        }
      });
      
      const results = await Promise.all(fetchPromises);
      
      // Filter out nulls and sort by date (oldest first for chart)
      results.forEach((result) => {
        if (result && result.totalCommits > 0) {
          historicalData.push(result);
        }
      });
      
      // Sort by date (oldest first)
      historicalData.sort((a, b) => a.date.localeCompare(b.date));
      
      return historicalData;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch historical data';
      return rejectWithValue(message);
    }
  }
);

// Async thunk to load embedded data from window or try default report
export const loadEmbeddedData = createAsyncThunk(
  'report/loadEmbeddedData',
  async (_, { dispatch, rejectWithValue }) => {
    // First check for embedded data in window
    if (window.EMBEDDED_REPORT_DATA) {
      return window.EMBEDDED_REPORT_DATA;
    }
    
    // Try to load from reports/consolidated folder - get latest report
    const consolidatedPaths = [
      '../reports/consolidated/',
      'reports/consolidated/',
      './reports/consolidated/',
    ];
    
    for (const basePath of consolidatedPaths) {
      try {
        // Try to fetch the consolidated directory listing
        const indexResponse = await fetch(`${basePath}index.json`);
        if (indexResponse.ok) {
          const index = await indexResponse.json();
          if (index.reports && index.reports.length > 0) {
            const latestReport = index.reports[0];
            const reportResponse = await fetch(`${basePath}${latestReport}`);
            if (reportResponse.ok) {
              return await reportResponse.json();
            }
          }
        }
      } catch {
        // Continue to next path
      }
    }
    
    // Try to load a default report
    try {
      const response = await fetch('data/report.json');
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch {
      // Ignore - no default report available
    }
    
    // Also try to fetch available reports
    dispatch(fetchAvailableReports());
    
    return rejectWithValue('No embedded data or default report found. Use the file picker to load a report.');
  }
);

// Async thunk to load report from File object
export const loadReportFromFile = createAsyncThunk(
  'report/loadReportFromFile',
  async (file: File, { rejectWithValue }) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      return { data, filename: file.name };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse JSON file';
      return rejectWithValue(message);
    }
  }
);

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    // Set available reports manually
    setAvailableReports: (state, action: PayloadAction<ReportIndexEntry[]>) => {
      state.availableReports = action.payload;
    },
    // Set current report path
    setCurrentReportPath: (state, action: PayloadAction<string>) => {
      state.currentReportPath = action.payload;
    },
    // Load raw data directly (for offline use)
    setRawData: (state, action: PayloadAction<RawReportData>) => {
      state.rawData = action.payload;
      state.processedData = processReportData(action.payload);
      state.loading = false;
      state.error = null;
      state.lastUpdated = new Date().toISOString();
    },
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    // Reset state
    resetReport: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch report
      .addCase(fetchReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReport.fulfilled, (state, action) => {
        state.loading = false;
        state.rawData = action.payload.data;
        state.processedData = processReportData(action.payload.data);
        state.currentReportPath = action.payload.path;
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch report';
      })
      // Fetch available reports (legacy)
      .addCase(fetchAvailableReports.fulfilled, (state, action) => {
        state.availableReports = action.payload;
      })
      // Fetch reports index
      .addCase(fetchReportsIndex.pending, () => {
        // Don't set loading here to avoid double loading state
      })
      .addCase(fetchReportsIndex.fulfilled, (state, action) => {
        state.availableReports = action.payload;
      })
      .addCase(fetchReportsIndex.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to load reports index';
      })
      // Fetch all historical data
      .addCase(fetchAllHistoricalData.pending, (state) => {
        state.historicalLoading = true;
      })
      .addCase(fetchAllHistoricalData.fulfilled, (state, action) => {
        state.historicalLoading = false;
        state.historicalData = action.payload;
      })
      .addCase(fetchAllHistoricalData.rejected, (state) => {
        state.historicalLoading = false;
        // Don't set error - historical data is optional
      })
      // Load embedded data
      .addCase(loadEmbeddedData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadEmbeddedData.fulfilled, (state, action) => {
        state.loading = false;
        state.rawData = action.payload;
        state.processedData = processReportData(action.payload);
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(loadEmbeddedData.rejected, (state) => {
        state.loading = false;
        // Don't set error for this - it's expected when no data is embedded
      })
      // Load report from file
      .addCase(loadReportFromFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadReportFromFile.fulfilled, (state, action) => {
        state.loading = false;
        state.rawData = action.payload.data;
        state.processedData = processReportData(action.payload.data);
        state.currentReportPath = action.payload.filename;
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(loadReportFromFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to load report from file';
      });
  },
});

export const {
  setAvailableReports,
  setCurrentReportPath,
  setRawData,
  clearError,
  resetReport,
} = reportSlice.actions;

export default reportSlice.reducer;
