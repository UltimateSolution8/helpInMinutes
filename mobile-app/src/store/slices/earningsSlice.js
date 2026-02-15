import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const initialState = {
  balance: 0,
  pendingBalance: 0,
  totalEarnings: 0,
  dailyEarnings: 0,
  weeklyEarnings: 0,
  monthlyEarnings: 0,
  transactions: [],
  payoutHistory: [],
  bankAccounts: [],
  defaultBankAccount: null,
  loading: false,
  error: null,
};

// Fetch wallet balance
export const fetchWalletBalance = createAsyncThunk(
  'earnings/fetchBalance',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/wallet/balance');
      return response.json();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch balance');
    }
  }
);

// Fetch earnings summary
export const fetchEarningsSummary = createAsyncThunk(
  'earnings/fetchSummary',
  async ({ period }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/v1/earnings/summary?period=${period}`);
      return response.json();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch earnings');
    }
  }
);

// Fetch transactions
export const fetchTransactions = createAsyncThunk(
  'earnings/fetchTransactions',
  async ({ page, size, type }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page || 0);
      params.append('size', size || 20);
      if (type) params.append('type', type);
      
      const response = await fetch(`/api/v1/transactions?${params.toString()}`);
      return response.json();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions');
    }
  }
);

// Request payout
export const requestPayout = createAsyncThunk(
  'earnings/requestPayout',
  async ({ amount, bankAccountId }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/payouts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, bankAccountId }),
      });
      return response.json();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to request payout');
    }
  }
);

// Fetch payout history
export const fetchPayoutHistory = createAsyncThunk(
  'earnings/fetchPayoutHistory',
  async ({ page, size }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page || 0);
      params.append('size', size || 20);
      
      const response = await fetch(`/api/v1/payouts/history?${params.toString()}`);
      return response.json();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payout history');
    }
  }
);

// Fetch bank accounts
export const fetchBankAccounts = createAsyncThunk(
  'earnings/fetchBankAccounts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/bank-accounts');
      return response.json();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bank accounts');
    }
  }
);

// Add bank account
export const addBankAccount = createAsyncThunk(
  'earnings/addBankAccount',
  async (bankData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankData),
      });
      return response.json();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add bank account');
    }
  }
);

const earningsSlice = createSlice({
  name: 'earnings',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setDefaultBankAccount: (state, action) => {
      state.defaultBankAccount = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Balance
      .addCase(fetchWalletBalance.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWalletBalance.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload.availableBalance;
        state.pendingBalance = action.payload.pendingBalance;
      })
      .addCase(fetchWalletBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Earnings Summary
      .addCase(fetchEarningsSummary.fulfilled, (state, action) => {
        state.totalEarnings = action.payload.totalEarnings;
        state.dailyEarnings = action.payload.dailyEarnings;
        state.weeklyEarnings = action.payload.weeklyEarnings;
        state.monthlyEarnings = action.payload.monthlyEarnings;
      })
      // Fetch Transactions
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.transactions = action.payload.content || [];
      })
      // Request Payout
      .addCase(requestPayout.pending, (state) => {
        state.loading = true;
      })
      .addCase(requestPayout.fulfilled, (state, action) => {
        state.loading = false;
        state.balance -= action.payload.amount;
        state.payoutHistory.unshift(action.payload);
      })
      .addCase(requestPayout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Payout History
      .addCase(fetchPayoutHistory.fulfilled, (state, action) => {
        state.payoutHistory = action.payload.content || [];
      })
      // Fetch Bank Accounts
      .addCase(fetchBankAccounts.fulfilled, (state, action) => {
        state.bankAccounts = action.payload;
        state.defaultBankAccount = action.payload.find(acc => acc.isDefault) || null;
      })
      // Add Bank Account
      .addCase(addBankAccount.fulfilled, (state, action) => {
        state.bankAccounts.push(action.payload);
      });
  },
});

export const { clearError, setDefaultBankAccount } = earningsSlice.actions;
export default earningsSlice.reducer;
