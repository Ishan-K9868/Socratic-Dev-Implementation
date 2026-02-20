import { createSlice } from '@reduxjs/toolkit';
import { syncXPToBackend } from './gamificationSlice';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    addXP: (state, action) => {
      if (state.user) {
        state.user.totalXP = (state.user.totalXP || 0) + action.payload;
        // Update league based on XP
        const xp = state.user.totalXP;
        if (xp >= 10000) state.user.currentLeague = 'Diamond';
        else if (xp >= 5000) state.user.currentLeague = 'Platinum';
        else if (xp >= 2000) state.user.currentLeague = 'Gold';
        else if (xp >= 500) state.user.currentLeague = 'Silver';
        else state.user.currentLeague = 'Bronze';
      }
    },
    updateSkill: (state, action) => {
      if (state.user && state.user.skills) {
        const { skill, value } = action.payload;
        state.user.skills[skill] = Math.min(100, Math.max(0, value));
      }
    },
    incrementStreak: (state) => {
      if (state.user) {
        state.user.currentStreak = (state.user.currentStreak || 0) + 1;
        if (state.user.currentStreak > (state.user.longestStreak || 0)) {
          state.user.longestStreak = state.user.currentStreak;
        }
      }
    },
    resetStreak: (state) => {
      if (state.user) {
        state.user.currentStreak = 0;
      }
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // When syncXPToBackend succeeds, update user.totalXP and league from API response
    builder.addCase(syncXPToBackend.fulfilled, (state, action) => {
      if (state.user && action.payload.user) {
        state.user.totalXP = action.payload.user.totalXP;
        state.user.currentLeague = action.payload.user.currentLeague;
        state.user.currentStreak = action.payload.user.currentStreak;
        state.user.longestStreak = action.payload.user.longestStreak;
      }
    });
    // On failure, still do optimistic local update
    builder.addCase(syncXPToBackend.rejected, (state, action) => {
      if (state.user) {
        const amount = action.meta.arg?.amount || 0;
        state.user.totalXP = (state.user.totalXP || 0) + amount;
        const xp = state.user.totalXP;
        if (xp >= 10000) state.user.currentLeague = 'Diamond';
        else if (xp >= 5000) state.user.currentLeague = 'Platinum';
        else if (xp >= 2000) state.user.currentLeague = 'Gold';
        else if (xp >= 500) state.user.currentLeague = 'Silver';
        else state.user.currentLeague = 'Bronze';
      }
    });
  },
});

export const {
  setCredentials,
  logout,
  updateUser,
  addXP,
  updateSkill,
  incrementStreak,
  resetStreak,
  setLoading,
  setError,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
