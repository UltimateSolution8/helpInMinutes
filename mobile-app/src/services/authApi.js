import api from './api';

// Auth API endpoints
export const loginUser = async (credentials) => {
  const response = await api.post('/api/v1/auth/login', credentials);
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/api/v1/auth/register', userData);
  return response.data;
};

export const googleLogin = async (idToken) => {
  const response = await api.post('/api/v1/auth/google', { idToken });
  return response.data;
};

export const refreshToken = async (refreshToken) => {
  const response = await api.post('/api/v1/auth/refresh', { refreshToken });
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/api/v1/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, newPassword) => {
  const response = await api.post('/api/v1/auth/reset-password', { token, newPassword });
  return response.data;
};

export const verifyEmail = async (token) => {
  const response = await api.post('/api/v1/auth/verify-email', { token });
  return response.data;
};

export const resendVerificationEmail = async (email) => {
  const response = await api.post('/api/v1/auth/resend-verification', { email });
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/api/v1/users/profile');
  return response.data;
};

export const updateProfile = async (userData) => {
  const response = await api.put('/api/v1/users/profile', userData);
  return response.data;
};

export const changePassword = async (passwordData) => {
  const response = await api.post('/api/v1/users/change-password', passwordData);
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/api/v1/auth/logout');
  return response.data;
};

export default {
  loginUser,
  registerUser,
  googleLogin,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  getProfile,
  updateProfile,
  changePassword,
  logout,
};
