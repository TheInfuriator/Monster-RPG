/**
 * eslint.config.js
 * ----------------------------------------------------------------------------
 * A deliberately small lint setup. Its job is to catch the mistakes that are
 * genuinely hard to spot by eye — a typo'd variable, an unused import, a
 * forgotten `await` — not to argue about formatting.
 *
 * Run it with:  npm run lint
 */

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser globals the game uses.
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        Image: 'readonly',
        HTMLCanvasElement: 'readonly',
        requestAnimationFrame: 'readonly',
      },
    },
    rules: {
      // The ones that catch real bugs.
      'no-undef': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-dupe-keys': 'error',
      'no-dupe-args': 'error',
      'no-duplicate-case': 'error',
      'no-unreachable': 'error',
      'no-const-assign': 'error',
      'no-self-compare': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-fallthrough': 'error',
      eqeqeq: ['warn', 'smart'],
    },
  },
  {
    // Tests run in Vitest, which supplies its own globals via imports,
    // plus Node globals for reading fixture files.
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: { process: 'readonly' },
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];
