import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  paymentMethods: [],
  selectedMethod: null,
  transactions: [],
  currentPayment: null,
  loading: false,
  error: null,
};

export const fetchPaymentMethods = createAsyncThunk(
  'payment/fetchMethods',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/v1/payments/methods');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payment methods');
    }
  }
);

export const addPaymentMethod = createAsyncThunk(
  'payment/addMethod',
  async (methodData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/v1/payments/methods', methodData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add payment method');
    }
  }
);

export const removePaymentMethod = createAsyncThunk(
  'payment/removeMethod',
  async (methodId, { rejectWithValue }) => {
    try {
      await api.delete(`/api/v1/payments/methods/${methodId}`);
      return methodId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove payment method');
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  'payment/fetchTransactions',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/v1/payments/transactions', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions');
    }
  }
);

export const createPayment = createAsyncThunk(
  'payment/create',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/v1/payments', paymentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create payment');
    }
  }
);

export const processPayment = createAsyncThunk(
  'payment/process',
  async ({ paymentId, paymentMethodId }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/v1/payments/${paymentId}/process`, {
        paymentMethodId,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to process payment');
    }
  }
);

export const refundPayment = createAsyncThunk(
  'payment/refund',
  async ({ paymentId, reason }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/v1/payments/${paymentId}/refund`, { reason });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to process refund');
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    setSelectedMethod: (state, action) => {
      state.selectedMethod = action.payload;
    },
    clearCurrentPayment: (state) => {
      state.currentPayment = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentMethods.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentMethods = action.payload;
        if (action.payload.length > 0 && !state.selectedMethod) {
          state.selectedMethod = action.payload[0];
        }
      })
      .addCase(fetchPaymentMethods.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addPaymentMethod.fulfilled, (state, action) => {
        state.paymentMethods.push(action.payload);
        state.selectedMethod = action.payload;
      })
      .addCase(removePaymentMethod.fulfilled, (state, action) => {
        state.paymentMethods = state.paymentMethods.filter((m) => m.id !== action.payload);
        if (state.selectedMethod?.id === action.payload) {
          state.selectedMethod = state.paymentMethods[0] || null;
        }
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.transactions = action.payload.content || [];
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.currentPayment = action.payload;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.currentPayment = action.payload;
      })
      .addCase(refundPayment.fulfilled, (state, action) => {
        const index = state.transactions.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
        if (state.currentPayment?.id === action.payload.id) {
          state.currentPayment = action.payload;
        }
      });
  },
});

export const { setSelectedMethod, clearCurrentPayment, clearError } = paymentSlice.actions;
export default paymentSlice.reducer;
