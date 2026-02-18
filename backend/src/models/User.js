import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    // Gamification
    totalXP: {
      type: Number,
      default: 0,
    },
    currentLeague: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
      default: 'bronze',
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastActiveDate: {
      type: Date,
      default: Date.now,
    },
    // Skill levels (0-100)
    skills: {
      algorithms: { type: Number, default: 0, min: 0, max: 100 },
      dataStructures: { type: Number, default: 0, min: 0, max: 100 },
      debugging: { type: Number, default: 0, min: 0, max: 100 },
      designPatterns: { type: Number, default: 0, min: 0, max: 100 },
      testing: { type: Number, default: 0, min: 0, max: 100 },
      architecture: { type: Number, default: 0, min: 0, max: 100 },
    },
    // User preferences
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'dark',
      },
      preferredLanguage: {
        type: String,
        default: 'javascript',
      },
      dailyGoal: {
        type: Number,
        default: 30,
        min: 5,
        max: 120,
      },
    },
    // Achievements unlocked (array of achievement IDs)
    unlockedAchievements: [{ type: String }],
    // Daily quests completed today
    dailyQuestsCompleted: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Method to add XP and update league
userSchema.methods.addXP = function (amount) {
  this.totalXP += amount;

  // Update league based on XP thresholds
  if (this.totalXP >= 10000) {
    this.currentLeague = 'diamond';
  } else if (this.totalXP >= 5000) {
    this.currentLeague = 'platinum';
  } else if (this.totalXP >= 2000) {
    this.currentLeague = 'gold';
  } else if (this.totalXP >= 500) {
    this.currentLeague = 'silver';
  }

  return this.save();
};

// Method to update streak
userSchema.methods.updateStreak = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActive = new Date(this.lastActiveDate);
  lastActive.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    // Consecutive day
    this.currentStreak += 1;
    if (this.currentStreak > this.longestStreak) {
      this.longestStreak = this.currentStreak;
    }
  } else if (diffDays > 1) {
    // Streak broken
    this.currentStreak = 1;
  }
  // diffDays === 0 means same day, don't change streak

  this.lastActiveDate = new Date();
  return this.save();
};

const User = mongoose.model('User', userSchema);

export default User;
