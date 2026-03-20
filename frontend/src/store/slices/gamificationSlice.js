import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { gamificationAPI } from '../../services/api';

export const syncXPToBackend = createAsyncThunk(
  'gamification/syncXPToBackend',
  async ({ amount, reason }, { rejectWithValue }) => {
    try {
      const response = await gamificationAPI.addXP(amount, reason);
      return { ...response.data, localAmount: amount };
    } catch (error) {
      return rejectWithValue({ message: error.response?.data?.message || 'Failed to sync XP' });
    }
  }
);

export const fetchLeaderboard = createAsyncThunk(
  'gamification/fetchLeaderboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await gamificationAPI.getLeaderboard();
      return response.data.leaderboard;
    } catch (error) {
      return rejectWithValue({ message: error.response?.data?.message || 'Failed to fetch leaderboard' });
    }
  }
);

const initialState = {
  stats: {
    totalMessages: 0,
    totalChallengesCompleted: 0,
    totalCardsCreated: 0,
    totalCardsReviewed: 0,
    totalDojoCompleted: 0,
    challengeTypesCompleted: [], // Track which types user has tried
  },
  
  dailyQuests: [],
  dailyXPGoal: 50,
  dailyXPProgress: 0,
  lastQuestReset: null, // ISO date string
  
  unlockedAchievements: [],
  
  leaderboard: [],
  leaderboardLoading: false,
  weeklyXP: 0,
};

const gamificationSlice = createSlice({
  name: 'gamification',
  initialState,
  reducers: {
    
    trackChatMessage: (state) => {
      state.stats.totalMessages += 1;
      state.dailyXPProgress += 5;
      state.weeklyXP += 5;
      
      if (!state.unlockedAchievements.includes('first_chat')) {
        state.unlockedAchievements.push('first_chat');
      }
      
      const chatQuest = state.dailyQuests.find(q => q.id === 'chat-ai');
      if (chatQuest && !chatQuest.completed) {
        chatQuest.progress = (chatQuest.progress || 0) + 1;
        if (chatQuest.progress >= chatQuest.target) {
          chatQuest.completed = true;
        }
      }
    },
    
    trackCardCreated: (state) => {
      state.stats.totalCardsCreated += 1;
      state.dailyXPProgress += 3;
      state.weeklyXP += 3;
      
      if (state.stats.totalCardsCreated >= 10 && !state.unlockedAchievements.includes('cards_10')) {
        state.unlockedAchievements.push('cards_10');
      }
      if (state.stats.totalCardsCreated >= 100 && !state.unlockedAchievements.includes('cards_100')) {
        state.unlockedAchievements.push('cards_100');
      }
    },
    
    trackCardReviewed: (state) => {
      state.stats.totalCardsReviewed += 1;
      
      const reviewQuest = state.dailyQuests.find(q => q.id === 'review-cards');
      if (reviewQuest && !reviewQuest.completed) {
        reviewQuest.progress = (reviewQuest.progress || 0) + 1;
        if (reviewQuest.progress >= reviewQuest.target) {
          reviewQuest.completed = true;
        }
      }
    },
    
    trackChallengeCompleted: (state, action) => {
      const challengeType = action.payload; // e.g., 'parsons', 'mental_compiler'
      state.stats.totalChallengesCompleted += 1;
      state.stats.totalDojoCompleted += 1;
      state.dailyXPProgress += 10;
      state.weeklyXP += 10;
      
      if (challengeType && !state.stats.challengeTypesCompleted.includes(challengeType)) {
        state.stats.challengeTypesCompleted.push(challengeType);
      }
      
      if (state.stats.totalDojoCompleted === 1 && !state.unlockedAchievements.includes('dojo_first')) {
        state.unlockedAchievements.push('dojo_first');
      }
      if (state.stats.challengeTypesCompleted.length >= 5 && !state.unlockedAchievements.includes('dojo_all')) {
        state.unlockedAchievements.push('dojo_all');
      }
      
      const challengeQuest = state.dailyQuests.find(q => q.id === 'complete-challenge');
      if (challengeQuest && !challengeQuest.completed) {
        challengeQuest.progress = (challengeQuest.progress || 0) + 1;
        if (challengeQuest.progress >= challengeQuest.target) {
          challengeQuest.completed = true;
        }
      }
    },
    
    checkXPAchievements: (state, action) => {
      const totalXP = action.payload;
      if (totalXP >= 100 && !state.unlockedAchievements.includes('xp_100')) {
        state.unlockedAchievements.push('xp_100');
      }
      if (totalXP >= 1000 && !state.unlockedAchievements.includes('xp_1000')) {
        state.unlockedAchievements.push('xp_1000');
      }
      if (totalXP >= 5000 && !state.unlockedAchievements.includes('xp_5000')) {
        state.unlockedAchievements.push('xp_5000');
      }
    },
    
    checkStreakAchievements: (state, action) => {
      const streak = action.payload;
      if (streak >= 3 && !state.unlockedAchievements.includes('streak_3')) {
        state.unlockedAchievements.push('streak_3');
      }
      if (streak >= 7 && !state.unlockedAchievements.includes('streak_7')) {
        state.unlockedAchievements.push('streak_7');
      }
      if (streak >= 30 && !state.unlockedAchievements.includes('streak_30')) {
        state.unlockedAchievements.push('streak_30');
      }
    },
    
    checkNightOwl: (state) => {
      const hour = new Date().getHours();
      if (hour >= 0 && hour < 5 && !state.unlockedAchievements.includes('night_owl')) {
        state.unlockedAchievements.push('night_owl');
      }
    },
    
    
    initializeDailyQuests: (state) => {
      const today = new Date().toDateString();
      
      if (state.lastQuestReset !== today) {
        state.dailyQuests = [
          { id: 'chat-ai', title: 'Have a learning conversation', description: 'Send 3 messages', target: 3, progress: 0, xp: 15, completed: false },
          { id: 'complete-challenge', title: 'Complete a Dojo challenge', description: 'Finish 1 challenge', target: 1, progress: 0, xp: 25, completed: false },
          { id: 'review-cards', title: 'Review flashcards', description: 'Review 5 cards', target: 5, progress: 0, xp: 20, completed: false },
        ];
        state.lastQuestReset = today;
        state.dailyXPProgress = 0;
      }
    },
    
    completeQuest: (state, action) => {
      const quest = state.dailyQuests.find(q => q.id === action.payload);
      if (quest && !quest.completed) {
        quest.completed = true;
      }
    },
    
    
    addDailyXP: (state, action) => {
      state.dailyXPProgress += action.payload;
      state.weeklyXP += action.payload;
    },
    
    addWeeklyXP: (state, action) => {
      state.weeklyXP += action.payload;
    },
    
    resetWeeklyXP: (state) => {
      state.weeklyXP = 0;
    },
    
    setDailyXPGoal: (state, action) => {
      state.dailyXPGoal = action.payload;
    },
    
    resetDailyXP: (state) => {
      state.dailyXPProgress = 0;
    },
    
    
    setLeaderboard: (state, action) => {
      state.leaderboard = action.payload;
    },
    
    unlockAchievement: (state, action) => {
      if (!state.unlockedAchievements.includes(action.payload)) {
        state.unlockedAchievements.push(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncXPToBackend.fulfilled, (state, action) => {
        const amount = action.payload.localAmount || 0;
        state.dailyXPProgress += amount;
        state.weeklyXP += amount;
      })
      .addCase(syncXPToBackend.rejected, (state, action) => {
        const amount = action.meta.arg?.amount || 0;
        state.dailyXPProgress += amount;
        state.weeklyXP += amount;
      });

    builder
      .addCase(fetchLeaderboard.pending, (state) => {
        state.leaderboardLoading = true;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.leaderboard = action.payload;
        state.leaderboardLoading = false;
      })
      .addCase(fetchLeaderboard.rejected, (state) => {
        state.leaderboardLoading = false;
      });
  },
});

export const {
  trackChatMessage,
  trackCardCreated,
  trackCardReviewed,
  trackChallengeCompleted,
  checkXPAchievements,
  checkStreakAchievements,
  checkNightOwl,
  initializeDailyQuests,
  completeQuest,
  addDailyXP,
  addWeeklyXP,
  resetWeeklyXP,
  setDailyXPGoal,
  resetDailyXP,
  setLeaderboard,
  unlockAchievement,
} = gamificationSlice.actions;

export default gamificationSlice.reducer;
