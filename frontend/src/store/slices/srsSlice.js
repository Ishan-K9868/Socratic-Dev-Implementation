import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';


export const fetchCards = createAsyncThunk(
  'srs/fetchCards',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/flashcards');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cards');
    }
  }
);

export const fetchDueCards = createAsyncThunk(
  'srs/fetchDueCards',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/flashcards?due=true');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch due cards');
    }
  }
);

export const fetchStats = createAsyncThunk(
  'srs/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/flashcards/stats');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
    }
  }
);

export const createCard = createAsyncThunk(
  'srs/createCard',
  async (cardData, { rejectWithValue }) => {
    try {
      const response = await api.post('/flashcards', cardData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create card');
    }
  }
);

export const updateCard = createAsyncThunk(
  'srs/updateCard',
  async ({ id, ...updates }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/flashcards/${id}`, updates);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update card');
    }
  }
);

export const deleteCard = createAsyncThunk(
  'srs/deleteCard',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/flashcards/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete card');
    }
  }
);

export const reviewCard = createAsyncThunk(
  'srs/reviewCard',
  async ({ id, quality }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/flashcards/${id}/review`, { quality });
      return { id, ...response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit review');
    }
  }
);

const initialState = {
  cards: [],
  dueCards: [],
  stats: {
    total: 0,
    new: 0,
    learning: 0,
    review: 0,
    mastered: 0,
    dueNow: 0,
    avgEaseFactor: 2.5,
  },
  session: {
    isActive: false,
    currentIndex: 0,
    reviewed: 0,
    correct: 0,
  },
  loading: {
    cards: false,
    stats: false,
    action: false,
  },
  error: null,
};

const defaultStats = {
  total: 0,
  new: 0,
  learning: 0,
  review: 0,
  mastered: 0,
  dueNow: 0,
  avgEaseFactor: 2.5,
};

const srsSlice = createSlice({
  name: 'srs',
  initialState,
  reducers: {
    startSession: (state) => {
      state.session = {
        isActive: true,
        currentIndex: 0,
        reviewed: 0,
        correct: 0,
      };
    },
    endSession: (state) => {
      state.session = {
        isActive: false,
        currentIndex: 0,
        reviewed: 0,
        correct: 0,
      };
    },
    nextCard: (state) => {
      if (state.session.currentIndex < state.dueCards.length - 1) {
        state.session.currentIndex += 1;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCards.pending, (state) => {
        state.loading.cards = true;
        state.error = null;
      })
      .addCase(fetchCards.fulfilled, (state, action) => {
        state.loading.cards = false;
        state.cards = action.payload || [];
      })
      .addCase(fetchCards.rejected, (state, action) => {
        state.loading.cards = false;
        state.error = action.payload;
      })
      .addCase(fetchDueCards.pending, (state) => {
        state.loading.cards = true;
        state.error = null;
      })
      .addCase(fetchDueCards.fulfilled, (state, action) => {
        state.loading.cards = false;
        state.dueCards = action.payload || [];
        if (state.session.currentIndex >= state.dueCards.length) {
          state.session.currentIndex = Math.max(0, state.dueCards.length - 1);
        }
      })
      .addCase(fetchDueCards.rejected, (state, action) => {
        state.loading.cards = false;
        state.error = action.payload;
      })
      .addCase(fetchStats.pending, (state) => {
        state.loading.stats = true;
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.loading.stats = false;
        state.stats = { ...defaultStats, ...(action.payload || {}) };
      })
      .addCase(fetchStats.rejected, (state, action) => {
        state.loading.stats = false;
        state.error = action.payload;
      })
      .addCase(createCard.pending, (state) => {
        state.loading.action = true;
        state.error = null;
      })
      .addCase(createCard.fulfilled, (state, action) => {
        state.loading.action = false;
        state.cards.push(action.payload);
        state.dueCards.push(action.payload); // Also add to due cards
        state.stats.total += 1;
        state.stats.new += 1;
        state.stats.dueNow += 1;
      })
      .addCase(createCard.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload;
      })
      .addCase(updateCard.fulfilled, (state, action) => {
        const index = state.cards.findIndex((c) => c._id === action.payload._id);
        if (index !== -1) {
          state.cards[index] = action.payload;
        }
      })
      .addCase(deleteCard.fulfilled, (state, action) => {
        state.cards = state.cards.filter((c) => c._id !== action.payload);
        state.dueCards = state.dueCards.filter((c) => c._id !== action.payload);
        state.stats.total -= 1;
      })
      .addCase(reviewCard.pending, (state) => {
        state.loading.action = true;
      })
      .addCase(reviewCard.fulfilled, (state, action) => {
        state.loading.action = false;
        const reviewedCardId = action.payload.cardId || action.payload.id;
        
        state.session.reviewed += 1;
        if (action.payload.quality >= 3) {
          state.session.correct += 1;
        }

        state.cards = state.cards.map((card) =>
          card._id === reviewedCardId
            ? {
                ...card,
                interval: action.payload.interval,
                repetitions: action.payload.repetitions,
                easeFactor: action.payload.easeFactor,
                nextReview: action.payload.nextReview,
                lastReview: action.payload.lastReview,
              }
            : card
        );
        
        state.dueCards = state.dueCards.filter((c) => c._id !== reviewedCardId);
        if (state.session.currentIndex >= state.dueCards.length) {
          state.session.currentIndex = Math.max(0, state.dueCards.length - 1);
        }
        
        state.stats.dueNow = Math.max(0, state.stats.dueNow - 1);
      })
      .addCase(reviewCard.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload;
      });
  },
});

export const { startSession, endSession, nextCard, clearError } = srsSlice.actions;
export default srsSlice.reducer;
