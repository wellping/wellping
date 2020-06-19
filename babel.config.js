module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "babel-plugin-transform-typescript-metadata", // https://github.com/typeorm/expo-example/blob/master/babel.config.js
    ],
  };
};
