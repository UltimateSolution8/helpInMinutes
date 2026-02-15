import api from './api';

// Payment API endpoints
export const fetchPaymentMethods = async () => {
  const response = await api.get('/api/v1/payments/methods');
  return response.data;
};

export const addPaymentMethod = async (methodData) => {
  const response = await api.post('/api/v1/payments/methods', methodData);
  return response.data;
};

export const removePaymentMethod = async (methodId) => {
  const response = await api.delete(`/api/v1/payments/methods/${methodId}`);
  return response.data;
};

export const setDefaultPaymentMethod = async (methodId) => {
  const response = await api.put(`/api/v1/payments/methods/${methodId}/default`);
  return response.data;
};

export const fetchTransactions = async (params = {}) => {
  const response = await api.get('/api/v1/payments/transactions', { params });
  return response.data;
};

export const fetchTransactionById = async (transactionId) => {
  const response = await api.get(`/api/v1/payments/transactions/${transactionId}`);
  return response.data;
};

export const createPayment = async (paymentData) => {
  const response = await api.post('/api/v1/payments', paymentData);
  return response.data;
};

export const processPayment = async (paymentId, paymentMethodId) => {
  const response = await api.post(`/api/v1/payments/${paymentId}/process`, {
    paymentMethodId,
  });
  return response.data;
};

export const refundPayment = async (paymentId, reason) => {
  const response = await api.post(`/api/v1/payments/${paymentId}/refund`, { reason });
  return response.data;
};

export const fetchPayoutMethods = async () => {
  const response = await api.get('/api/v1/payouts/methods');
  return response.data;
};

export const requestPayout = async (payoutData) => {
  const response = await api.post('/api/v1/payouts/request', payoutData);
  return response.data;
};

export const fetchPayoutHistory = async (params = {}) => {
  const response = await api.get('/api/v1/payouts/history', { params });
  return response.data;
};

export default {
  fetchPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
  fetchTransactions,
  fetchTransactionById,
  createPayment,
  processPayment,
  refundPayment,
  fetchPayoutMethods,
  requestPayout,
  fetchPayoutHistory,
};
