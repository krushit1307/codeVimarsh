class ValidationError extends Error {
  constructor(message, errors = {}) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
    this.statusCode = 400;
  }
}

class AuthenticationError extends Error {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

class AuthorizationError extends Error {
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
  }
}

class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class ConflictError extends Error {
  constructor(message = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
  }
}

class DatabaseError extends Error {
  constructor(message = 'Database operation failed') {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
  }
}

class ExternalServiceError extends Error {
  constructor(message = 'External service error') {
    super(message);
    this.name = 'ExternalServiceError';
    this.statusCode = 502;
  }
}

// Validation helpers
const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw new ValidationError(`${fieldName} is required`, { [fieldName]: `${fieldName} is required` });
  }
  return value;
};

const validateEmail = (email) => {
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', { email: 'Please enter a valid email address' });
  }
  return email;
};

const validatePRN = (prn) => {
  if (!/^[A-Za-z0-9]{6,20}$/.test(prn)) {
    throw new ValidationError('Invalid PRN number', { 
      prnNumber: 'PRN number must be 6-20 alphanumeric characters' 
    });
  }
  return prn;
};

const validateDivision = (division) => {
  const validDivisions = ['GIA', 'SFI'];
  if (!validDivisions.includes(division)) {
    throw new ValidationError('Invalid division', { 
      division: 'Division must be either GIA or SFI' 
    });
  }
  return division;
};

const validateBio = (bio) => {
  if (bio && bio.length > 500) {
    throw new ValidationError('Bio too long', { 
      bio: 'Bio cannot exceed 500 characters' 
    });
  }
  return bio;
};

const validateImageURL = (url) => {
  if (!url) return url; // Allow null/empty
  
  const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i;
  const cloudinaryPattern = /^https:\/\/res\.cloudinary\.com\/.+/i;
  
  if (!urlPattern.test(url) && !cloudinaryPattern.test(url)) {
    throw new ValidationError('Invalid image URL', { 
      profileImage: 'Profile image must be a valid image URL' 
    });
  }
  return url;
};

const validateFullName = (name) => {
  if (!name || name.trim().length < 2) {
    throw new ValidationError('Invalid full name', { 
      fullName: 'Full name must be at least 2 characters long' 
    });
  }
  if (name.length > 100) {
    throw new ValidationError('Full name too long', { 
      fullName: 'Full name cannot exceed 100 characters' 
    });
  }
  return name.trim();
};

const validateClass = (className) => {
  if (!className || className.trim().length < 1) {
    throw new ValidationError('Invalid class', { 
      class: 'Class is required' 
    });
  }
  if (className.length > 50) {
    throw new ValidationError('Class name too long', { 
      class: 'Class cannot exceed 50 characters' 
    });
  }
  return className.trim();
};

// Profile validation function
const validateProfileData = (data) => {
  const errors = {};
  
  try {
    if (data.fullName) validateFullName(data.fullName);
    if (data.prnNumber) validatePRN(data.prnNumber);
    if (data.division) validateDivision(data.division);
    if (data.bio) validateBio(data.bio);
    if (data.profileImage) validateImageURL(data.profileImage);
    if (data.class) validateClass(data.class);
  } catch (error) {
    if (error instanceof ValidationError) {
      Object.assign(errors, error.errors);
    } else {
      throw error;
    }
  }
  
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors);
  }
  
  return data;
};

module.exports = {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
  validateRequired,
  validateEmail,
  validatePRN,
  validateDivision,
  validateBio,
  validateImageURL,
  validateFullName,
  validateClass,
  validateProfileData
};
