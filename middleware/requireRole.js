module.exports = function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.session || !req.session.user) return res.redirect('/student-login');
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).send('Forbidden: insufficient permissions');
    }
    next();
  };
};
