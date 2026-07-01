import { defineConfig } from 'oxfmt';

export default defineConfig({
  ignorePatterns: ['**/.github/**', '**/coverage/**', '**/dist/**', '**/node_modules/**'],
  overrides: [
    {
      files: ['**/*.ts'],
      options: {
        singleQuote: true,
        printWidth: 120,
      },
    },
    {
      files: ['**/*.json', '**/*.jsonc', '**/.swcrc'],
      options: {
        // For JSON files, we want to keep the print width small for better readability
        printWidth: 20,
        trailingComma: 'none',
      },
    },
    {
      files: ['**/*.md'],
      options: {
        tabWidth: 4,
      },
    },
  ],
  sortImports: {
    newlinesBetween: false,
    groups: [
      'type-import',
      'type-internal',
      ['type-parent', 'type-sibling', 'type-index'],
      'value-builtin',
      'value-external',
      'value-internal',
      ['value-parent', 'value-sibling', 'value-index'],
      'unknown',
    ],
  },
});
