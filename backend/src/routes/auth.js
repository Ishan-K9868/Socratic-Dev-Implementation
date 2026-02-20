import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Note: The frontend uses client-side Google Sign-In (POST /google/token).
// The old server-redirect flow (GET /google → GET /google/callback) has been removed.


/**
 * @route   POST /api/auth/google/token
 * @desc    Verify Google ID token from client-side flow
 * @access  Public
 */
router.post('/google/token', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required',
      });
    }

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find or create user
    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.create({
        googleId,
        email,
        displayName: name,
        avatar: picture || '',
      });
      console.log('✨ New user created via token:', email);
    }

    // Update streak on login
    await user.updateStreak();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        totalXP: user.totalXP,
        currentLeague: user.currentLeague,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        skills: user.skills,
        preferences: user.preferences,
        unlockedAchievements: user.unlockedAchievements,
      },
    });
  } catch (error) {
    console.error('Google token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid Google credential',
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        totalXP: user.totalXP,
        currentLeague: user.currentLeague,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        skills: user.skills,
        preferences: user.preferences,
        unlockedAchievements: user.unlockedAchievements,
        dailyQuestsCompleted: user.dailyQuestsCompleted,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

/**
 * @route   PUT /api/auth/preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.put('/preferences', auth, async (req, res) => {
  try {
    const { theme, preferredLanguage, dailyGoal } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (theme) user.preferences.theme = theme;
    if (preferredLanguage) user.preferences.preferredLanguage = preferredLanguage;
    if (dailyGoal) user.preferences.dailyGoal = dailyGoal;

    await user.save();

    res.json({
      success: true,
      preferences: user.preferences,
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout acknowledgment (client-side token removal)
 * @access  Public
 */
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful. Please remove token from client.',
  });
});

export default router;
