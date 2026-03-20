import { Router } from 'express';
import auth from '../middleware/auth.js';
import Challenge from '../models/Challenge.js';
import User from '../models/User.js';
import geminiService from '../services/geminiService.js';
const { generateChallenge, evaluateAnswer } = geminiService;

const router = Router();

router.use(auth);

router.get('/generate/:type', async (req, res, next) => {
  try {
    const { type } = req.params;
    const { difficulty = 'medium', topic = 'general' } = req.query;

    const validTypes = ['parsons', 'codeSurgery', 'mentalCompiler', 'fillBlanks', 'eli5'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid challenge type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    const challengeData = await generateChallenge(type, difficulty, topic);

    const challenge = await Challenge.create({
      userId: req.userId,
      type,
      difficulty,
      topic,
      challenge: challengeData,
    });

    res.json({
      success: true,
      challenge: {
        id: challenge._id,
        type: challenge.type,
        difficulty: challenge.difficulty,
        topic: challenge.topic,
        data: challenge.challenge,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/evaluate', async (req, res, next) => {
  try {
    const { challengeId, type, challenge, answer } = req.body;

    if (!type || !challenge || answer === undefined) {
      return res.status(400).json({
        success: false,
        message: 'type, challenge, and answer are required',
      });
    }

    const evaluation = await evaluateAnswer(type, challenge, answer);

    const isCorrect = evaluation.isCorrect || false;
    const xpEarned = isCorrect ? (type === 'eli5' ? 15 : 10) : 2;

    if (challengeId) {
      await Challenge.findOneAndUpdate(
        { _id: challengeId, userId: req.userId },
        {
          userAnswer: answer,
          evaluation,
          isCorrect,
          xpEarned,
          completedAt: new Date(),
        }
      );
    }

    const user = await User.findById(req.userId);
    if (user) {
      user.addXP(xpEarned);
      await user.save();
    }

    res.json({
      success: true,
      evaluation,
      isCorrect,
      xpEarned,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const { limit = 20, type } = req.query;

    const filter = { userId: req.userId };
    if (type) filter.type = type;

    const challenges = await Challenge.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .lean();

    res.json({
      success: true,
      challenges: challenges.map((c) => ({
        id: c._id,
        type: c.type,
        difficulty: c.difficulty,
        topic: c.topic,
        isCorrect: c.isCorrect,
        xpEarned: c.xpEarned,
        completedAt: c.completedAt,
        createdAt: c.createdAt,
      })),
      total: challenges.length,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
