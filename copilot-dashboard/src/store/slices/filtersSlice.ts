import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface FiltersState {
  // Global search term
  searchTerm: string;
  // Application filter
  selectedApplication: string;
  // Branch filter
  selectedBranch: string;
  // User filter
  selectedUser: string;
  // Date range filter
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
  // Tier filter (array of selected tiers)
  selectedTiers: number[];
  // AI/Human filter
  aiFilter: 'all' | 'ai' | 'human';
  // Sort configuration
  sortConfig: {
    field: string;
    direction: 'asc' | 'desc';
  };
  // Pagination
  pagination: {
    currentPage: number;
    pageSize: number;
  };
}

const initialState: FiltersState = {
  searchTerm: '',
  selectedApplication: '',
  selectedBranch: '',
  selectedUser: '',
  dateRange: {
    startDate: null,
    endDate: null,
  },
  selectedTiers: [1, 2, 3, 4, 5], // All tiers selected by default
  aiFilter: 'all',
  sortConfig: {
    field: 'date',
    direction: 'desc',
  },
  pagination: {
    currentPage: 1,
    pageSize: 20,
  },
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    // Set search term
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
      state.pagination.currentPage = 1; // Reset to first page on search
    },
    // Set application filter
    setSelectedApplication: (state, action: PayloadAction<string>) => {
      state.selectedApplication = action.payload;
      state.pagination.currentPage = 1;
    },
    // Set branch filter
    setSelectedBranch: (state, action: PayloadAction<string>) => {
      state.selectedBranch = action.payload;
      state.pagination.currentPage = 1;
    },
    // Set user filter
    setSelectedUser: (state, action: PayloadAction<string>) => {
      state.selectedUser = action.payload;
      state.pagination.currentPage = 1;
    },
    // Set date range
    setDateRange: (state, action: PayloadAction<FiltersState['dateRange']>) => {
      state.dateRange = action.payload;
      state.pagination.currentPage = 1;
    },
    // Set selected tiers
    setSelectedTiers: (state, action: PayloadAction<number[]>) => {
      state.selectedTiers = action.payload;
      state.pagination.currentPage = 1;
    },
    // Toggle a single tier
    toggleTier: (state, action: PayloadAction<number>) => {
      const tier = action.payload;
      if (state.selectedTiers.includes(tier)) {
        state.selectedTiers = state.selectedTiers.filter((t) => t !== tier);
      } else {
        state.selectedTiers.push(tier);
      }
      state.pagination.currentPage = 1;
    },
    // Set AI filter
    setAIFilter: (state, action: PayloadAction<FiltersState['aiFilter']>) => {
      state.aiFilter = action.payload;
      state.pagination.currentPage = 1;
    },
    // Set sort configuration
    setSortConfig: (state, action: PayloadAction<FiltersState['sortConfig']>) => {
      state.sortConfig = action.payload;
    },
    // Toggle sort direction for a field
    toggleSort: (state, action: PayloadAction<string>) => {
      const field = action.payload;
      if (state.sortConfig.field === field) {
        state.sortConfig.direction = state.sortConfig.direction === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortConfig.field = field;
        state.sortConfig.direction = 'desc';
      }
    },
    // Set current page
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },
    // Set page size
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pagination.pageSize = action.payload;
      state.pagination.currentPage = 1; // Reset to first page
    },
    // Reset all filters
    resetFilters: () => initialState,
    // Reset filters but keep pagination settings
    clearFilters: (state) => {
      state.searchTerm = '';
      state.selectedApplication = '';
      state.selectedBranch = '';
      state.selectedUser = '';
      state.dateRange = { startDate: null, endDate: null };
      state.selectedTiers = [1, 2, 3, 4, 5];
      state.aiFilter = 'all';
      state.pagination.currentPage = 1;
    },
  },
});

export const {
  setSearchTerm,
  setSelectedApplication,
  setSelectedBranch,
  setSelectedUser,
  setDateRange,
  setSelectedTiers,
  toggleTier,
  setAIFilter,
  setSortConfig,
  toggleSort,
  setCurrentPage,
  setPageSize,
  resetFilters,
  clearFilters,
} = filtersSlice.actions;

export default filtersSlice.reducer;
