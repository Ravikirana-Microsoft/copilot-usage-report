import { configureStore } from '@reduxjs/toolkit';
import { reportReducer, uiReducer, filtersReducer } from './slices';

export const store = configureStore({
  reducer: {
    report: reportReducer,
    ui: uiReducer,
    filters: filtersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization checks
        ignoredActions: ['report/fetchReport/fulfilled'],
      },
    }),
  devTools: import.meta.env.DEV,
});

// Infer types from store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
