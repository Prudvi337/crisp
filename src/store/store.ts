import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import localForage from 'localforage';
import { combineReducers } from 'redux';
import candidatesReducer from './slices/candidatesSlice';
import interviewReducer from './slices/interviewSlice';
import uiReducer from './slices/uiSlice';

// Configure localForage to use IndexedDB
localForage.config({
  driver: localForage.INDEXEDDB,
  name: 'ChronoInterviewer',
  version: 1.0,
  storeName: 'redux_persist',
  description: 'Redux persist storage for Chrono Interviewer Pro'
});

const persistConfig = {
  key: 'chrono-interviewer-root',
  storage: localForage,
  whitelist: ['candidates', 'interview'],
};

const rootReducer = combineReducers({
  candidates: candidatesReducer,
  interview: interviewReducer,
  ui: uiReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
