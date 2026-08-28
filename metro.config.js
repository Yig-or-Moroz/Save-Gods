// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Додаємо підтримку .webp до списку дозволених розширень
config.resolver.assetExts.push('webp');

module.exports = config;