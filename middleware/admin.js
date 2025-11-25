import User from '../models/User.js';

// Admin authorization middleware
export const authorizeAdmin = async (req, res, next) => {
  try {
    // First check if user is authenticated
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Find the user in the database
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has admin role
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    // User is admin, proceed to next middleware/route handler
    next();
  } catch (error) {
    console.error('Admin authorization error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};