import { defineConfig } from 'oxlint';

export default defineConfig({
  ignorePatterns: ['**/.github/**', '**/coverage/**', '**/dist/**', '**/node_modules/**'],
  overrides: [
    {
      files: ['**/*.test.ts', '**/tests/**/*.test.ts', '**/tests/**/*.ts', '**/__properties__/**/*.ts'],
      // Disable certain rules for test files
      rules: {
        'typescript/no-unsafe-assignment': 'off',
        'typescript/no-unsafe-call': 'off',
        'typescript/no-unsafe-member-access': 'off',
        'typescript/no-unsafe-return': 'off',
        'typescript/unbound-method': 'off',
        'vitest/no-importing-vitest-globals': 'off',
        'vitest/no-conditional-expect': 'off',
        'vitest/require-mock-type-parameters': 'off',
      },
    },
    {
      files: ['scripts/**/*.ts'],
      rules: {
        'eslint/no-console': 'off',
      },
    },
  ],
  plugins: ['eslint', 'import', 'oxc', 'promise', 'typescript', 'unicorn', 'vitest'],
  rules: {
    'eslint/eqeqeq': ['error', 'always'],
    'eslint/no-implicit-coercion': 'error',
    'eslint/prefer-const': 'error',
    'eslint/prefer-object-spread': 'error',
    'import/no-cycle': 'error',
    'import/no-duplicates': 'error',
    'oxc/bad-replace-all-arg': 'error',
    'oxc/branches-sharing-code': 'error',
    'typescript/adjacent-overload-signatures': 'error',
    'typescript/array-type': ['error', { default: 'array-simple' }],
    'typescript/ban-types': 'error',
    'typescript/consistent-generic-constructors': 'error',
    'typescript/consistent-type-imports': 'error',
    'typescript/dot-notation': 'error',
    'typescript/explicit-function-return-type': 'error',
    'typescript/no-unsafe-assignment': 'error',
    'typescript/prefer-literal-enum-member': 'error',
    'typescript/prefer-ts-expect-error': 'error',
    'typescript/restrict-plus-operands': 'error',
    'typescript/strict-boolean-expressions': 'error',
    'unicorn/catch-error-name': 'error',
    'unicorn/prefer-node-protocol': 'error',
    'vitest/no-importing-vitest-globals': 'error',
  },
});
