const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      // Local-dev convenience: if no MongoDB URI is configured, spin up an in-memory MongoDB.
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mem = await MongoMemoryServer.create();
      mongoUri = mem.getUri();
      logger.warn('MONGODB_URI not set. Using in-memory MongoDB for local development.');
    }

    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
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
