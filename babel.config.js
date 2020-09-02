module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "babel-plugin-transform-typescript-metadata", // Previously for Typeorm, but keep it here just to be safe.
    ],
  };
};
