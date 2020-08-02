module.exports = {
  resolver: {
    sourceExts: ["js", "json", "ts", "tsx", "jsx"],
  },
  transformer: {
    // https://github.com/typeorm/typeorm/issues/4723#issuecomment-631116050
    // https://forums.expo.io/t/change-minifierconfig-for-minify-uglify/36460/2
    minifierConfig: {
      keep_classnames: true, // FIX typeorm
      keep_fnames: true, // FIX typeorm
      mangle: {
        keep_classnames: true, // FIX typeorm
        keep_fnames: true, // FIX typeorm
      },
    },
  },
};
