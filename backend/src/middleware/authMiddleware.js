import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dc_access_secret_key_12345';

/**
 * Middleware to protect routes and verify JWT access token
 */
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
  }

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    
    // Fetch full user record (excluding password hash) to attach to request
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found for this token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(`[Auth Middleware] JWT Verify Error: ${error.message}`);
    return res.status(401).json({ success: false, message: 'Not authorized, invalid or expired token' });
  }
};

/**
 * Middleware to authorize specific roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user payload missing' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: role '${req.user.role}' is not authorized to access this resource` 
      });
    }
    next();
  };
};
