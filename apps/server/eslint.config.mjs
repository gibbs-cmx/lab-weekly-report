// @ts-check
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";

export default [
  {
    ignores: [
      "dist/**",
      "cdk.out/**",
      "src/**/localhost.ts",
      "node_modules/**",
      "cdk.out/**",
      "coverage/**",
      "test/e2e/**",
    ],
  },
  {
    files: ["src/**/*.ts", "test/**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      import: importPlugin,
    },
    rules: {
      // ── TypeScript ─────────────────────────────────────────────
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/naming-convention": [
        "warn",
        {
          selector: ["variable", "function", "parameter", "method"],
          format: ["camelCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
        },
        {
          selector: ["typeLike", "class", "interface", "typeAlias", "enum"],
          format: ["PascalCase"],
        },
        {
          selector: ["enumMember"],
          format: ["UPPER_CASE"],
        },
      ],

      // ── Import 순서 ────────────────────────────────────────────
      "import/order": [
        "warn",
        {
          groups: [["builtin", "external"], "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          alphabetize: { order: "asc" },
          pathGroups: [
            {
              pattern: "@/**",
              group: "internal",
              position: "after",
            },
          ],
        },
      ],

      // ── 일반 ───────────────────────────────────────────────────
      // null 비교는 == 허용 (== null 은 null+undefined 동시 체크 idiom)
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-var": "error",
      "no-console": "warn",
      "no-debugger": "error",
    },
  },
];
