import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';

// Customer Auth Slice
import authReducer from './slices/authSlice';

// Customer Task Slice
import taskReducer from './slices/taskSlice';

// Helper Auth Slice
import helperAuthReducer from './slices/helperAuthSlice';

// Helper Task Slice
import helperTaskReducer from './slices/helperTaskSlice';

// Earnings Slice
import earningsReducer from './slices/earningsSlice';

// KYC Slice
import kycReducer from './slices/kycSlice';

// Schedule Slice
import scheduleReducer from './slices/scheduleSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'helperAuth'],
};

const rootReducer = combineReducers({
  // Customer
  auth: authReducer,
  task: taskReducer,
  
  // Helper
  helperAuth: helperAuthReducer,
  helperTask: helperTaskReducer,
  
  // Shared
  earnings: earningsReducer,
  kyc: kycReducer,
  schedule: scheduleReducer,
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
