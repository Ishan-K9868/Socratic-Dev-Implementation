import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    front: {
      type: String,
      required: [true, 'Front content is required'],
      trim: true,
      maxlength: [5000, 'Front content cannot exceed 5000 characters'],
    },
    back: {
      type: String,
      required: [true, 'Back content is required'],
      trim: true,
      maxlength: [5000, 'Back content cannot exceed 5000 characters'],
    },
    type: {
      type: String,
      enum: ['basic', 'cloze', 'code'],
      default: 'basic',
    },
    language: {
      type: String,
      default: 'javascript',
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    sourceType: {
      type: String,
      enum: ['manual', 'chat', 'dojo'],
      default: 'manual',
    },
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SM-2 Algorithm Fields
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    interval: {
      type: Number,
      default: 0,
      min: 0,
    },
    repetitions: {
      type: Number,
      default: 0,
      min: 0,
    },
    easeFactor: {
      type: Number,
      default: 2.5,
      min: 1.3,
    },
    nextReview: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastReview: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
flashcardSchema.index({ userId: 1, nextReview: 1 });
flashcardSchema.index({ userId: 1, tags: 1 });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SM-2 Algorithm Implementation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Quality rating scale (0-5):
// 0 - Complete blackout, no recognition
// 1 - Incorrect, but upon seeing answer, remembered
// 2 - Incorrect, but answer seemed easy to recall
// 3 - Correct with serious difficulty
// 4 - Correct after hesitation
// 5 - Correct with perfect recall
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

flashcardSchema.methods.calculateNextReview = function (quality) {
  // Ensure quality is within bounds
  quality = Math.max(0, Math.min(5, quality));

  let { interval, repetitions, easeFactor } = this;

  if (quality < 3) {
    // Failed: reset the card
    repetitions = 0;
    interval = 1;
  } else {
    // Passed: increase interval based on repetition count
    if (repetitions === 0) {
      interval = 1; // First successful review: 1 day
    } else if (repetitions === 1) {
      interval = 6; // Second successful review: 6 days
    } else {
      // Subsequent reviews: multiply by ease factor
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Update ease factor (never below 1.3)
  // Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const qualityDiff = 5 - quality;
  easeFactor = easeFactor + (0.1 - qualityDiff * (0.08 + qualityDiff * 0.02));
  easeFactor = Math.max(1.3, easeFactor);

  // Calculate next review date
  const now = new Date();
  const nextReview = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  // Update the document
  this.interval = interval;
  this.repetitions = repetitions;
  this.easeFactor = Math.round(easeFactor * 100) / 100; // Round to 2 decimals
  this.nextReview = nextReview;
  this.lastReview = now;

  return {
    interval,
    repetitions,
    easeFactor: this.easeFactor,
    nextReview,
    lastReview: now,
  };
};

// Virtual to check if card is due
flashcardSchema.virtual('isDue').get(function () {
  return new Date() >= this.nextReview;
});

// Virtual to get card status
flashcardSchema.virtual('status').get(function () {
  if (this.repetitions === 0) return 'new';
  if (this.interval < 21) return 'learning';
  if (this.easeFactor >= 2.5) return 'mastered';
  return 'review';
});

// Include virtuals in JSON output
flashcardSchema.set('toJSON', { virtuals: true });
flashcardSchema.set('toObject', { virtuals: true });

export default mongoose.model('Flashcard', flashcardSchema);
