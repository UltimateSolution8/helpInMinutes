import api from './api';

// Task API endpoints
export const createTask = async (taskData) => {
  const response = await api.post('/api/v1/tasks', taskData);
  return response.data;
};

export const fetchTaskById = async (taskId) => {
  const response = await api.get(`/api/v1/tasks/${taskId}`);
  return response.data;
};

export const fetchTasks = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append('status', params.status);
  if (params.categoryId) queryParams.append('categoryId', params.categoryId);
  if (params.skillId) queryParams.append('skillId', params.skillId);
  if (params.latitude) queryParams.append('latitude', params.latitude);
  if (params.longitude) queryParams.append('longitude', params.longitude);
  if (params.radiusKm) queryParams.append('radiusKm', params.radiusKm);
  if (params.page) queryParams.append('page', params.page);
  if (params.size) queryParams.append('size', params.size);

  const response = await api.get(`/api/v1/tasks?${queryParams.toString()}`);
  return response.data;
};

export const fetchNearbyTasks = async (location, radiusKm = 5) => {
  const response = await api.get('/api/v1/tasks/nearby', {
    params: {
      latitude: location.latitude,
      longitude: location.longitude,
      radiusKm,
    },
  });
  return response.data;
};

export const cancelTask = async (taskId, reason) => {
  const response = await api.post(`/api/v1/tasks/${taskId}/cancel`, { reason });
  return response.data;
};

export const completeTask = async (taskId, completionData) => {
  const response = await api.post(`/api/v1/tasks/${taskId}/complete`, completionData);
  return response.data;
};

export const updateTaskStatus = async (taskId, status) => {
  const response = await api.patch(`/api/v1/tasks/${taskId}/status`, { status });
  return response.data;
};

export const fetchTaskCategories = async () => {
  const response = await api.get('/api/v1/categories');
  return response.data;
};

export const fetchTaskSkills = async (categoryId) => {
  const response = await api.get(`/api/v1/skills`, {
    params: { categoryId },
  });
  return response.data;
};

export const uploadTaskMedia = async (taskId, mediaFiles) => {
  const formData = new FormData();
  mediaFiles.forEach((file) => {
    formData.append('files', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    });
  });

  const response = await api.post(`/api/v1/tasks/${taskId}/media`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export default {
  createTask,
  fetchTaskById,
  fetchTasks,
  fetchNearbyTasks,
  cancelTask,
  completeTask,
  updateTaskStatus,
  fetchTaskCategories,
  fetchTaskSkills,
  uploadTaskMedia,
};
