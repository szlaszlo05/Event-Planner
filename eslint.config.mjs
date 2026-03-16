import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import promisePlugin from 'eslint-plugin-promise';
import securityPlugin from 'eslint-plugin-security';
import globals from 'globals';

export default [
  //
  // flat plugin configs
  //
  {
    rules: {
      ...js.configs.all.rules,
      'capitalized-comments': 0,
      'class-methods-use-this': 0,
      'func-style': 0,
      'id-length': 0,
      'no-alert': 0,
      'no-console': 0,
      'no-implicit-globals': 0,
      'no-inline-comments': 0,
      'no-magic-numbers': 0,
      'no-negated-condition': 0,
      'no-param-reassign': 0,
      'no-plusplus': 0,
      'no-ternary': 0,
      'one-var': 0,
      'prefer-destructuring': 0,
      'sort-keys': 0,
      'sort-imports': 0,
      strict: 0,
      'vars-on-top': 0,
    },
  },

  importPlugin.flatConfigs.recommended,

  {
    ...promisePlugin.configs['flat/recommended'],
    rules: {
      ...promisePlugin.configs['flat/recommended'].rules,
      'promise/always-return': 0,
    },
  },

  {
    ...securityPlugin.configs.recommended,
    rules: {
      ...securityPlugin.configs.recommended.rules,
      'security/detect-object-injection': 0,
      'security/detect-non-literal-fs-filename': 0,
      'security/detect-possible-timing-attacks': 0,
    },
  },

  //
  // common settings
  //
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.nodeBuiltin,
      },
    },
    rules: {
      //
      // built-in
      //
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      'arrow-parens': ['error', 'always'],
      complexity: ['error', 12],
      'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
      'max-len': [
        'error',
        {
          code: 120,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreComments: true,
        },
      ],
      'max-classes-per-file': ['error', 5],
      'max-nested-callbacks': ['error', 4],
      'max-params': ['error', 8],
      'max-depth': ['error', 5],
      'max-lines-per-function': ['error', 100],
      'max-lines': ['error', 500],
      'max-statements': ['error', 25],
      'no-underscore-dangle': ['error', { allow: ['_id'] }],
      'no-trailing-spaces': ['error', { skipBlankLines: true, ignoreComments: true }],
      'spaced-comment': 'error',

      //
      // import
      //
      'import/extensions': [
        'error',
        {
          js: 'ignorePackages',
          ts: 'never',
        },
      ],
    },
  },

  //
  // only for browser (public, static)
  //
  {
    files: ['**/static/**/*.js', '**/public/**/*.js', '1-htmlcss/**/*.{js,mjs,cjs}', '2-javascript/**/*.{js,mjs,cjs}'],
    languageOptions: {
      sourceType: 'script',
      globals: globals.browser,
    },
  },

  //
  // prettier (must be last)
  //
  prettierRecommended,
];
