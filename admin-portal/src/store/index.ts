import { configureStore, combineReducers, ThunkAction, Action } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

const rootReducer = combineReducers({
  auth: authReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializable check
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action>;

export default store;
