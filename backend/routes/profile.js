const express = require('express');
const router = express.Router();
const UserProfile = require('../models/UserProfile');
const supabaseAuthMiddleware = require('../middleware/supabaseAuth');
const cloudinary = require('cloudinary').v2;
const { 
  ValidationError, 
  ConflictError, 
  DatabaseError, 
  ExternalServiceError,
  validateProfileData 
} = require('../utils/validation');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// @route   GET /api/profile
// @desc    Get current user's profile
// @access  Private
router.get('/', supabaseAuthMiddleware, async (req, res) => {
  try {
    let profile = await UserProfile.findByUserId(req.user._id);
    
    if (!profile) {
      return res.json({
        success: true,
        data: { profile: null }
      });
    }

    res.json({
      success: true,
      data: { profile: profile.getPublicProfile() }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/profile
// @desc    Create or update user profile
// @access  Private
router.post('/', supabaseAuthMiddleware, async (req, res) => {
  try {
    const { fullName, profileImage, prnNumber, class: className, division, bio } = req.body;

    // Validate input data
    const validatedData = validateProfileData({
      fullName,
      profileImage,
      prnNumber,
      class: className,
      division,
      bio
    });

    // Check if PRN number is unique
    const existingProfile = await UserProfile.findOne({ prnNumber: validatedData.prnNumber });
    if (existingProfile && existingProfile.user.toString() !== req.user._id.toString()) {
      throw new ConflictError('PRN number already exists', { 
        prnNumber: 'This PRN number is already registered' 
      });
    }

    // Find existing profile or create new one
    let profile = await UserProfile.findOne({ user: req.user._id });
    
    if (profile) {
      const previousProfileImage = profile.profileImage;
      const previousCloudinaryPublicId = profile.cloudinaryPublicId;
      // Update existing profile
      Object.assign(profile, validatedData);
      
      // Handle profile image changes
      if (validatedData.profileImage && validatedData.profileImage !== previousProfileImage) {
        // If old image was from Cloudinary, delete it
        if (previousCloudinaryPublicId) {
          try {
            await cloudinary.uploader.destroy(previousCloudinaryPublicId);
          } catch (error) {
            console.error('Error deleting old Cloudinary image:', error);
          }
        }
        
        // Check if new image is a Cloudinary URL
        const cloudinaryMatch = validatedData.profileImage.match(/\/v\d+\/(.+?)\./);
        profile.cloudinaryPublicId = cloudinaryMatch ? cloudinaryMatch[1] : null;
        profile.profileImage = validatedData.profileImage;
      }
    } else {
      // Create new profile
      profile = new UserProfile({
        user: req.user._id,
        ...validatedData
      });

      // Handle Cloudinary public ID for new profile
      if (validatedData.profileImage) {
        const cloudinaryMatch = validatedData.profileImage.match(/\/v\d+\/(.+?)\./);
        profile.cloudinaryPublicId = cloudinaryMatch ? cloudinaryMatch[1] : null;
      }
    }

    await profile.save();

    res.json({
      success: true,
      message: profile.isProfileComplete ? 'Profile completed successfully!' : 'Profile updated successfully',
      data: { profile: profile.getPublicProfile() }
    });
  } catch (error) {
    console.error('Create/Update profile error:', error);
    
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors
      });
    }
    
    if (error instanceof ConflictError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors
      });
    }
    
    if (error instanceof DatabaseError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while saving profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/profile/upload-image
// @desc    Upload profile image to Cloudinary
// @access  Private
router.post('/upload-image', supabaseAuthMiddleware, async (req, res) => {
  try {
    if (!req.body.image) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided'
      });
    }

    // Extract base64 data
    const matches = req.body.image.match(/^data:image\/(png|jpg|jpeg|gif|webp);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format'
      });
    }

    const imageType = matches[1];
    const imageData = matches[2];

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:image/${imageType};base64,${imageData}`,
      {
        folder: 'codevimarsh/profiles',
        public_id: `user_${req.user._id}_${Date.now()}`,
        overwrite: true,
        resource_type: 'image',
        transformation: [
          { width: 300, height: 300, crop: 'fill', gravity: 'face' },
          { quality: 'auto' }
        ]
      }
    );

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: result.secure_url,
        publicId: result.public_id
      }
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/profile/image
// @desc    Delete profile image
// @access  Private
router.delete('/image', supabaseAuthMiddleware, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user: req.user._id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Delete from Cloudinary if it exists
    if (profile.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(profile.cloudinaryPublicId);
      } catch (error) {
        console.error('Error deleting Cloudinary image:', error);
      }
    }

    // Remove image references
    profile.profileImage = null;
    profile.cloudinaryPublicId = null;
    await profile.save();

    res.json({
      success: true,
      message: 'Profile image removed successfully',
      data: { profile: profile.getPublicProfile() }
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting profile image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
