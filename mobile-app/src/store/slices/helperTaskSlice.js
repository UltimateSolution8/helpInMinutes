import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  incomingTask: null,
  activeTask: null,
  taskHistory: [],
  availableTasks: [],
  loading: false,
  error: null,
  taskAlert: null,
  taskCount: {
    pending: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
  },
};

// Fetch incoming tasks
export const fetchIncomingTasks = createAsyncThunk(
  'helperTask/fetchIncomingTasks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/v1/helper/tasks/incoming');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch incoming tasks');
    }
  }
);

// Fetch active task
export const fetchActiveTask = createAsyncThunk(
  'helperTask/fetchActiveTask',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/v1/helper/tasks/active');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch active task');
    }
  }
);

// Accept task
export const acceptTask = createAsyncThunk(
  'helperTask/acceptTask',
  async (taskId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/v1/helper/tasks/${taskId}/accept`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to accept task');
    }
  }
);

// Decline task
export const declineTask = createAsyncThunk(
  'helperTask/declineTask',
  async ({ taskId, reason }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/v1/helper/tasks/${taskId}/decline`, { reason });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to decline task');
    }
  }
);

// Start task (arrive at location)
export const startTask = createAsyncThunk(
  'helperTask/startTask',
  async (taskId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/v1/helper/tasks/${taskId}/start`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start task');
    }
  }
);

// Complete task
export const completeTask = createAsyncThunk(
  'helperTask/completeTask',
  async ({ taskId, otp, completionNotes }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/v1/helper/tasks/${taskId}/complete`, { otp, completionNotes });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to complete task');
    }
  }
);

// Fetch task history
export const fetchHelperTaskHistory = createAsyncThunk(
  'helperTask/fetchHistory',
  async ({ status, page, size }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (status && status !== 'ALL') params.append('status', status);
      params.append('page', page || 0);
      params.append('size', size || 20);
      
      const response = await api.get(`/api/v1/helper/tasks/history?${params.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch task history');
    }
  }
);

// Fetch task counts
export const fetchTaskCounts = createAsyncThunk(
  'helperTask/fetchCounts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/v1/helper/tasks/counts');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch task counts');
    }
  }
);

const helperTaskSlice = createSlice({
  name: 'helperTask',
  initialState,
  reducers: {
    setTaskAlert: (state, action) => {
      state.taskAlert = action.payload;
    },
    clearTaskAlert: (state) => {
      state.taskAlert = null;
    },
    setActiveTask: (state, action) => {
      state.activeTask = action.payload;
    },
    clearActiveTask: (state) => {
      state.activeTask = null;
    },
    updateTaskStatus: (state, action) => {
      const { taskId, status } = action.payload;
      if (state.activeTask && state.activeTask.id === taskId) {
        state.activeTask.status = status;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Incoming Tasks
      .addCase(fetchIncomingTasks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchIncomingTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.availableTasks = action.payload || [];
      })
      .addCase(fetchIncomingTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Active Task
      .addCase(fetchActiveTask.fulfilled, (state, action) => {
        state.activeTask = action.payload;
      })
      // Accept Task
      .addCase(acceptTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(acceptTask.fulfilled, (state, action) => {
        state.loading = false;
        state.activeTask = action.payload;
        state.taskAlert = null;
        state.availableTasks = state.availableTasks.filter(t => t.id !== action.payload.id);
      })
      .addCase(acceptTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Decline Task
      .addCase(declineTask.fulfilled, (state, action) => {
        state.availableTasks = state.availableTasks.filter(t => t.id !== action.payload.taskId);
        state.taskAlert = null;
      })
      // Start Task
      .addCase(startTask.fulfilled, (state, action) => {
        state.activeTask = action.payload;
      })
      // Complete Task
      .addCase(completeTask.fulfilled, (state, action) => {
        state.activeTask = null;
        state.taskHistory.unshift(action.payload);
      })
      // Task History
      .addCase(fetchHelperTaskHistory.fulfilled, (state, action) => {
        state.taskHistory = action.payload.content || [];
      })
      // Task Counts
      .addCase(fetchTaskCounts.fulfilled, (state, action) => {
        state.taskCount = action.payload;
      });
  },
});

export const {
  setTaskAlert,
  clearTaskAlert,
  setActiveTask,
  clearActiveTask,
  updateTaskStatus,
  clearError,
} = helperTaskSlice.actions;

export default helperTaskSlice.reducer;
