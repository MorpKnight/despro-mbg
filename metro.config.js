const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
 
const config = getDefaultConfig(__dirname)

const assetExts = config.resolver.assetExts ?? [];
const sourceExts = config.resolver.sourceExts ?? [];

config.resolver.assetExts = assetExts.includes('wasm') ? assetExts : [...assetExts, 'wasm'];
config.resolver.sourceExts = sourceExts.filter((ext) => ext !== 'wasm');
 
module.exports = withNativeWind(config, { input: './global.css' })