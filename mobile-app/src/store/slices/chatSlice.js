import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/v1/chat/conversations');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversations');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (conversationId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/v1/chat/conversations/${conversationId}/messages`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ conversationId, recipientId, content }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/v1/chat/messages', {
        conversationId,
        recipientId,
        content,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

export const markMessagesAsRead = createAsyncThunk(
  'chat/markAsRead',
  async (conversationId, { rejectWithValue }) => {
    try {
      await api.put(`/api/v1/chat/conversations/${conversationId}/read`);
      return conversationId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark as read');
    }
  }
);

export const startConversation = createAsyncThunk(
  'chat/startConversation',
  async ({ recipientId }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/v1/chat/conversations', { recipientId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start conversation');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload;
    },
    addMessage: (state, action) => {
      const { conversationId, message } = action.payload;
      const conversation = state.conversations.find((c) => c.id === conversationId);
      if (conversation) {
        conversation.lastMessage = message;
        conversation.lastMessageAt = message.createdAt;
      }
      if (state.currentConversation?.id === conversationId) {
        state.messages.push(message);
      }
    },
    updateUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
        // Calculate unread count
        state.unreadCount = action.payload.reduce((count, conv) => {
          return count + (conv.unreadCount || 0);
        }, 0);
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messages = action.payload;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.messages.push(action.payload);
        // Update conversation's last message
        const conversation = state.conversations.find((c) => c.id === action.payload.conversationId);
        if (conversation) {
          conversation.lastMessage = action.payload;
          conversation.lastMessageAt = action.payload.createdAt;
        }
      })
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        const conversation = state.conversations.find((c) => c.id === action.payload);
        if (conversation) {
          state.unreadCount -= conversation.unreadCount || 0;
          conversation.unreadCount = 0;
        }
      });
  },
});

export const { setCurrentConversation, addMessage, updateUnreadCount, clearError } = chatSlice.actions;
export default chatSlice.reducer;
