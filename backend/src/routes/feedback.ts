// @ts-nocheck
import { AuthRequest } from '../middleware/auth';
import express from 'express';
import { body, validationResult } from 'express-validator';
import Feedback from '../models/Feedback';
import Issue from '../models/Issue';
import { authenticate, authorize, validateEmailDomain } from '../middleware/auth';

const router = express.Router();

// @route   GET /api/feedback
// @desc    Get all feedback (admin/authority see all; citizens see only their own)
// @access  Private
router.get('/', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      rating, 
      status,
      search
    } = req.query;

    // Build filter — citizens only see their own feedback
    const filter = {};
    if (req.user.role === 'citizen') {
      filter.user = req.user._id;
    }
    if (category) filter.category = category;
    if (rating) filter.rating = parseInt(rating);
    if (status) filter.status = status;
    
    if (search) {
      filter.$or = [
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const feedback = await Feedback.find(filter)
      .populate('user', 'name email')
      .populate('issue', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments(filter);

    res.json({
      success: true,
      data: feedback,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching feedback'
    });
  }
});

// @route   GET /api/feedback/analytics
// @desc    Get feedback analytics
// @access  Private/Admin/Authority
router.get('/analytics', authenticate, authorize('admin', 'authority'), async (req: AuthRequest, res: any) => {
  try {
    const analytics = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          totalFeedback: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          categoryBreakdown: {
            $push: {
              category: '$category',
              rating: '$rating'
            }
          },
          ratingBreakdown: {
            $push: {
              rating: '$rating'
            }
          },
          statusBreakdown: {
            $push: {
              status: '$status'
            }
          }
        }
      }
    ]);

    const result = analytics[0] || {
      totalFeedback: 0,
      averageRating: 0,
      categoryBreakdown: [],
      ratingBreakdown: [],
      statusBreakdown: []
    };

    // Process category breakdown
    const categoryStats = {};
    result.categoryBreakdown.forEach(item => {
      if (!categoryStats[item.category]) {
        categoryStats[item.category] = { count: 0, totalRating: 0 };
      }
      categoryStats[item.category].count++;
      categoryStats[item.category].totalRating += item.rating;
    });

    const categoryAnalytics = Object.keys(categoryStats).map(category => ({
      category,
      count: categoryStats[category].count,
      averageRating: (categoryStats[category].totalRating / categoryStats[category].count).toFixed(1)
    }));

    // Process rating breakdown
    const ratingStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    result.ratingBreakdown.forEach(rating => {
      ratingStats[rating.rating]++;
    });

    // Process status breakdown
    const statusStats = {};
    result.statusBreakdown.forEach(item => {
      statusStats[item.status] = (statusStats[item.status] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        totalFeedback: result.totalFeedback,
        averageRating: result.averageRating ? result.averageRating.toFixed(1) : 0,
        categoryAnalytics,
        ratingBreakdown: ratingStats,
        statusBreakdown: statusStats
      }
    });
  } catch (error) {
    console.error('Get feedback analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching feedback analytics'
    });
  }
});

// @route   POST /api/feedback
// @desc    Create new feedback
// @access  Private
router.post('/', [
  authenticate,
  body('category').isIn(['general', 'service-quality', 'issue-resolution', 'suggestion', 'complaint', 'compliment']).withMessage('Invalid category'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('message').trim().isLength({ min: 10, max: 1000 }).withMessage('Message must be between 10 and 1000 characters'),
  body('issueId').optional().isMongoId().withMessage('Invalid issue ID'),
  body('anonymous').optional().isBoolean().withMessage('Anonymous must be a boolean')
], async (req: AuthRequest, res: any) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { category, rating, message, issueId, anonymous } = req.body;

    // Validate issue if provided
    if (issueId) {
      const issue = await Issue.findById(issueId);
      if (!issue) {
        return res.status(404).json({
          success: false,
          message: 'Issue not found'
        });
      }
    }

    const feedback = await Feedback.create({
      user: req.user._id,
      issue: issueId || null,
      category,
      rating,
      message,
      anonymous: anonymous || false
    });

    const populatedFeedback = await Feedback.findById(feedback._id)
      .populate('user', 'name email')
      .populate('issue', 'title');

    res.status(201).json({
      success: true,
      data: populatedFeedback,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating feedback'
    });
  }
});

// @route   GET /api/feedback/:id
// @desc    Get single feedback by ID
// @access  Private/Admin/Authority
router.get('/:id', authenticate, authorize('admin', 'authority'), async (req: AuthRequest, res: any) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('user', 'name email')
      .populate('issue', 'title description');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching feedback'
    });
  }
});

// @route   PUT /api/feedback/:id/review
// @desc    Mark feedback as reviewed (admin/authority only)
// @access  Private/Admin/Authority
router.put('/:id/review', [
  authenticate,
  authorize('admin', 'authority'),
  body('adminResponse').optional().trim().isLength({ max: 1000 }).withMessage('Admin response cannot exceed 1000 characters')
], async (req: AuthRequest, res: any) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    const { adminResponse } = req.body;

    await feedback.markAsReviewed(adminResponse);

    const updatedFeedback = await Feedback.findById(req.params.id)
      .populate('user', 'name email')
      .populate('issue', 'title');

    res.json({
      success: true,
      data: updatedFeedback,
      message: 'Feedback marked as reviewed'
    });
  } catch (error) {
    console.error('Review feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reviewing feedback'
    });
  }
});

// @route   PUT /api/feedback/:id/address
// @desc    Mark feedback as addressed (admin only)
// @access  Private/Admin
router.put('/:id/address', authenticate, authorize('admin'), async (req: AuthRequest, res: any) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    await feedback.markAsAddressed();

    const updatedFeedback = await Feedback.findById(req.params.id)
      .populate('user', 'name email')
      .populate('issue', 'title');

    res.json({
      success: true,
      data: updatedFeedback,
      message: 'Feedback marked as addressed'
    });
  } catch (error) {
    console.error('Address feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while addressing feedback'
    });
  }
});

// @route   DELETE /api/feedback/:id
// @desc    Delete feedback (admin only)
// @access  Private/Admin
router.delete('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: any) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    await Feedback.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting feedback'
    });
  }
});

export default router;
