import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  conversations: [],
  activeConversationId: null,
  messages: [],
  isTyping: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConversations: (state, action) => {
      state.conversations = action.payload;
    },
    addConversation: (state, action) => {
      const newConversation = {
        id: crypto.randomUUID(),
        title: action.payload.title || 'New Chat',
        createdAt: new Date().toISOString(),
        messages: [],
      };
      state.conversations.unshift(newConversation);
      state.activeConversationId = newConversation.id;
      state.messages = [];
    },
    setActiveConversation: (state, action) => {
      state.activeConversationId = action.payload;
      const conversation = state.conversations.find(c => c.id === action.payload);
      state.messages = conversation?.messages || [];
    },
    updateConversationId: (state, action) => {
      // Update activeConversationId WITHOUT resetting messages
      // Used when backend returns a real ObjectId to replace a client UUID
      const oldId = state.activeConversationId;
      state.activeConversationId = action.payload;
      const conversation = state.conversations.find(c => c.id === oldId);
      if (conversation) {
        conversation.id = action.payload;
      }
    },
    addMessage: (state, action) => {
      const message = {
        id: crypto.randomUUID(),
        role: action.payload.role, // 'user' | 'assistant'
        content: action.payload.content,
        timestamp: new Date().toISOString(),
      };
      state.messages.push(message);
      
      // Update conversation
      const conversation = state.conversations.find(
        c => c.id === state.activeConversationId
      );
      if (conversation) {
        conversation.messages.push(message);
        // Update title from first user message
        if (conversation.messages.length === 1 && action.payload.role === 'user') {
          conversation.title = action.payload.content.slice(0, 50) + (action.payload.content.length > 50 ? '...' : '');
        }
      }
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    deleteConversation: (state, action) => {
      state.conversations = state.conversations.filter(c => c.id !== action.payload);
      if (state.activeConversationId === action.payload) {
        state.activeConversationId = state.conversations[0]?.id || null;
        state.messages = state.conversations[0]?.messages || [];
      }
    },
    setIsTyping: (state, action) => {
      state.isTyping = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setConversations,
  addConversation,
  setActiveConversation,
  updateConversationId,
  addMessage,
  clearMessages,
  deleteConversation,
  setIsTyping,
  setError,
  clearError,
} = chatSlice.actions;

export default chatSlice.reducer;
