exports.verifyPrincipal = (req, res, next) => {
  if (req.user.role !== 'principal') {
    return res.status(403).json({ error: 'Access denied. Principal role required' });
  }
  next();
};