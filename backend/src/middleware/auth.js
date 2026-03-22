const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -refreshToken');

    if (!user) return res.status(401).json({ error: 'User not found.' });
    if (!user.isActive) return res.status(401).json({ error: 'Account has been deactivated.' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

/** Only full admins (manage staff, all settings). */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ error: 'Admin access required.' });
};

/** Keys allowed in User.adminPermissions (staff). Keep in sync with admin UI. */
const ADMIN_PERMISSION_KEYS = Object.freeze([
  'dashboard',
  'products',
  'categories',
  'sales',
  'featured',
  'newArrivals',
  'stock',
  'orders',
  'users',
  'promos',
  'analytics',
  'settings',
  'activity',
]);

/** Full admin OR staff with at least one of the given permission keys. */
const requireAdminOrPermissionAny =
  (...permissions) =>
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authorized.' });
    if (req.user.role === 'admin') return next();
    if (req.user.role === 'staff' && Array.isArray(req.user.adminPermissions)) {
      const set = req.user.adminPermissions;
      if (permissions.some((p) => set.includes(p))) return next();
    }
    return res.status(403).json({ error: 'Access denied.' });
  };

/** Full admin OR staff with a specific permission key. */
const requireAdminOrPermission = (permission) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authorized.' });
  if (req.user.role === 'admin') return next();
  if (req.user.role === 'staff' && Array.isArray(req.user.adminPermissions) && req.user.adminPermissions.includes(permission)) {
    return next();
  }
  return res.status(403).json({ error: 'Access denied.' });
};

const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch {}
  }
  next();
};

module.exports = {
  protect,
  adminOnly,
  optionalAuth,
  requireAdminOrPermission,
  requireAdminOrPermissionAny,
  ADMIN_PERMISSION_KEYS,
};
