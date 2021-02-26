module.exports = {
  root: true,
  env: {
    node: true,
  },
  // extends: ["plugin:vue/essential", "@vue/prettier", "@vue/typescript"],
  extends: ["plugin:vue/essential", "@vue/typescript"],
  rules: {
    // "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-console": "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "trailing-comma": [0, { "multiline": "always", "singleline": "never" }],
  },
  parserOptions: {
    parser: "@typescript-eslint/parser",
  },
};
