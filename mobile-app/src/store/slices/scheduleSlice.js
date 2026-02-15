import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const initialState = {
  availabilityWindows: [],
  weeklySchedule: {
    monday: { enabled: false, startTime: '09:00', endTime: '18:00' },
    tuesday: { enabled: false, startTime: '09:00', endTime: '18:00' },
    wednesday: { enabled: false, startTime: '09:00', endTime: '18:00' },
    thursday: { enabled: false, startTime: '09:00', endTime: '18:00' },
    friday: { enabled: false, startTime: '09:00', endTime: '18:00' },
    saturday: { enabled: false, startTime: '09:00', endTime: '18:00' },
    sunday: { enabled: false, startTime: '09:00', endTime: '18:00' },
  },
  specialAvailability: [],
  isAvailable: false,
  loading: false,
  error: null,
};

// Fetch schedule
export const fetchSchedule = createAsyncThunk(
  'schedule/fetchSchedule',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/helper/schedule');
      return response.json();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch schedule');
    }
  }
);

// Update weekly schedule
export const updateWeeklySchedule = createAsyncThunk(
  'schedule/updateWeekly',
  async (weeklySchedule, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/helper/schedule/weekly', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(weeklySchedule),
      });
      return response.json();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update schedule');
    }
  }
);

// Add special availability
export const addSpecialAvailability = createAsyncThunk(
  'schedule/addSpecial',
  async (specialData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/helper/schedule/special', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(specialData),
      });
      return response.json();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add special availability');
    }
  }
);

// Remove special availability
export const removeSpecialAvailability = createAsyncThunk(
  'schedule/removeSpecial',
  async (specialId, { rejectWithValue }) => {
    try {
      await fetch(`/api/v1/helper/schedule/special/${specialId}`, {
        method: 'DELETE',
      });
      return specialId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove special availability');
    }
  }
);

// Set immediate availability
export const setImmediateAvailability = createAsyncThunk(
  'schedule/setImmediate',
  async (isAvailable, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/helper/availability/immediate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable }),
      });
      return response.json();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to set availability');
    }
  }
);

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    setDaySchedule: (state, action) => {
      const { day, enabled, startTime, endTime } = action.payload;
      if (state.weeklySchedule[day]) {
        state.weeklySchedule[day] = { enabled, startTime, endTime };
      }
    },
    toggleDay: (state, action) => {
      const day = action.payload;
      if (state.weeklySchedule[day]) {
        state.weeklySchedule[day].enabled = !state.weeklySchedule[day].enabled;
      }
    },
    setTimeRange: (state, action) => {
      const { day, startTime, endTime } = action.payload;
      if (state.weeklySchedule[day]) {
        state.weeklySchedule[day].startTime = startTime;
        state.weeklySchedule[day].endTime = endTime;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Schedule
      .addCase(fetchSchedule.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSchedule.fulfilled, (state, action) => {
        state.loading = false;
        state.weeklySchedule = action.payload.weeklySchedule || state.weeklySchedule;
        state.specialAvailability = action.payload.specialAvailability || [];
        state.isAvailable = action.payload.isAvailable || false;
      })
      .addCase(fetchSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Weekly Schedule
      .addCase(updateWeeklySchedule.fulfilled, (state, action) => {
        state.weeklySchedule = action.payload.weeklySchedule || state.weeklySchedule;
      })
      // Add Special Availability
      .addCase(addSpecialAvailability.fulfilled, (state, action) => {
        state.specialAvailability.push(action.payload);
      })
      // Remove Special Availability
      .addCase(removeSpecialAvailability.fulfilled, (state, action) => {
        state.specialAvailability = state.specialAvailability.filter(
          (item) => item.id !== action.payload
        );
      })
      // Set Immediate Availability
      .addCase(setImmediateAvailability.fulfilled, (state, action) => {
        state.isAvailable = action.payload.isAvailable;
      });
  },
});

export const { setDaySchedule, toggleDay, setTimeRange, clearError } = scheduleSlice.actions;
export default scheduleSlice.reducer;
