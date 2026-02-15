import api from './api';

/**
 * Earnings API - All earnings and payout related API calls
 */
export const earningsApi = {
  // Get wallet balance
  getBalance: async () => {
    const response = await api.get('/api/v1/wallet/balance');
    return response.data;
  },

  // Get earnings summary
  getEarningsSummary: async (period = 'ALL') => {
    const response = await api.get(`/api/v1/earnings/summary?period=${period}`);
    return response.data;
  },

  // Get daily earnings
  getDailyEarnings: async (date) => {
    const response = await api.get(`/api/v1/earnings/daily?date=${date}`);
    return response.data;
  },

  // Get weekly earnings
  getWeeklyEarnings: async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await api.get(`/api/v1/earnings/weekly?${params.toString()}`);
    return response.data;
  },

  // Get monthly earnings
  getMonthlyEarnings: async (year, month) => {
    const response = await api.get(`/api/v1/earnings/monthly?year=${year}&month=${month}`);
    return response.data;
  },

  // Get transactions
  getTransactions: async ({ page = 0, size = 20, type } = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', size);
    if (type) params.append('type', type);
    const response = await api.get(`/api/v1/transactions?${params.toString()}`);
    return response.data;
  },

  // Request payout
  requestPayout: async ({ amount, bankAccountId }) => {
    const response = await api.post('/api/v1/payouts/request', { amount, bankAccountId });
    return response.data;
  },

  // Get payout history
  getPayoutHistory: async ({ page = 0, size = 20 } = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', size);
    const response = await api.get(`/api/v1/payouts/history?${params.toString()}`);
    return response.data;
  },

  // Get payout status
  getPayoutStatus: async (payoutId) => {
    const response = await api.get(`/api/v1/payouts/${payoutId}/status`);
    return response.data;
  },

  // Get bank accounts
  getBankAccounts: async () => {
    const response = await api.get('/api/v1/bank-accounts');
    return response.data;
  },

  // Add bank account
  addBankAccount: async (bankData) => {
    const response = await api.post('/api/v1/bank-accounts', bankData);
    return response.data;
  },

  // Update bank account
  updateBankAccount: async (bankAccountId, bankData) => {
    const response = await api.put(`/api/v1/bank-accounts/${bankAccountId}`, bankData);
    return response.data;
  },

  // Delete bank account
  deleteBankAccount: async (bankAccountId) => {
    const response = await api.delete(`/api/v1/bank-accounts/${bankAccountId}`);
    return response.data;
  },

  // Set default bank account
  setDefaultBankAccount: async (bankAccountId) => {
    const response = await api.post(`/api/v1/bank-accounts/${bankAccountId}/default`);
    return response.data;
  },

  // Get earnings chart data
  getEarningsChartData: async ({ period = 'WEEK' }) => {
    const response = await api.get(`/api/v1/earnings/chart?period=${period}`);
    return response.data;
  },
};

export default earningsApi;
