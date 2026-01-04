/**
 * ESLint Configuration (Flat Config - ESLint 9+)
 */

import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      'jsx-a11y': jsxA11y,
      'react-hooks': reactHooks,
      'unused-imports': unusedImports,
    },
    rules: {
      // Disable base rule to avoid conflicts
      '@typescript-eslint/no-unused-vars': 'off',
      // Enable unused-imports plugin rules (auto-fixable)
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': [
        'warn',
        {
          fixToUnknown: false, // Don't auto-fix to unknown (too risky)
          ignoreRestArgs: false,
        },
      ],
      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Accessibility rules
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
    },
  },
  {
    files: ['scripts/**/*.{ts,js,mjs}', 'public/sw.ts'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        require: 'readonly',
      },
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'public/sw.js',
      'coverage/**',
      '*.config.*',
      '.lintstagedrc.js',
      '.storybook/**',
      'storybook-static/**',
    ],
  }
);
