import express from 'express';
import mongoose from 'mongoose';
import { body, param, query, validationResult } from 'express-validator';
import Flashcard from '../models/Flashcard.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const { due, tag, limit = 100, skip = 0 } = req.query;

    const filter = { userId: req.userId };

    if (due === 'true') {
      filter.nextReview = { $lte: new Date() };
    }

    if (tag) {
      filter.tags = tag;
    }

    const cards = await Flashcard.find(filter)
      .sort({ nextReview: 1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Flashcard.countDocuments(filter);

    res.json({
      success: true,
      data: cards,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
      },
    });
  } catch (error) {
    next(error);
  }
});
router.get('/stats', async (req, res, next) => {
  try {
    const userId = req.userId;
    const now = new Date();

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const stats = await Flashcard.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          new: {
            $sum: { $cond: [{ $eq: ['$repetitions', 0] }, 1, 0] },
          },
          learning: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ['$repetitions', 0] },
                    { $lt: ['$interval', 21] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          mastered: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$interval', 21] },
                    { $gte: ['$easeFactor', 2.5] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          dueNow: {
            $sum: { $cond: [{ $lte: ['$nextReview', now] }, 1, 0] },
          },
          avgEaseFactor: { $avg: '$easeFactor' },
        },
      },
    ]);

    const result = stats[0] || {
      total: 0,
      new: 0,
      learning: 0,
      mastered: 0,
      dueNow: 0,
      avgEaseFactor: 2.5,
    };

    result.review = result.total - result.new - result.learning - result.mastered;

    res.json({
      success: true,
      data: {
        total: result.total,
        new: result.new,
        learning: result.learning,
        review: result.review,
        mastered: result.mastered,
        dueNow: result.dueNow,
        avgEaseFactor: Math.round((result.avgEaseFactor || 2.5) * 100) / 100,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid card ID')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const card = await Flashcard.findOne({
        _id: req.params.id,
        userId: req.userId,
      });

      if (!card) {
        return res.status(404).json({
          success: false,
          message: 'Flashcard not found',
        });
      }

      res.json({ success: true, data: card });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/',
  [
    body('front')
      .trim()
      .notEmpty()
      .withMessage('Front content is required')
      .isLength({ max: 5000 })
      .withMessage('Front content too long'),
    body('back')
      .trim()
      .notEmpty()
      .withMessage('Back content is required')
      .isLength({ max: 5000 })
      .withMessage('Back content too long'),
    body('type')
      .optional()
      .isIn(['basic', 'cloze', 'code'])
      .withMessage('Invalid card type'),
    body('language').optional().trim(),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('sourceType')
      .optional()
      .isIn(['manual', 'chat', 'dojo'])
      .withMessage('Invalid source type'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { front, back, type, language, tags, sourceType } = req.body;

      const card = new Flashcard({
        userId: req.userId,
        front,
        back,
        type: type || 'basic',
        language: language || 'javascript',
        tags: tags || [],
        sourceType: sourceType || 'manual',
      });

      await card.save();

      res.status(201).json({
        success: true,
        message: 'Flashcard created successfully',
        data: card,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid card ID'),
    body('front')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Front content too long'),
    body('back')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Back content too long'),
    body('type')
      .optional()
      .isIn(['basic', 'cloze', 'code'])
      .withMessage('Invalid card type'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { front, back, type, language, tags } = req.body;
      const updates = {};

      if (front !== undefined) updates.front = front;
      if (back !== undefined) updates.back = back;
      if (type !== undefined) updates.type = type;
      if (language !== undefined) updates.language = language;
      if (tags !== undefined) updates.tags = tags;

      const card = await Flashcard.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!card) {
        return res.status(404).json({
          success: false,
          message: 'Flashcard not found',
        });
      }

      res.json({
        success: true,
        message: 'Flashcard updated successfully',
        data: card,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid card ID')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const card = await Flashcard.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId,
      });

      if (!card) {
        return res.status(404).json({
          success: false,
          message: 'Flashcard not found',
        });
      }

      res.json({
        success: true,
        message: 'Flashcard deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/:id/review',
  [
    param('id').isMongoId().withMessage('Invalid card ID'),
    body('quality')
      .isInt({ min: 0, max: 5 })
      .withMessage('Quality must be between 0 and 5'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const card = await Flashcard.findOne({
        _id: req.params.id,
        userId: req.userId,
      });

      if (!card) {
        return res.status(404).json({
          success: false,
          message: 'Flashcard not found',
        });
      }

      const { quality } = req.body;
      const result = card.calculateNextReview(quality);

      await card.save();

      res.json({
        success: true,
        message: 'Review recorded successfully',
        data: {
          cardId: card._id,
          quality,
          ...result,
          nextReviewFormatted: formatNextReview(result.nextReview),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

function formatNextReview(date) {
  const now = new Date();
  const diff = date - now;

  if (diff <= 0) return 'Now';

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));

  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `In ${days} days`;
  if (days < 30) return `In ${Math.floor(days / 7)} weeks`;
  if (days < 365) return `In ${Math.floor(days / 30)} months`;
  return `In ${Math.floor(days / 365)} years`;
}

export default router;
