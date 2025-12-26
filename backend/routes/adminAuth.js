const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

const safeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
};

// @route   POST /api/admin/login
// @desc    Admin login with fixed credentials stored in env
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME;

    if (!adminEmail || !adminPassword) {
      return res.status(500).json({
        success: false,
        message: 'Admin credentials are not configured on the server',
      });
    }

    const ok = safeEqual(String(email).toLowerCase().trim(), String(adminEmail).toLowerCase().trim()) && safeEqual(String(password), String(adminPassword));

    if (!ok) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = jwt.sign(
      {
        type: 'admin',
        role: 'admin',
        name: adminName ? String(adminName).trim() : null,
        email: String(adminEmail).toLowerCase().trim(),
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '12h' }
    );

    return res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        token,
        admin: {
          email: String(adminEmail).toLowerCase().trim(),
          role: 'admin',
          name: adminName ? String(adminName).trim() : null,
        },
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during admin login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @route   GET /api/admin/me
// @desc    Validate admin token
// @access  Private (Admin)
router.get('/me', requireAdmin, async (req, res) => {
  return res.json({
    success: true,
    data: {
      admin: req.admin,
    },
  });
});

module.exports = router;
