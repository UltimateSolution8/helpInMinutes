import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  tasks: [],
  currentTask: null,
  taskHistory: [],
  recentTasks: [],
  loading: false,
  error: null,
  matchingStatus: 'idle',
  matchedHelper: null,
  filterStatus: 'ALL',
  helperLocation: null,
  stats: {
    completed: 0,
    active: 0,
    cancelled: 0,
  },
};

// Async thunks
export const createTask = createAsyncThunk(
  'task/createTask',
  async (taskData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/v1/tasks', taskData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create task');
    }
  }
);

export const fetchTaskById = createAsyncThunk(
  'task/fetchTaskById',
  async (taskId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/v1/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch task');
    }
  }
);

export const fetchTaskHistory = createAsyncThunk(
  'task/fetchTaskHistory',
  async ({ status, page, size }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (status && status !== 'ALL') params.append('status', status);
      params.append('page', page || 0);
      params.append('size', size || 20);
      
      const response = await api.get(`/api/v1/tasks?${params.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
    }
  }
);

export const fetchRecentTasks = createAsyncThunk(
  'task/fetchRecentTasks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/v1/tasks/recent');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch recent tasks');
    }
  }
);

export const fetchTaskStats = createAsyncThunk(
  'task/fetchTaskStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/v1/tasks/stats');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
    }
  }
);

export const cancelTask = createAsyncThunk(
  'task/cancelTask',
  async (taskId, { rejectWithValue }) => {
    try {
      await api.post(`/api/v1/tasks/${taskId}/cancel`);
      return taskId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel task');
    }
  }
);

export const completeTask = createAsyncThunk(
  'task/completeTask',
  async (taskId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/v1/tasks/${taskId}/complete`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to complete task');
    }
  }
);

const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    setMatchingStatus: (state, action) => {
      state.matchingStatus = action.payload;
    },
    setMatchedHelper: (state, action) => {
      state.matchedHelper = action.payload;
    },
    setHelperLocation: (state, action) => {
      state.helperLocation = action.payload;
    },
    updateTaskStatus: (state, action) => {
      const { taskId, status } = action.payload;
      if (state.currentTask && state.currentTask.id === taskId) {
        state.currentTask.status = status;
      }
      const taskIndex = state.tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        state.tasks[taskIndex].status = status;
      }
    },
    setFilterStatus: (state, action) => {
      state.filterStatus = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Task
      .addCase(createTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTask = action.payload;
        state.tasks.unshift(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Task By Id
      .addCase(fetchTaskById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTask = action.payload;
      })
      .addCase(fetchTaskById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Task History
      .addCase(fetchTaskHistory.fulfilled, (state, action) => {
        state.taskHistory = action.payload.content || [];
      })
      // Fetch Recent Tasks
      .addCase(fetchRecentTasks.fulfilled, (state, action) => {
        state.recentTasks = action.payload;
      })
      // Fetch Task Stats
      .addCase(fetchTaskStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      // Cancel Task
      .addCase(cancelTask.fulfilled, (state, action) => {
        const taskId = action.payload;
        state.taskHistory = state.taskHistory.map(t =>
          t.id === taskId ? { ...t, status: 'CANCELLED' } : t
        );
        if (state.currentTask?.id === taskId) {
          state.currentTask.status = 'CANCELLED';
        }
      })
      // Complete Task
      .addCase(completeTask.fulfilled, (state, action) => {
        const updatedTask = action.payload;
        state.currentTask = updatedTask;
        state.taskHistory = state.taskHistory.map(t =>
          t.id === updatedTask.id ? updatedTask : t
        );
      });
  },
});

export const {
  setMatchingStatus,
  setMatchedHelper,
  setHelperLocation,
  updateTaskStatus,
  setFilterStatus,
  clearError,
} = taskSlice.actions;

export default taskSlice.reducer;