const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable package.json "exports" field resolution — required for @supabase/supabase-js
// so Metro picks up the React Native build instead of the Node.js build
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
