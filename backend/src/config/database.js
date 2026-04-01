const mongoose = require('mongoose');
const logger = require('./logger');

const MONGO_OPTIONS = {
  // Prefer IPv4 — many PaaS ↔ Atlas paths fail on IPv6 (secureConnect timeout / server selection errors)
  family: 4,
  maxPoolSize: 5,
  minPoolSize: 1,
  serverSelectionTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
  connectTimeoutMS: 10_000,
};

let reconnectTimer = null;
let reconnectAttempt = 0;
let isShuttingDown = false;
let disconnectDebounce = null;

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function getMongoUri() {
  return process.env.MONGODB_URI || null;
}

/**
 * After a drop, explicitly call connect again (driver does not always recover every failure mode).
 * Backoff caps at 60s between attempts.
 */
function scheduleReconnectAttempt() {
  if (isShuttingDown) return;

  clearReconnectTimer();
  const delay =
    reconnectAttempt === 0
      ? 0
      : Math.min(60_000, 2000 * 2 ** Math.min(reconnectAttempt, 5));
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    if (isShuttingDown) return;
    if (mongoose.connection.readyState === 1) {
      reconnectAttempt = 0;
      return;
    }

    const mongoUri = getMongoUri();
    if (!mongoUri) {
      logger.error('MONGODB_URI missing; cannot reconnect');
      reconnectAttempt += 1;
      scheduleReconnectAttempt();
      return;
    }

    try {
      await mongoose.connect(mongoUri, MONGO_OPTIONS);
      reconnectAttempt = 0;
      logger.info(`MongoDB reconnected: ${mongoose.connection.host}`);
    } catch (err) {
      reconnectAttempt += 1;
      logger.error(`MongoDB reconnect failed (attempt ${reconnectAttempt}): ${err.message}`);
      scheduleReconnectAttempt();
    }
  }, delay);
}

mongoose.connection.on('disconnected', () => {
  if (isShuttingDown) return;
  logger.warn('MongoDB disconnected');

  // Debounce: driver may briefly disconnect before auto-recovery
  if (disconnectDebounce) clearTimeout(disconnectDebounce);
  disconnectDebounce = setTimeout(() => {
    disconnectDebounce = null;
    if (isShuttingDown) return;
    if (mongoose.connection.readyState === 1) return;
    reconnectAttempt = 0;
    scheduleReconnectAttempt();
  }, 2000);
});

mongoose.connection.on('connected', () => {
  reconnectAttempt = 0;
  clearReconnectTimer();
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB driver reconnected');
  reconnectAttempt = 0;
  clearReconnectTimer();
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error event: ${err.message}`);
});

/**
 * @param {{ exitOnFailure?: boolean }} [options] - If false, start reconnect loop instead of exiting (for HTTP-first startup).
 */
const connectDB = async (options = {}) => {
  const { exitOnFailure = true } = options;
  const mongoUri = getMongoUri();
  if (!mongoUri) {
    logger.error('MONGODB_URI is not set. Please configure MongoDB connection.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, MONGO_OPTIONS);
    reconnectAttempt = 0;
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    if (exitOnFailure) {
      process.exit(1);
    }
    scheduleReconnectAttempt();
  }
};

/** Call before process exit so we don’t fight graceful shutdown with reconnect loops */
function setMongoShuttingDown(value) {
  isShuttingDown = !!value;
  if (disconnectDebounce) {
    clearTimeout(disconnectDebounce);
    disconnectDebounce = null;
  }
  clearReconnectTimer();
}

module.exports = connectDB;
module.exports.setMongoShuttingDown = setMongoShuttingDown;
module.exports.MONGO_OPTIONS = MONGO_OPTIONS;
