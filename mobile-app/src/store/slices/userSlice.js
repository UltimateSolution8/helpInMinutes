import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  user: null,
  loading: false,
  error: null,
};

export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/v1/users/profile');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.put('/api/v1/users/profile', userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const updateUserLocation = createAsyncThunk(
  'user/updateLocation',
  async (locationData, { rejectWithValue }) => {
    try {
      const response = await api.put('/api/v1/users/location', locationData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update location');
    }
  }
);

export const addSavedAddress = createAsyncThunk(
  'user/addAddress',
  async (addressData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/v1/users/addresses', addressData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add address');
    }
  }
);

export const deleteSavedAddress = createAsyncThunk(
  'user/deleteAddress',
  async (addressId, { rejectWithValue }) => {
    try {
      await api.delete(`/api/v1/users/addresses/${addressId}`);
      return addressId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete address');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(updateUserLocation.fulfilled, (state, action) => {
        if (state.user) {
          state.user.location = action.payload.location;
        }
      })
      .addCase(addSavedAddress.fulfilled, (state, action) => {
        if (state.user) {
          state.user.savedAddresses = state.user.savedAddresses || [];
          state.user.savedAddresses.push(action.payload);
        }
      })
      .addCase(deleteSavedAddress.fulfilled, (state, action) => {
        if (state.user && state.user.savedAddresses) {
          state.user.savedAddresses = state.user.savedAddresses.filter(
            (addr) => addr.id !== action.payload
          );
        }
      });
  },
});

export const { setUser, clearUser, clearError } = userSlice.actions;
export default userSlice.reducer;
