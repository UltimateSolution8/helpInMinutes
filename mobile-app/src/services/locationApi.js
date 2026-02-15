import api from './api';

/**
 * Location API - All location tracking and heartbeat API calls
 */
export const locationApi = {
  // Send location heartbeat
  sendHeartbeat: async (latitude, longitude, accuracy, speed, heading) => {
    const response = await api.post('/api/v1/helper/location/heartbeat', {
      latitude,
      longitude,
      accuracy,
      speed,
      heading,
      timestamp: new Date().toISOString(),
    });
    return response.data;
  },

  // Update single location
  updateLocation: async (latitude, longitude, accuracy) => {
    const response = await api.post('/api/v1/helper/location', {
      latitude,
      longitude,
      accuracy,
      timestamp: new Date().toISOString(),
    });
    return response.data;
  },

  // Batch location update (for offline tracking)
  batchLocationUpdate: async (locations) => {
    const response = await api.post('/api/v1/helper/location/batch', { locations });
    return response.data;
  },

  // Get last known location
  getLastLocation: async () => {
    const response = await api.get('/api/v1/helper/location/last');
    return response.data;
  },

  // Get location history
  getLocationHistory: async ({ startTime, endTime }) => {
    const params = new URLSearchParams();
    if (startTime) params.append('startTime', startTime);
    if (endTime) params.append('endTime', endTime);
    const response = await api.get(`/api/v1/helper/location/history?${params.toString()}`);
    return response.data;
  },

  // Start location tracking session
  startTrackingSession: async () => {
    const response = await api.post('/api/v1/helper/location/session/start');
    return response.data;
  },

  // Stop location tracking session
  stopTrackingSession: async (sessionId) => {
    const response = await api.post(`/api/v1/helper/location/session/${sessionId}/stop`);
    return response.data;
  },

  // Update geofence status
  updateGeofenceStatus: async (isInsideGeofence) => {
    const response = await api.post('/api/v1/helper/location/geofence', { isInsideGeofence });
    return response.data;
  },
};

export default locationApi;
