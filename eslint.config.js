// @ts-check
import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import astro from 'eslint-plugin-astro';
import jsxA11y from 'eslint-plugin-jsx-a11y-x';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores(['dist/', '.astro/', 'node_modules/', '.playwright-mcp/']),

  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // Astro templates, including accessibility checks on their markup.
  ...astro.configs['flat/recommended'],
  ...astro.configs['flat/jsx-a11y-recommended'],

  // The same accessibility checks for React components.
  { files: ['**/*.tsx'], ...jsxA11y.configs.recommended },

  {
    rules: {
      // A leading underscore marks something as deliberately unused.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },

  // Build and import scripts run in Node, not in the browser.
  {
    files: ['scripts/**', '*.config.{js,mjs}'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
      },
    },
  },
);
