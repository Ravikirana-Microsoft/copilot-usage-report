import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { VIEWS } from '../../utils/constants';
import type { ViewType } from '../../utils/constants';

interface UIState {
  // Current active tab/view
  activeView: ViewType;
  // Theme mode
  isDarkMode: boolean;
  // Modal states
  modals: {
    triggerAnalysis: boolean;
    archive: boolean;
    reset: boolean;
  };
  // Sidebar collapsed state
  sidebarCollapsed: boolean;
  // Loading overlay
  showLoadingOverlay: boolean;
  // Toast notifications
  toasts: Toast[];
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

const initialState: UIState = {
  activeView: VIEWS.OVERVIEW,
  isDarkMode: true, // Default to dark mode
  modals: {
    triggerAnalysis: false,
    archive: false,
    reset: false,
  },
  sidebarCollapsed: false,
  showLoadingOverlay: false,
  toasts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Set active view/tab
    setActiveView: (state, action: PayloadAction<ViewType>) => {
      state.activeView = action.payload;
    },
    // Toggle dark mode
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
    },
    // Set dark mode explicitly
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
    },
    // Open modal
    openModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = true;
    },
    // Close modal
    closeModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = false;
    },
    // Close all modals
    closeAllModals: (state) => {
      state.modals = {
        triggerAnalysis: false,
        archive: false,
        reset: false,
      };
    },
    // Toggle sidebar
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    // Set loading overlay
    setLoadingOverlay: (state, action: PayloadAction<boolean>) => {
      state.showLoadingOverlay = action.payload;
    },
    // Add toast notification
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      state.toasts.push({ ...action.payload, id });
    },
    // Remove toast notification
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
    // Clear all toasts
    clearToasts: (state) => {
      state.toasts = [];
    },
  },
});

export const {
  setActiveView,
  toggleDarkMode,
  setDarkMode,
  openModal,
  closeModal,
  closeAllModals,
  toggleSidebar,
  setLoadingOverlay,
  addToast,
  removeToast,
  clearToasts,
} = uiSlice.actions;

export default uiSlice.reducer;
