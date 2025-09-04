module.exports = {
  root: true,
  extends: ["next", "next/core-web-vitals"],
  parserOptions: {
    ecmaVersion: 2023,
    sourceType: "module",
  },
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "react/jsx-key": "warn",
    "no-console": ["warn", { allow: ["warn", "error"] }],
  },
};
