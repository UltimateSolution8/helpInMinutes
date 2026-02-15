import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  refreshToken: null,
  loading: false,
  error: null,
  kycStatus: 'PENDING', // PENDING, VERIFIED, REJECTED
  isOnline: false,
};

// Helper Login
export const helperLogin = createAsyncThunk(
  'helperAuth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/v1/auth/helper/login', credentials);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Helper login failed');
    }
  }
);

// Helper Registration
export const helperRegister = createAsyncThunk(
  'helperAuth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/v1/auth/helper/register', userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Helper registration failed');
    }
  }
);

// Fetch KYC Status
export const fetchKycStatus = createAsyncThunk(
  'helperAuth/fetchKycStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/v1/helper/kyc/status');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch KYC status');
    }
  }
);

// Update Online Status
export const updateOnlineStatus = createAsyncThunk(
  'helperAuth/updateOnlineStatus',
  async (isOnline, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/v1/helper/online-status', { isOnline });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update online status');
    }
  }
);

const helperAuthSlice = createSlice({
  name: 'helperAuth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.kycStatus = action.payload.user?.kycStatus || 'PENDING';
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isOnline = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(helperLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(helperLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.kycStatus = action.payload.user?.kycStatus || 'PENDING';
      })
      .addCase(helperLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(helperRegister.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(helperRegister.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.kycStatus = action.payload.user?.kycStatus || 'PENDING';
      })
      .addCase(helperRegister.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // KYC Status
      .addCase(fetchKycStatus.fulfilled, (state, action) => {
        state.kycStatus = action.payload.status;
      })
      // Online Status
      .addCase(updateOnlineStatus.fulfilled, (state, action) => {
        state.isOnline = action.payload.isOnline;
      });
  },
});

export const { loginSuccess, loginFailure, logout, clearError, setOnlineStatus, updateUser } = helperAuthSlice.actions;
export default helperAuthSlice.reducer;
