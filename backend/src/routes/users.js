const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const { uploadAvatar, uploadToImageKit } = require('../config/imagekit');

router.use(protect);

router.get('/profile', async (req, res) => {
  const user = await User.findById(req.user.id).populate('wishlist', 'name images price slug');
  res.json({ user });
});

router.put('/profile', async (req, res) => {
  try {
    const allowed = ['firstName', 'lastName', 'email'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    res.json({ user });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/avatar', uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const result = await uploadToImageKit(req.file.buffer, req.file.originalname, '/yf14-store/avatars');
    const user = await User.findByIdAndUpdate(req.user.id, { avatar: result.url }, { new: true });
    res.json({ avatar: user.avatar });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    if (!(await user.comparePassword(currentPassword))) return res.status(400).json({ error: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Addresses
router.get('/addresses', async (req, res) => {
  const user = await User.findById(req.user.id).select('addresses');
  res.json({ addresses: user.addresses });
});

router.post('/addresses', async (req, res) => {
  const user = await User.findById(req.user.id);
  if (req.body.isDefault) user.addresses.forEach(a => a.isDefault = false);
  user.addresses.push(req.body);
  await user.save();
  res.json({ addresses: user.addresses });
});

router.put('/addresses/:addressId', async (req, res) => {
  const user = await User.findById(req.user.id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) return res.status(404).json({ error: 'Address not found' });
  if (req.body.isDefault) user.addresses.forEach(a => a.isDefault = false);
  Object.assign(address, req.body);
  await user.save();
  res.json({ addresses: user.addresses });
});

router.delete('/addresses/:addressId', async (req, res) => {
  const user = await User.findById(req.user.id);
  user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.addressId);
  await user.save();
  res.json({ addresses: user.addresses });
});

// Admin: manage users
router.get('/', adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { role: 'user' };
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }];
    }
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort('-createdAt').skip((page - 1) * limit).limit(+limit).lean();

    const Order = require('../models/Order');
    const userIds = users.map(u => u._id);
    const orderCounts = await Order.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: '$user', count: { $sum: 1 }, totalSpent: { $sum: '$total' } } },
    ]);
    const countMap = {};
    orderCounts.forEach(o => { countMap[o._id.toString()] = { count: o.count, totalSpent: o.totalSpent }; });

    const enriched = users.map(u => ({
      ...u,
      ordersCount: countMap[u._id.toString()]?.count || 0,
      totalSpent: countMap[u._id.toString()]?.totalSpent || 0,
    }));

    res.json({ users: enriched, total, pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/status', adminOnly, async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true });
  res.json({ user });
});

module.exports = router;
