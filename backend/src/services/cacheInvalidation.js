const cache = require('./cacheService');

exports.bustProducts = () => cache.invalidatePrefix('api:products:');
exports.bustCategories = () => cache.invalidatePrefix('api:categories:');
exports.bustSettings = () => cache.invalidatePrefix('api:settings:');
exports.bustColors = () => cache.invalidatePrefix('api:colors:');

exports.bustProductsAndCategories = () => {
  cache.invalidatePrefix('api:products:');
  cache.invalidatePrefix('api:categories:');
};

exports.bustProductsAndColors = () => {
  cache.invalidatePrefix('api:products:');
  cache.invalidatePrefix('api:colors:');
};
