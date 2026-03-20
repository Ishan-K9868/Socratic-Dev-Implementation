import { Router } from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';

const router = Router();

router.get('/achievements', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      achievements: {
        totalXP: user.totalXP || 0,
        currentLeague: user.currentLeague || 'Bronze',
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0,
        skills: user.skills || [],
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/leaderboard', auth, async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    const users = await User.find({})
      .sort({ totalXP: -1 })
      .limit(parseInt(limit, 10))
      .select('displayName avatar totalXP currentStreak currentLeague')
      .lean();

    res.json({
      success: true,
      leaderboard: users.map((u, index) => ({
        id: u._id,
        name: u.displayName || 'Anonymous',
        avatar: u.avatar || null,
        xp: u.totalXP || 0,
        streak: u.currentStreak || 0,
        league: u.currentLeague || 'Bronze',
        rank: index + 1,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/xp', auth, async (req, res, next) => {
  try {
    const { amount, reason } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'amount must be a positive number',
      });
    }

    if (amount > 500) {
      return res.status(400).json({
        success: false,
        message: 'Maximum XP award per request is 500',
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await user.addXP(amount);

    res.json({
      success: true,
      user: {
        totalXP: user.totalXP,
        currentLeague: user.currentLeague,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
      },
      xpAdded: amount,
      reason: reason || 'unspecified',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
