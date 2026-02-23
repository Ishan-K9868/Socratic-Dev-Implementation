import { Router } from 'express';
import mongoose from 'mongoose';
import auth from '../middleware/auth.js';
import Conversation from '../models/Conversation.js';
import geminiService from '../services/geminiService.js';
const { generateResponse } = geminiService;

const router = Router();

// All routes require authentication
router.use(auth);

/**
 * GET /api/chat/history
 * Get all conversations for the authenticated user (lazy-load — titles only)
 * Query params: limit (default 30)
 */
router.get('/history', async (req, res, next) => {
  try {
    const { limit = 30 } = req.query;

    const conversations = await Conversation.find({ userId: req.userId })
      .sort({ lastMessageAt: -1 })
      .limit(parseInt(limit, 10))
      .select('title mode lastMessageAt createdAt')
      .lean();

    res.json({
      success: true,
      conversations: conversations.map((c) => ({
        id: c._id,
        title: c.title,
        mode: c.mode,
        lastMessageAt: c.lastMessageAt,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/chat/:conversationId
 * Get full messages for a specific conversation (lazy-load messages)
 */
router.get('/:conversationId', async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      userId: req.userId,
    }).lean();

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    res.json({
      success: true,
      conversation: {
        id: conversation._id,
        title: conversation.title,
        mode: conversation.mode,
        messages: conversation.messages,
        createdAt: conversation.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/chat/message
 * Send a message and get AI response — persists both to a Conversation
 * Body: { message, mode, conversationId?, history? }
 */
router.post('/message', async (req, res, next) => {
  try {
    const { message, mode = 'learning', conversationId, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
    }

    // Generate AI response
    const aiResponse = await generateResponse(message, mode, history);

    // Find existing conversation or create a new one
    // Note: Frontend may pass client-generated UUIDs which aren't valid ObjectIds
    let conversation;
    if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        userId: req.userId,
      });
    }

    if (!conversation) {
      conversation = new Conversation({
        userId: req.userId,
        mode,
        title: message.slice(0, 60) + (message.length > 60 ? '…' : ''),
      });
    }

    // Append both messages
    // NOTE: generateResponse() returns a plain string, not an object
    conversation.messages.push(
      { role: 'user', content: message },
      { role: 'assistant', content: aiResponse }
    );
    conversation.lastMessageAt = new Date();
    await conversation.save();

    res.json({
      success: true,
      response: {
        content: aiResponse,
        mode,
      },
      conversationId: conversation._id,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/chat/:conversationId
 * Delete a conversation
 */
router.delete('/:conversationId', async (req, res, next) => {
  try {
    const result = await Conversation.findOneAndDelete({
      _id: req.params.conversationId,
      userId: req.userId,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    res.json({
      success: true,
      message: 'Conversation deleted',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/chat/stream
 * Streaming chat — Not yet implemented
 */
router.post('/stream', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Streaming is not yet implemented',
  });
});

export default router;
