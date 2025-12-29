const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    unique: true
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  profileImage: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow null/empty
        // Basic URL validation for image URLs
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i.test(v) || /^https:\/\/res\.cloudinary\.com\/.+/i.test(v);
      },
      message: 'Profile image must be a valid image URL'
    }
  },
  cloudinaryPublicId: {
    type: String,
    default: null
  },
  prnNumber: {
    type: String,
    required: [true, 'PRN number is required'],
    unique: true,
    trim: true,
    match: [/^[A-Za-z0-9]{6,20}$/, 'PRN number must be 6-20 alphanumeric characters']
  },
  class: {
    type: String,
    required: [true, 'Class is required'],
    trim: true,
    maxlength: [50, 'Class cannot exceed 50 characters']
  },
  division: {
    type: String,
    required: [true, 'Division is required'],
    enum: {
      values: ['GIA', 'SFI'],
      message: 'Division must be either GIA or SFI'
    }
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    trim: true,
    default: ''
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
userProfileSchema.index({ user: 1 });
userProfileSchema.index({ prnNumber: 1 });

// Pre-save middleware to check if profile is complete
userProfileSchema.pre('save', function(next) {
  const requiredFields = ['fullName', 'prnNumber', 'class', 'division'];
  this.isProfileComplete = requiredFields.every(field => 
    this[field] && this[field].toString().trim() !== ''
  );
  next();
});

// Method to get public profile data
userProfileSchema.methods.getPublicProfile = function() {
  return {
    _id: this._id,
    user: this.user,
    fullName: this.fullName,
    profileImage: this.profileImage,
    prnNumber: this.prnNumber,
    class: this.class,
    division: this.division,
    bio: this.bio,
    isProfileComplete: this.isProfileComplete,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Static method to find profile by user ID
userProfileSchema.statics.findByUserId = function(userId) {
  return this.findOne({ user: userId }).populate('user', 'firstName lastName email avatar');
};

// Static method to check if PRN number exists (excluding current profile)
userProfileSchema.statics.isPRNUnique = function(prnNumber, excludeProfileId = null) {
  const query = { prnNumber };
  if (excludeProfileId) {
    query._id = { $ne: excludeProfileId };
  }
  return this.findOne(query);
};

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

module.exports = UserProfile;
