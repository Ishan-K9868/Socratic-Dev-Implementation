import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['parsons', 'codeSurgery', 'mentalCompiler', 'fillBlanks', 'eli5'],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    topic: {
      type: String,
      default: 'general',
    },
    challenge: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    userAnswer: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    evaluation: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    isCorrect: {
      type: Boolean,
      default: null,
    },
    xpEarned: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fetching a user's challenge history sorted by recency
challengeSchema.index({ userId: 1, createdAt: -1 });

const Challenge = mongoose.model('Challenge', challengeSchema);
export default Challenge;
