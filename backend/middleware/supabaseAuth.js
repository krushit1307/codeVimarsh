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
    let user = await User.findOne({ supabaseId: data.user.id });

    if (!user) {
      // Create user if doesn't exist
      const userData = {
        authProvider: 'supabase',
        supabaseId: data.user.id,
        email: data.user.email,
        firstName: data.user.user_metadata?.firstName || data.user.user_metadata?.first_name || '',
        lastName: data.user.user_metadata?.lastName || data.user.user_metadata?.last_name || '',
        emailVerified: !!data.user.email_confirmed_at,
        isTempUser: false,
        isActive: true
      };

      user = new User(userData);
      await user.save();
    }

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
