module.exports = {
  extends: ["universe/native", "prettier"],
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": "error",

    // https://github.com/typescript-eslint/typescript-eslint/issues/1856
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "off",

    "react/no-did-mount-set-state": "off",
  },
};
