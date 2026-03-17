const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const emailService = require('../services/emailService');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const signRefreshToken = (id) => jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' });

const sendTokens = (user, statusCode, res) => {
  const token = signToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  user.password = undefined;
  user.refreshToken = undefined;

  res.status(statusCode).json({ token, refreshToken, user });
};

exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered.' });
    const user = await User.create({ firstName, lastName, email, password });
    await emailService.sendWelcome(user);
    sendTokens(user, 201, res);
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (!user.isActive) return res.status(401).json({ error: 'Account deactivated.' });
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    sendTokens(user, 200, res);
  } catch (err) { next(err); }
};

exports.logout = (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.json({ message: 'Logged out successfully.' });
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    const newToken = signToken(user._id);
    res.json({ token: newToken });
  } catch (err) { res.status(401).json({ error: 'Invalid refresh token' }); }
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ user });
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.json({ message: 'If that email exists, a reset link was sent.' });
    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    await emailService.sendPasswordReset(user, resetUrl);
    res.json({ message: 'If that email exists, a reset link was sent.' });
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ error: 'Token is invalid or expired.' });
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    sendTokens(user, 200, res);
  } catch (err) { next(err); }
};

exports.googleAuth = (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};

exports.googleCallback = async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_failed`);

    // Exchange authorization code for Google access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_failed`);
    }

    // Fetch Google user profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const { sub: googleId, email, given_name, family_name, picture } = await profileRes.json();
    if (!email) return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_failed`);

    // Find existing user by googleId or email, or create a new one
    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (!user) {
      user = await User.create({
        googleId,
        email,
        firstName: given_name || email.split('@')[0],
        lastName: family_name || '-',
        avatar: picture || '',
        isVerified: true,
      });
    } else {
      if (!user.googleId) user.googleId = googleId;
      if (picture && !user.avatar) user.avatar = picture;
      await user.save({ validateBeforeSave: false });
    }

    if (!user.isActive) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=account_deactivated`);
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}`);
  } catch (err) {
    next(err);
  }
};
