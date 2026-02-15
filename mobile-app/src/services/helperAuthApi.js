import api from './api';

/**
 * Helper Authentication API
 */
export const helperAuthApi = {
  // Helper Login
  login: async (credentials) => {
    const response = await api.post('/api/v1/auth/helper/login', credentials);
    return response.data;
  },

  // Helper Registration
  register: async (userData) => {
    const response = await api.post('/api/v1/auth/helper/register', userData);
    return response.data;
  },

  // Helper Google Login
  googleLogin: async (googleToken) => {
    const response = await api.post('/api/v1/auth/helper/google', { token: googleToken });
    return response.data;
  },

  // Refresh Token
  refreshToken: async (refreshToken) => {
    const response = await api.post('/api/v1/auth/refresh', { refreshToken });
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/api/v1/auth/logout');
    return response.data;
  },

  // Get Helper Profile
  getProfile: async () => {
    const response = await api.get('/api/v1/helper/profile');
    return response.data;
  },

  // Update Helper Profile
  updateProfile: async (profileData) => {
    const response = await api.put('/api/v1/helper/profile', profileData);
    return response.data;
  },

  // Get KYC Status
  getKycStatus: async () => {
    const response = await api.get('/api/v1/helper/kyc/status');
    return response.data;
  },

  // Update Online Status
  updateOnlineStatus: async (isOnline) => {
    const response = await api.post('/api/v1/helper/online-status', { isOnline });
    return response.data;
  },

  // Get Current Location
  updateLocation: async (latitude, longitude) => {
    const response = await api.post('/api/v1/helper/location', { latitude, longitude });
    return response.data;
  },
};

export default helperAuthApi;
