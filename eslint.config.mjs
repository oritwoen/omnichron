import unjs from "eslint-config-unjs";

export default unjs({
  ignores: [
    // ignore paths
  ],
  rules: {
    // rule overrides
    "unicorn/numeric-separators-style": "off"
  },
  markdown: {
    rules: {
      // markdown rule overrides
    },
  },
});
