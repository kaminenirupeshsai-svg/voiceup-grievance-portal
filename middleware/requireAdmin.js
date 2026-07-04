module.exports = function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect('/index.html');
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).send('Forbidden: Admins only');
  }
  next();
};

