const jwt = require('jsonwebtoken');

const requireAdmin = (req, res, next) => {
  try {
    const header = req.header('Authorization') || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    const token = match ? match[1] : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    if (!decoded || decoded.role !== 'admin' || decoded.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
      });
    }

    req.admin = { email: decoded.email, role: decoded.role, name: decoded.name || null };
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = requireAdmin;
