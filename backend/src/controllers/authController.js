import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { sendSMSOTP, verifySMSOTP } from '../utils/otp.js';

dotenv.config();

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dc_access_secret_key_12345';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dc_refresh_secret_key_67890';

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { id: user._id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

// @desc    Register a new user (Unverified stage) and send OTP
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      // If user exists but is unverified, allow resending OTP instead of failing
      if (!userExists.isVerified) {
        // Update details if they changed
        userExists.name = name || userExists.name;
        if (password) {
          const salt = await bcrypt.genSalt(10);
          userExists.passwordHash = await bcrypt.hash(password, salt);
        }
        userExists.role = role || userExists.role;
        await userExists.save();

        await sendSMSOTP(phone);
        return res.status(200).json({
          success: true,
          message: 'Account already created but unverified. Verification OTP sent again.',
          phone
        });
      }
      return res.status(400).json({ success: false, message: 'User with this email or phone already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create unverified user
    const user = new User({
      name,
      email,
      phone,
      passwordHash,
      role: role || 'customer',
      isVerified: false
    });

    await user.save();
    
    // Trigger OTP sending
    await sendSMSOTP(phone);

    res.status(201).json({
      success: true,
      message: 'Registration initiated. Verification OTP sent to phone.',
      phone
    });
  } catch (error) {
    console.error(`[Auth Register] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// @desc    Verify SMS OTP & Activate Account
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (resOrReq, res) => {
  // express-style request handler
  const req = resOrReq;
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }

    const isMatch = verifySMSOTP(phone, otp);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Find and verify user
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isVerified = true;
    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account successfully verified and activated',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        address: user.address
      }
    });
  } catch (error) {
    console.error(`[Auth OTP Verify] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error during OTP verification' });
  }
};

// @desc    Complete user profile after verification
// @route   POST /api/auth/complete-profile
// @access  Protected
export const completeProfile = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile completed successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        address: user.address
      }
    });
  } catch (error) {
    console.error(`[Auth Complete Profile] Error: ${error.message}`);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email is already in use by another account.' });
    }
    res.status(500).json({ success: false, message: 'Server error completing profile' });
  }
};

// @desc    Login via email/password or phone OTP
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password, phone, otp } = req.body;

    let user;

    // Login Option 1: Phone + OTP
    if (phone && otp) {
      const isMatch = verifySMSOTP(phone, otp);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      }

      user = await User.findOne({ phone });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User with this phone number not found' });
      }

      if (!user.isVerified) {
        user.isVerified = true; // Auto verify on successful OTP login
      }
    } 
    // Login Option 2: Email + Password
    else if (email && password) {
      user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid credentials' });
      }

      const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordMatch) {
        return res.status(400).json({ success: false, message: 'Invalid credentials' });
      }

      if (!user.isVerified) {
        // Resend verification OTP
        await sendSMSOTP(user.phone);
        return res.status(403).json({ 
          success: false, 
          message: 'Account is unverified. Verification OTP has been sent to your phone.' 
        });
      }
    } 
    else {
      return res.status(400).json({ 
        success: false, 
        message: 'Provide either email + password OR phone + OTP' 
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        address: user.address
      }
    });
  } catch (error) {
    console.error(`[Auth Login] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// @desc    Refresh Access Token
// @route   POST /api/auth/refresh
// @access  Public
export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token is required' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ success: false, message: 'Refresh token revoked or user not found' });
    }

    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    console.error(`[Auth Refresh] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error refreshing token' });
  }
};

// @desc    Logout and invalidate refresh token
// @route   POST /api/auth/logout
// @access  Public (or Protected)
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required to logout' });
    }

    const user = await User.findOne({ refreshToken });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error(`[Auth Logout] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error during logout' });
  }
};

// @desc    Forgot Password - Request reset link (simulated)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User with this email does not exist' });
    }

    // Generate brief reset token (15 mins)
    const resetToken = jwt.sign({ id: user._id }, JWT_ACCESS_SECRET, { expiresIn: '15m' });
    
    console.log(`\n======================================================`);
    console.log(`[Forgot Password] Simulated Reset link for ${email}:`);
    console.log(`http://localhost:5173/reset-password?token=${resetToken}`);
    console.log(`======================================================\n`);

    res.status(200).json({
      success: true,
      message: 'Password reset link simulated. Check backend logs for the URL link.'
    });
  } catch (error) {
    console.error(`[Forgot Password] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error requesting reset' });
  }
};

// @desc    Reset Password with token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.refreshToken = null; // Revoke all active sessions on password change
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful. You can now login.' });
  } catch (error) {
    console.error(`[Reset Password] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error resetting password' });
  }
};
