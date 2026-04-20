// @ts-nocheck
import { AuthRequest } from '../middleware/auth';
import express from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import Issue from '../models/Issue';
import { authenticate, authorize, validateEmailDomain } from '../middleware/auth';

const router = express.Router();

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // ✅ Fixed path - relative to backend directory
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  }
});

// @route   GET /api/issues
// @desc    Get all issues with filtering and pagination
// @access  Private
router.get('/', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      category, 
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter based on user role
    let filter = {};
    
    if (req.user.role === 'citizen') {
      // Citizens can only see their own issues
      filter.reportedBy = req.user._id;
    } else if (req.user.role === 'authority' || req.user.role === 'admin' || req.user.role === 'manager') {
      // Authorities, managers (if active) and admins can see all issues
      // No filter needed
    }

    // Apply additional filters
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;
    
    const issues = await Issue.find(filter)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Issue.countDocuments(filter);

    res.json({
      success: true,
      data: {
        issues,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching issues'
    });
  }
});

// @route   GET /api/issues/:id
// @desc    Get single issue by ID
// @access  Private
router.get('/:id', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name')
      .populate('votes.user', 'name');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'citizen' && issue.reportedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: issue
    });
  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching issue'
    });
  }
});

// @route   POST /api/issues
// @desc    Create a new issue
// @access  Private/Citizen
router.post('/', [
  authenticate,
  authorize('citizen'),
  upload.array('image', 5),
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description').trim().isLength({ min: 20, max: 1000 }).withMessage('Description must be between 20 and 1000 characters'),
  body('category').isIn(['infrastructure', 'sanitation', 'water', 'electricity', 'roads', 'public-safety', 'environment', 'other']).withMessage('Invalid category'),
  body('location').trim().isLength({ min: 3, max: 200 }).withMessage('Location must be between 3 and 200 characters'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority')
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

    const { title, description, category, location, priority, tags } = req.body;

    // Handle file uploads
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => `/uploads/${file.filename}`);
    }

    const issue = await Issue.create({
      title,
      description,
      category,
      location,
      priority: priority || 'medium',
      reportedBy: req.user._id,
      images,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
    });

    const populatedIssue = await Issue.findById(issue._id)
      .populate('reportedBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedIssue,
      message: 'Issue reported successfully'
    });
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating issue'
    });
  }
});

// @route   PUT /api/issues/:id
// @desc    Update issue
// @access  Private/Authority/Admin
router.put('/:id', [
  authenticate,
  authorize('authority', 'admin'),
  body('status').optional().isIn(['open', 'in-progress', 'resolved']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assigned user ID')
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

    const issue = await Issue.findById(req.params.id);
    
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    const { status, priority, assignedTo, estimatedResolution } = req.body;

    // Update issue
    if (status) issue.status = status;
    if (priority) issue.priority = priority;
    if (assignedTo) issue.assignedTo = assignedTo;
    if (estimatedResolution) issue.estimatedResolution = new Date(estimatedResolution);

    // Set actual resolution date when resolved
    if (status === 'resolved') {
      issue.actualResolution = new Date();
    }

    await issue.save();

    const updatedIssue = await Issue.findById(issue._id)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email');

    res.json({
      success: true,
      data: updatedIssue,
      message: 'Issue updated successfully'
    });
  } catch (error) {
    console.error('Update issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating issue'
    });
  }
});

// @route   POST /api/issues/:id/vote
// @desc    Vote for an issue
// @access  Private
router.post('/:id/vote', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const issue = await Issue.findById(req.params.id);
    
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Check if user has already voted
    if (issue.hasUserVoted(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted on this issue'
      });
    }

    // Add vote
    await issue.addVote(req.user._id);

    const updatedIssue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'name email');

    res.json({
      success: true,
      data: updatedIssue,
      message: 'Vote added successfully'
    });
  } catch (error) {
    console.error('Vote issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while voting on issue'
    });
  }
});

// @route   DELETE /api/issues/:id/vote
// @desc    Remove vote from an issue
// @access  Private
router.delete('/:id/vote', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const issue = await Issue.findById(req.params.id);
    
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Check if user has voted
    if (!issue.hasUserVoted(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You have not voted on this issue'
      });
    }

    // Remove vote
    await issue.removeVote(req.user._id);

    const updatedIssue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'name email');

    res.json({
      success: true,
      data: updatedIssue,
      message: 'Vote removed successfully'
    });
  } catch (error) {
    console.error('Remove vote error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing vote'
    });
  }
});

// @route   POST /api/issues/:id/comments
// @desc    Add comment to issue
// @access  Private
router.post('/:id/comments', [
  authenticate,
  body('text').trim().isLength({ min: 1, max: 500 }).withMessage('Comment must be between 1 and 500 characters')
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

    const issue = await Issue.findById(req.params.id);
    
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    const { text } = req.body;

    // Add comment
    await issue.addComment(req.user._id, text);

    const updatedIssue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'name email')
      .populate('comments.user', 'name');

    res.json({
      success: true,
      data: updatedIssue,
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding comment'
    });
  }
});

// @route   DELETE /api/issues/:id
// @desc    Delete issue
// @access  Private/Admin
router.delete('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: any) => {
  try {
    const issue = await Issue.findById(req.params.id);
    
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    await Issue.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Issue deleted successfully'
    });
  } catch (error) {
    console.error('Delete issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting issue'
    });
  }
});

// @route   GET /api/issues/resolve-requests/pending
// @desc    Get all pending resolve requests across all issues (admin only)
// @access  Private/Admin
router.get('/resolve-requests/pending', authenticate, authorize('admin'), async (req: AuthRequest, res: any) => {
  try {
    const issues = await Issue.find({ 'resolveRequests.status': 'pending' })
      .populate('reportedBy', 'name email')
      .populate('resolveRequests.manager', 'name email')
      .select('title category location status resolveRequests createdAt');

    // Flatten the pending requests with issue context
    const pendingRequests = [];
    for (const issue of issues) {
      const pending = issue.resolveRequests.filter((r: any) => r.status === 'pending');
      for (const req of pending) {
        pendingRequests.push({
          requestId: req._id,
          issue: {
            _id: issue._id,
            title: issue.title,
            category: issue.category,
            location: issue.location,
            status: issue.status,
          },
          manager: req.manager,
          note: req.note,
          requestedAt: req.requestedAt,
        });
      }
    }

    res.json({ success: true, data: pendingRequests });
  } catch (error) {
    console.error('Get pending resolve requests error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching pending resolve requests' });
  }
});

// @route   POST /api/issues/:id/resolve-request
// @desc    Manager raises a resolve request for an issue
// @access  Private/Manager
router.post('/:id/resolve-request', authenticate, authorize('manager'), async (req: AuthRequest, res: any) => {
  try {
    // Manager must be active
    if (req.user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your account is pending admin approval.' });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

    if (issue.status === 'resolved') {
      return res.status(400).json({ success: false, message: 'This issue is already resolved.' });
    }

    // Check if this manager already has a pending/approved request
    const existing = issue.resolveRequests.find(
      (r: any) => r.manager.toString() === req.user._id.toString() && r.status === 'pending'
    );
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have a pending resolve request for this issue.' });
    }

    const { note } = req.body;
    issue.resolveRequests.push({
      manager: req.user._id,
      status: 'pending',
      note: note || '',
      requestedAt: new Date(),
    } as any);

    await issue.save();

    const updated = await Issue.findById(issue._id)
      .populate('reportedBy', 'name email')
      .populate('resolveRequests.manager', 'name email');

    res.status(201).json({ success: true, data: updated, message: 'Resolve request raised successfully.' });
  } catch (error) {
    console.error('Raise resolve request error:', error);
    res.status(500).json({ success: false, message: 'Server error raising resolve request' });
  }
});

// @route   PUT /api/issues/:id/resolve-request/:reqId/approve
// @desc    Admin approves a resolve request
// @access  Private/Admin
router.put('/:id/resolve-request/:reqId/approve', authenticate, authorize('admin'), async (req: AuthRequest, res: any) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

    const resolveReq = issue.resolveRequests.find((r: any) => r._id.toString() === req.params.reqId);
    if (!resolveReq) return res.status(404).json({ success: false, message: 'Resolve request not found' });

    resolveReq.status = 'approved';
    resolveReq.handledAt = new Date();
    await issue.save();

    const updated = await Issue.findById(issue._id)
      .populate('reportedBy', 'name email')
      .populate('resolveRequests.manager', 'name email');

    res.json({ success: true, data: updated, message: 'Resolve request approved.' });
  } catch (error) {
    console.error('Approve resolve request error:', error);
    res.status(500).json({ success: false, message: 'Server error approving resolve request' });
  }
});

// @route   PUT /api/issues/:id/resolve-request/:reqId/reject
// @desc    Admin rejects a resolve request
// @access  Private/Admin
router.put('/:id/resolve-request/:reqId/reject', authenticate, authorize('admin'), async (req: AuthRequest, res: any) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

    const resolveReq = issue.resolveRequests.find((r: any) => r._id.toString() === req.params.reqId);
    if (!resolveReq) return res.status(404).json({ success: false, message: 'Resolve request not found' });

    resolveReq.status = 'rejected';
    resolveReq.handledAt = new Date();
    await issue.save();

    const updated = await Issue.findById(issue._id)
      .populate('reportedBy', 'name email')
      .populate('resolveRequests.manager', 'name email');

    res.json({ success: true, data: updated, message: 'Resolve request rejected.' });
  } catch (error) {
    console.error('Reject resolve request error:', error);
    res.status(500).json({ success: false, message: 'Server error rejecting resolve request' });
  }
});

// @route   PUT /api/issues/:id/manager-resolve
// @desc    Manager marks an issue as resolved (only if their resolve request is approved)
// @access  Private/Manager
router.put('/:id/manager-resolve', authenticate, authorize('manager'), async (req: AuthRequest, res: any) => {
  try {
    if (req.user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your account is pending admin approval.' });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

    // Find an approved resolve request for this manager
    const approvedReq = issue.resolveRequests.find(
      (r: any) => r.manager.toString() === req.user._id.toString() && r.status === 'approved'
    );

    if (!approvedReq) {
      return res.status(403).json({
        success: false,
        message: 'You do not have admin approval to resolve this issue.'
      });
    }

    issue.status = 'resolved';
    issue.actualResolution = new Date();
    issue.assignedTo = req.user._id;
    await issue.save();

    const updated = await Issue.findById(issue._id)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('resolveRequests.manager', 'name email');

    res.json({ success: true, data: updated, message: 'Issue marked as resolved successfully.' });
  } catch (error) {
    console.error('Manager resolve issue error:', error);
    res.status(500).json({ success: false, message: 'Server error resolving issue' });
  }
});

export default router;
