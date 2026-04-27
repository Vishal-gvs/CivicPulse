// @ts-nocheck
import { AuthRequest } from '../middleware/auth';
import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import { authenticate, authorize, validateEmailDomain } from '../middleware/auth';

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', authenticate, authorize('admin'), async (req: AuthRequest, res: any) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;
    
    // Build filter
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// @route   GET /api/users/pending-managers
// @desc    Get pending manager accounts (admin only)
// @access  Private/Admin
router.get('/pending-managers', authenticate, authorize('admin'), async (req: AuthRequest, res: any) => {
  try {
    const pendingManagers = await User.find({
      role: 'manager',
      status: 'pending'
    }).select('-password').sort({ createdAt: -1 });

    res.json({
      success: true,
      data: pendingManagers
    });
  } catch (error) {
    console.error('Get pending managers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending managers'
    });
  }
});



// @route   PUT /api/users/:id/approve
// @desc    Approve manager account (admin only)
// @access  Private/Admin
router.put('/:id/approve', authenticate, authorize('admin'), async (req: AuthRequest, res: any) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'manager') {
      return res.status(400).json({
        success: false,
        message: 'Only manager accounts can be approved'
      });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Account is not in pending status'
      });
    }

    user.status = 'active';
    await user.save();

    res.json({
      success: true,
      data: user.getPublicProfile(),
      message: `Manager account approved successfully`
    });
  } catch (error) {
    console.error('Approve manager error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving manager'
    });
  }
});

// @route   PUT /api/users/:id/reject
// @desc    Reject manager account (admin only)
// @access  Private/Admin
router.put('/:id/reject', authenticate, authorize('admin'), async (req: AuthRequest, res: any) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'manager') {
      return res.status(400).json({
        success: false,
        message: 'Only manager accounts can be rejected'
      });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Account is not in pending status'
      });
    }

    user.status = 'rejected';
    await user.save();

    res.json({
      success: true,
      data: user.getPublicProfile(),
      message: `Manager account rejected successfully`
    });
  } catch (error) {
    console.error('Reject manager error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting manager'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Users can only see their own profile unless they're admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private
router.put('/:id', [
  authenticate,
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('phone').optional().matches(/^[0-9]{10}$/).withMessage('Please enter a valid 10-digit phone number'),
  body('address').optional().trim().isLength({ max: 200 }).withMessage('Address cannot exceed 200 characters')
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

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Users can only update their own profile unless they're admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update allowed fields
    const { name, phone, address } = req.body;
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    await user.save();

    res.json({
      success: true,
      data: user.getPublicProfile(),
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private/Admin
router.delete('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: any) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user'
    });
  }
});

export default router;
