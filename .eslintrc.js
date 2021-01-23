module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: 2018,
  },
  root: true,
  rules: {
    eqeqeq: "error",
    quotes: ["error", "double"],
  },
};
