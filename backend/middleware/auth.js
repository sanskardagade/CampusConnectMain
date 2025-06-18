const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    console.log('Auth header:', authHeader);
    console.log('Token:', token);

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('Token verification error:', err);
        return res.status(403).json({ message: 'Invalid token' });
      }

      console.log('Token decoded:', decoded);
      
      // Set basic user info
      req.user = {
        id: decoded.id,
        role: decoded.role
      };

      // Add role-specific fields
      if (decoded.role === 'hod') {
        if (!decoded.erpStaffId || !decoded.departmentId) {
          console.error('HOD token missing required data:', decoded);
          return res.status(403).json({ message: 'Invalid HOD token data' });
        }
        req.user.erpStaffId = decoded.erpStaffId;
        req.user.departmentId = decoded.departmentId;
      } else if (decoded.role === 'principal') {
        // Principal only needs id and role
        if (!decoded.id) {
          console.error('Principal token missing required data:', decoded);
          return res.status(403).json({ message: 'Invalid Principal token data' });
        }
      } else if (decoded.role === 'faculty') {
        if (!decoded.erpStaffId) {
          console.error('Faculty token missing required data:', decoded);
          return res.status(403).json({ message: 'Invalid Faculty token data' });
        }
        req.user.erpStaffId = decoded.erpStaffId;
      }
      
      console.log('User data set in request:', req.user);
      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};

module.exports = authenticateToken; 