const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const emailService = require('../services/emailService');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, subscribeNewsletter } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
        errors: {
          firstName: !firstName ? 'First name is required' : null,
          lastName: !lastName ? 'Last name is required' : null,
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null
        }
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        errors: { email: 'Please enter a valid email address' }
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password too weak',
        errors: { password: 'Password must be at least 8 characters long' }
      });
    }

    // Create user
    const user = await User.createUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password,
      subscribeNewsletter
    });

    // Send OTP email
    await emailService.sendOTPEmail(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for OTP verification.',
      data: {
        user: user.getPublicProfile(),
        requiresOTPVerification: true,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message === 'User with this email already exists') {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
        errors: { email: 'An account with this email already exists' }
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
        errors: {
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null
        }
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        errors: { email: 'Please enter a valid email address' }
      });
    }

    // Find user with password
    const user = await User.findByEmailWithPassword(email.toLowerCase().trim());
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        errors: { email: 'No account found with this email' }
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account deactivated',
        errors: { email: 'Your account has been deactivated' }
      });
    }

    // Check if user is temporary (needs OTP verification)
    if (user.isTempUser) {
      return res.status(401).json({
        success: false,
        message: 'Account not verified',
        errors: { 
          email: 'Please verify your account with OTP before signing in.',
          requiresOTPVerification: true,
          email: user.email
        }
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Email not verified',
        errors: { 
          email: 'Please verify your email before signing in.',
          requiresEmailVerification: true
        }
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        errors: { password: 'Incorrect password' }
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = user.generateAuthToken();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.getPublicProfile(),
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', async (req, res) => {
  try {
    // This would require middleware to verify JWT and set req.user
    // For now, we'll implement a basic version
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          user: user.getPublicProfile()
        }
      });

    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', async (req, res) => {
  // In a real implementation, you might want to blacklist the token
  // For now, we'll just return success
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// @route   POST /api/auth/verify-otp
// @desc    Verify user OTP
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isTempUser) {
      return res.status(400).json({
        success: false,
        message: 'Account already verified'
      });
    }

    await user.verifyOTP(otp);
    
    // Send welcome email
    await emailService.sendWelcomeEmail(user);

    // Generate token for automatic login
    const token = user.generateAuthToken();

    res.json({
      success: true,
      message: 'OTP verified successfully. Account created!',
      data: {
        user: user.getPublicProfile(),
        token
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    
    if (error.message === 'Invalid OTP code') {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code'
      });
    }

    if (error.message === 'OTP code has expired') {
      return res.status(400).json({
        success: false,
        message: 'OTP code has expired'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during OTP verification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP code
// @access  Public
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isTempUser) {
      return res.status(400).json({
        success: false,
        message: 'Account already verified'
      });
    }

    // Regenerate OTP
    await user.regenerateOTP();
    
    // Send new OTP email
    await emailService.sendOTPEmail(user);

    res.json({
      success: true,
      message: 'New OTP sent. Please check your email.'
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    // Always return success to prevent email enumeration attacks
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // TODO: Send email with reset token
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/supabase-sync', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: 'Supabase is not configured on the server'
      });
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const supaUser = data.user;
    const firstName = req.body?.firstName || supaUser.user_metadata?.firstName || supaUser.user_metadata?.first_name || '';
    const lastName = req.body?.lastName || supaUser.user_metadata?.lastName || supaUser.user_metadata?.last_name || '';

    const update = {
      authProvider: 'supabase',
      supabaseId: supaUser.id,
      email: (supaUser.email || '').toLowerCase().trim(),
      firstName,
      lastName,
      emailVerified: !!supaUser.email_confirmed_at,
      isTempUser: false,
      isActive: true
    };

    if (!update.email) {
      return res.status(400).json({
        success: false,
        message: 'Supabase user has no email'
      });
    }

    let user = await User.findOne({ supabaseId: supaUser.id });

    if (!user) {
      user = await User.findOne({ email: update.email });
    }

    if (!user) {
      user = new User(update);
      await user.save();
    } else {
      Object.assign(user, update);
      await user.save();
    }

    return res.json({
      success: true,
      message: 'User synced successfully',
      data: { user: user.getPublicProfile() }
    });
  } catch (error) {
    console.error('Supabase sync error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during user sync',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
