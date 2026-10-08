import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    // The combat engine must stay pure: no I/O, no clocks, no ambient randomness.
    files: ['packages/combat-engine/src/**/*.ts'],
    ignores: ['packages/combat-engine/src/**/*.test.ts', 'packages/combat-engine/src/tools/**'],
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use the seeded RNG.' },
        { object: 'Date', property: 'now', message: 'Time must be passed in.' },
      ],
      'no-restricted-globals': ['error', 'setTimeout', 'setInterval', 'fetch', 'window', 'process'],
    },
  },
);
