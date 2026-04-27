// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
  upload?: any; // for multer
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active.'
      });
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

export const validateEmailDomain = (req: Request, res: Response, next: NextFunction) => {
  const { email, role } = req.body;
  
  if (!email || !role) {
    return next();
  }

  const emailLower = email.toLowerCase();
  
  switch (role) {
    case 'citizen':
      if (!emailLower.endsWith('@gmail.com')) {
        return res.status(400).json({
          success: false,
          message: 'Citizen accounts must use @gmail.com email address. Please use your Gmail account.'
        });
      }
      break;
      
    case 'admin':
      if (!emailLower.endsWith('@admin.com')) {
        return res.status(400).json({
          success: false,
          message: 'Admin accounts must use @admin.com email domain. Please use your official admin email.'
        });
      }
      break;
      
    case 'manager':
      if (!emailLower.endsWith('@manager.com') && !emailLower.endsWith('@gov.in')) {
        return res.status(400).json({
          success: false,
          message: 'Manager accounts must use @manager.com or @gov.in email domain.'
        });
      }
      break;
  }
  
  next();
};
