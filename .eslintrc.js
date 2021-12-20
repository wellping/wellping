module.exports = {
  extends: [
    "universe/native",
    "universe/shared/typescript-analysis",
    "prettier",
  ],
  overrides: [
    {
      files: ["*.ts", "*.tsx", "*.d.ts"],
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
  ],
  plugins: ["prettier"],
  ignorePatterns: ["**/*.snap"],
  rules: {
    "prettier/prettier": "error",

    "no-fallthrough": "off",

    // https://github.com/typescript-eslint/typescript-eslint/issues/1856
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "off",

    "react/no-did-mount-set-state": "off",

    "no-useless-return": "off",
  },
};
