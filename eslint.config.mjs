import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "out/**",
      "src-tauri/**",
      "playwright-report/**",
      "test-results/**",
      ".opencode/**",
    ],
  },
  {
    rules: {
      // Pre-existing debt from the polypack graph API returning `any`;
      // tracked but not blocking until the types are tightened.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;
