const jwt = require('jsonwebtoken');
const db = require('../config/neonsetup');

exports.verifyToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(403).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

exports.verifyRegistrar = (req, res, next) => {
  if (req.userRole !== 'registrar') {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
}; 