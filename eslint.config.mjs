import js from "@eslint/js";
import globals from "globals";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },

    plugins: {
      js,
      prettier: prettierPlugin,
    },

    rules: {
      ...js.configs.recommended.rules,

      // Your custom rules
      "no-unused-vars": "warn",

      // Run prettier as ESLint rule
      "prettier/prettier": "warn",
    },
  },

  // Disable conflicting formatting rules
  prettierConfig,
]);