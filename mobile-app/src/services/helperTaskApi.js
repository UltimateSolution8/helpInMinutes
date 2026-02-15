import api from './api';

/**
 * Helper Task API - All task-related API calls for helpers
 */
export const helperTaskApi = {
  // Get all incoming task alerts
  getIncomingTasks: async () => {
    const response = await api.get('/api/v1/helper/tasks/incoming');
    return response.data;
  },

  // Get current active task
  getActiveTask: async () => {
    const response = await api.get('/api/v1/helper/tasks/active');
    return response.data;
  },

  // Accept a task
  acceptTask: async (taskId) => {
    const response = await api.post(`/api/v1/helper/tasks/${taskId}/accept`);
    return response.data;
  },

  // Decline a task
  declineTask: async (taskId, reason) => {
    const response = await api.post(`/api/v1/helper/tasks/${taskId}/decline`, { reason });
    return response.data;
  },

  // Start task (arrive at location)
  startTask: async (taskId) => {
    const response = await api.post(`/api/v1/helper/tasks/${taskId}/start`);
    return response.data;
  },

  // Complete task with OTP
  completeTask: async (taskId, otp, completionNotes) => {
    const response = await api.post(`/api/v1/helper/tasks/${taskId}/complete`, { otp, completionNotes });
    return response.data;
  },

  // Cancel active task
  cancelTask: async (taskId, reason) => {
    const response = await api.post(`/api/v1/helper/tasks/${taskId}/cancel`, { reason });
    return response.data;
  },

  // Get task history
  getTaskHistory: async ({ status, page = 0, size = 20 }) => {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.append('status', status);
    params.append('page', page);
    params.append('size', size);
    const response = await api.get(`/api/v1/helper/tasks/history?${params.toString()}`);
    return response.data;
  },

  // Get task details
  getTaskDetails: async (taskId) => {
    const response = await api.get(`/api/v1/helper/tasks/${taskId}`);
    return response.data;
  },

  // Get task counts
  getTaskCounts: async () => {
    const response = await api.get('/api/v1/helper/tasks/counts');
    return response.data;
  },

  // Send location update
  sendLocationUpdate: async (latitude, longitude, accuracy, speed) => {
    const response = await api.post('/api/v1/helper/tasks/location', {
      latitude,
      longitude,
      accuracy,
      speed,
      timestamp: new Date().toISOString(),
    });
    return response.data;
  },

  // Request OTP for task completion
  requestOtp: async (taskId) => {
    const response = await api.post(`/api/v1/helper/tasks/${taskId}/request-otp`);
    return response.data;
  },
};

export default helperTaskApi;
