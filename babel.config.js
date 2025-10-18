module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }]],
    plugins: [
      // NOTE: Reanimated plugin MUST be listed last
      "react-native-reanimated/plugin",
    ],
  };
};