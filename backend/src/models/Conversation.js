import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Chat',
      maxlength: 200,
    },
    mode: {
      type: String,
      enum: ['learning', 'building'],
      default: 'learning',
    },
    messages: [messageSchema],
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ userId: 1, lastMessageAt: -1 });

// Auto-generates title from first user message agar user ne title nhi daala to
conversationSchema.methods.autoTitle = function () {
  if (this.title === 'New Chat' && this.messages.length > 0) {
    const firstUserMsg = this.messages.find((m) => m.role === 'user');
    if (firstUserMsg) {
      this.title = firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? '…' : '');
    }
  }
};

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
