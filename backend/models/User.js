const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  authProvider: {
    type: String,
    enum: ['local', 'supabase'],
    default: 'local'
  },
  supabaseId: {
    type: String,
    default: null,
    index: true,
    unique: true,
    sparse: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      return this.authProvider !== 'supabase';
    },
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  otpCode: {
    type: String,
    default: null
  },
  otpExpires: {
    type: Date,
    default: null
  },
  isTempUser: {
    type: Boolean,
    default: false
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  preferences: {
    subscribeNewsletter: {
      type: Boolean,
      default: false
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      return ret;
    }
  }
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified
  if (!this.password) return next();
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  const payload = {
    userId: this._id,
    email: this.email,
    role: this.role
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Method to get public user data
userSchema.methods.getPublicProfile = function() {
  return {
    _id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    avatar: this.avatar,
    role: this.role,
    isActive: this.isActive,
    emailVerified: this.emailVerified,
    lastLogin: this.lastLogin,
    preferences: this.preferences,
    createdAt: this.createdAt
  };
};

// Static method to find user by email with password
userSchema.statics.findByEmailWithPassword = function(email) {
  return this.findOne({ email }).select('+password');
};

// Static method to create user with validation
userSchema.statics.createUser = async function(userData) {
  const { firstName, lastName, email, password, subscribeNewsletter = false } = userData;
  
  // Check if user already exists
  const existingUser = await this.findOne({ email });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }
  
  // Generate OTP code
  const crypto = require('crypto');
  const otpCode = crypto.randomInt(100000, 999999).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  // Create new user as temporary user
  const user = new this({
    firstName,
    lastName,
    email,
    password,
    emailVerified: false,
    isTempUser: true,
    otpCode,
    otpExpires,
    preferences: {
      subscribeNewsletter
    }
  });
  
  return await user.save();
};

// Method to verify OTP
userSchema.methods.verifyOTP = function(otp) {
  if (this.otpCode !== otp) {
    throw new Error('Invalid OTP code');
  }
  
  if (Date.now() > this.otpExpires) {
    throw new Error('OTP code has expired');
  }
  
  this.emailVerified = true;
  this.isTempUser = false;
  this.otpCode = null;
  this.otpExpires = null;
  return this.save();
};

// Method to regenerate OTP
userSchema.methods.regenerateOTP = function() {
  const crypto = require('crypto');
  this.otpCode = crypto.randomInt(100000, 999999).toString();
  this.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
