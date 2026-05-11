import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";
export default tseslint.config(
  { ignores: ["dist/**", "dev-dist/**"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-hooks/exhaustive-deps": "error",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: [
      "src/app/routes.tsx",
      "src/components/ui/badge.tsx",
      "src/components/ui/button.tsx",
      "src/context/AuthContext.tsx",
      "src/context/CurrencyContext.tsx",
      "src/context/FeatureFlagsContext.tsx",
      "src/context/LanguageContext.tsx",
      "src/context/ThemeContext.tsx",
      "src/context/TourContext.tsx",
      "src/lib/accessibility.tsx",
      "src/lib/toast.tsx",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  }
);
