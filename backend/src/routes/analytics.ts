// @ts-nocheck
import { AuthRequest } from '../middleware/auth';
import express from 'express';
import User from '../models/User';
import Issue from '../models/Issue';
import Feedback from '../models/Feedback';
import { authenticate, authorize, validateEmailDomain } from '../middleware/auth';

const router = express.Router();

// @route   GET /api/analytics
// @desc    Get system analytics
// @access  Private (All Roles)
router.get('/', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    // Get user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalUsers = await User.countDocuments({ status: 'active' });
    const pendingAuthorities = await User.countDocuments({ role: 'authority', status: 'pending' });

    // Get issue statistics
    const issueStats = await Issue.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalIssues = await Issue.countDocuments();
    const resolvedIssues = await Issue.countDocuments({ status: 'resolved' });
    const openIssues = await Issue.countDocuments({ status: 'open' });
    const inProgressIssues = await Issue.countDocuments({ status: 'in-progress' });

    // Get category breakdown
    const categoryStats = await Issue.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get priority breakdown
    const priorityStats = await Issue.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get feedback statistics
    const feedbackStats = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          totalFeedback: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      }
    ]);

    // Get monthly issue trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await Issue.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get resolution time statistics
    const resolutionStats = await Issue.aggregate([
      {
        $match: {
          status: 'resolved',
          actualResolution: { $exists: true }
        }
      },
      {
        $project: {
          resolutionTime: {
            $subtract: ['$actualResolution', '$createdAt']
          }
        }
      },
      {
        $group: {
          _id: null,
          averageResolutionTime: { $avg: '$resolutionTime' },
          minResolutionTime: { $min: '$resolutionTime' },
          maxResolutionTime: { $max: '$resolutionTime' }
        }
      }
    ]);

    // Get top voted issues — sort by votes array length using aggregation
    const topVotedIssues = await Issue.aggregate([
      { $addFields: { voteCount: { $size: '$votes' } } },
      { $sort: { voteCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: 'reportedBy', foreignField: '_id', as: 'reportedByArr' } },
      { $project: { title: 1, voteCount: 1, createdAt: 1, reportedBy: { $arrayElemAt: ['$reportedByArr', 0] } } },
      { $project: { title: 1, voteCount: 1, createdAt: 1, 'reportedBy.name': 1 } }
    ]);

    // Format response
    const analytics = {
      users: {
        total: totalUsers,
        pendingAuthorities,
        breakdown: userStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      },
      issues: {
        total: totalIssues,
        open: openIssues,
        inProgress: inProgressIssues,
        resolved: resolvedIssues,
        resolutionRate: totalIssues > 0 ? ((resolvedIssues / totalIssues) * 100).toFixed(1) : 0,
        breakdown: issueStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        categoryBreakdown: categoryStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        priorityBreakdown: priorityStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      },
      feedback: {
        total: feedbackStats[0]?.totalFeedback || 0,
        averageRating: feedbackStats[0]?.averageRating?.toFixed(1) || 0
      },
      trends: {
        monthly: monthlyTrends.map(trend => ({
          month: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}`,
          count: trend.count
        }))
      },
      performance: {
        averageResolutionTime: resolutionStats[0]?.averageResolutionTime || 0,
        topVotedIssues
      }
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics'
    });
  }
});

// @route   GET /api/analytics/user
// @desc    Get user-specific analytics (for citizens and authorities)
// @access  Private
router.get('/user', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let analytics = {};

    if (userRole === 'citizen') {
      // Citizen analytics
      const userIssues = await Issue.find({ reportedBy: userId });
      const totalIssues = userIssues.length;
      const resolvedIssues = userIssues.filter(issue => issue.status === 'resolved').length;
      const openIssues = userIssues.filter(issue => issue.status === 'open').length;
      const inProgressIssues = userIssues.filter(issue => issue.status === 'in-progress').length;

      // Get user's feedback
      const userFeedback = await Feedback.find({ user: userId });
      const totalFeedback = userFeedback.length;

      analytics = {
        issues: {
          total: totalIssues,
          open: openIssues,
          inProgress: inProgressIssues,
          resolved: resolvedIssues,
          resolutionRate: totalIssues > 0 ? ((resolvedIssues / totalIssues) * 100).toFixed(1) : 0
        },
        feedback: {
          total: totalFeedback
        }
      };
    } else if (userRole === 'authority') {
      // Authority analytics
      const allIssues = await Issue.find();
      const totalIssues = allIssues.length;
      const resolvedIssues = allIssues.filter(issue => issue.status === 'resolved').length;
      const openIssues = allIssues.filter(issue => issue.status === 'open').length;
      const inProgressIssues = allIssues.filter(issue => issue.status === 'in-progress').length;

      // Get issues assigned to this authority
      const assignedIssues = await Issue.find({ assignedTo: userId });
      const assignedCount = assignedIssues.length;

      // Get feedback related to issues handled by this authority
      const feedbackStats = await Feedback.aggregate([
        {
          $lookup: {
            from: 'issues',
            localField: 'issue',
            foreignField: '_id',
            as: 'issueData'
          }
        },
        {
          $unwind: '$issueData'
        },
        {
          $match: {
            'issueData.assignedTo': userId
          }
        },
        {
          $group: {
            _id: null,
            totalFeedback: { $sum: 1 },
            averageRating: { $avg: '$rating' }
          }
        }
      ]);

      analytics = {
        issues: {
          total: totalIssues,
          open: openIssues,
          inProgress: inProgressIssues,
          resolved: resolvedIssues,
          resolutionRate: totalIssues > 0 ? ((resolvedIssues / totalIssues) * 100).toFixed(1) : 0,
          assignedToMe: assignedCount
        },
        feedback: {
          total: feedbackStats[0]?.totalFeedback || 0,
          averageRating: feedbackStats[0]?.averageRating?.toFixed(1) || 0
        }
      };
    }

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user analytics'
    });
  }
});

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard statistics (for all roles)
// @access  Private
router.get('/dashboard', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let stats = {};

    if (userRole === 'citizen') {
      // Citizen dashboard stats
      const userIssues = await Issue.find({ reportedBy: userId });
      stats = {
        totalIssues: userIssues.length,
        openIssues: userIssues.filter(issue => issue.status === 'open').length,
        inProgressIssues: userIssues.filter(issue => issue.status === 'in-progress').length,
        resolvedIssues: userIssues.filter(issue => issue.status === 'resolved').length
      };
    } else if (userRole === 'authority') {
      // Authority dashboard stats
      const allIssues = await Issue.find();
      stats = {
        totalIssues: allIssues.length,
        openIssues: allIssues.filter(issue => issue.status === 'open').length,
        inProgressIssues: allIssues.filter(issue => issue.status === 'in-progress').length,
        resolvedIssues: allIssues.filter(issue => issue.status === 'resolved').length
      };
    } else if (userRole === 'admin') {
      // Admin dashboard stats
      const totalUsers = await User.countDocuments({ status: 'active' });
      const totalIssues = await Issue.countDocuments();
      const resolvedIssues = await Issue.countDocuments({ status: 'resolved' });
      const openIssues = await Issue.countDocuments({ status: 'open' });
      const inProgressIssues = await Issue.countDocuments({ status: 'in-progress' });

      stats = {
        totalUsers,
        totalIssues,
        openIssues,
        inProgressIssues,
        resolvedIssues
      };
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard analytics'
    });
  }
});

export default router;
