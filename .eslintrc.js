module.exports = {
  root: true,

  env: {
    node: true,
  },

  extends: ["plugin:vue/essential", "@vue/prettier", "@vue/typescript"],

  rules: {
    "no-console": "off",
    "no-debugger": "off",
    "trailing-comma": [0, { multiline: "always", singleline: "never" }],
  },

  parserOptions: {
    parser: "@typescript-eslint/parser",
  },

  "extends": ["plugin:vue/strongly-recommended", "@vue/typescript"],
};
