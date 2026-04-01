const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      logger.error('MONGODB_URI is not set. Please configure MongoDB connection.');
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Fail faster than default ~30s so load balancers don’t sit at p50 ≈ 30s on bad networks
      serverSelectionTimeoutMS: 12_000,
      connectTimeoutMS: 12_000,
      socketTimeoutMS: 45_000,
      maxPoolSize: 10,
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

module.exports = connectDB;
