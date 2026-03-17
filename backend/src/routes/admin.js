const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// Re-export dashboard stats from analytics
const analyticsRouter = require('./analytics');
router.use('/analytics', analyticsRouter);

router.get('/health', (req, res) => {
  res.json({ status: 'Admin API OK', user: req.user.email });
});

module.exports = router;
