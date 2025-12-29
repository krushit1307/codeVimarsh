const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials not found in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const supabaseAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify the Supabase token
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    // Get or create user in our database
    const User = require('../models/User');
    const supaUser = data.user;

    const email = String(supaUser.email || '').toLowerCase().trim();
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Supabase user has no email'
      });
    }

    const meta = supaUser.user_metadata || {};
    const rawFirstName = String(meta.firstName || meta.first_name || meta.given_name || '').trim();
    const rawLastName = String(meta.lastName || meta.last_name || meta.family_name || '').trim();

    const emailLocalPart = email.split('@')[0] || 'User';
    const safeFirstName = rawFirstName || emailLocalPart || 'User';
    const safeLastName = rawLastName || 'User';

    let user = await User.findOne({ supabaseId: supaUser.id });
    if (!user) {
      // If user existed from older auth flow, link supabaseId by email
      user = await User.findOne({ email });
    }

    if (!user) {
      user = new User({
        authProvider: 'supabase',
        supabaseId: supaUser.id,
        email,
        firstName: safeFirstName,
        lastName: safeLastName,
        emailVerified: !!supaUser.email_confirmed_at,
        isTempUser: false,
        isActive: true
      });
    } else {
      user.authProvider = 'supabase';
      user.supabaseId = supaUser.id;
      user.email = email;
      if (!String(user.firstName || '').trim()) user.firstName = safeFirstName;
      if (!String(user.lastName || '').trim()) user.lastName = safeLastName;
      user.emailVerified = !!supaUser.email_confirmed_at;
      user.isTempUser = false;
      user.isActive = true;
    }

    await user.save();
    req.user = user;
    next();
  } catch (error) {
    console.error('Supabase auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication.'
    });
  }
};

module.exports = supabaseAuthMiddleware;
