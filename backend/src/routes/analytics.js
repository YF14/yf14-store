const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

router.use(protect, adminOnly);

router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalRevenue, monthRevenue, lastMonthRevenue,
      totalOrders, monthOrders,
      totalUsers, monthUsers,
      recentOrders, bestSellers, lowStock
    ] = await Promise.all([
      Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', createdAt: { $gte: startOfMonth } }),
      Order.find().sort('-createdAt').limit(10).populate('user', 'firstName lastName email'),
      Product.find().sort('-totalSold').limit(5).select('name images price totalSold averageRating'),
      Product.find({ 'variants.stock': { $lte: 5 } }).select('name variants').limit(20),
    ]);

    res.json({
      revenue: {
        total: totalRevenue[0]?.total || 0,
        thisMonth: monthRevenue[0]?.total || 0,
        lastMonth: lastMonthRevenue[0]?.total || 0,
      },
      orders: { total: totalOrders, thisMonth: monthOrders },
      users: { total: totalUsers, thisMonth: monthUsers },
      recentOrders,
      bestSellers,
      lowStock: lowStock.filter(p => p.variants.some(v => v.stock <= 5)),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/revenue-chart', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const data = await Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    res.json({ data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/inventory', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).select('name variants totalSold').populate('category', 'name');
    const inventory = products.map(p => ({
      id: p._id,
      name: p.name,
      totalStock: p.variants.reduce((s, v) => s + v.stock, 0),
      totalSold: p.totalSold,
      variants: p.variants.map(v => ({ size: v.size, color: v.color, stock: v.stock, isLow: v.stock <= 5 })),
    }));
    res.json({ inventory });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/top-products', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const products = await Product.find({ totalSold: { $gt: 0 } })
      .sort('-totalSold')
      .limit(limit)
      .select('name images price totalSold')
      .lean();

    const productIds = products.map(p => p._id);
    const revenueData = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $unwind: '$items' },
      { $match: { 'items.product': { $in: productIds } } },
      { $group: { _id: '$items.product', revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
    ]);
    const revenueMap = {};
    revenueData.forEach(r => { revenueMap[r._id.toString()] = r.revenue; });

    const result = products.map(p => ({
      _id: p._id,
      name: p.name,
      image: p.images?.[0]?.url || '',
      price: p.price,
      unitsSold: p.totalSold,
      revenue: revenueMap[p._id.toString()] || p.totalSold * p.price,
    }));

    res.json({ products: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/orders-by-status', async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
