const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for worklets
config.transformer.minifierConfig = {
  compress: {
    inline: true,
  },
};

module.exports = config;
