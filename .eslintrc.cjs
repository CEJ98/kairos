module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  env: {
    node: true,
    es2021: true
  },
  plugins: ['@typescript-eslint', 'testing-library'],
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'eslint:recommended',
    'plugin:testing-library/react',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
    ],
    '@next/next/no-html-link-for-pages': 'off'
  },
  settings: {
    next: {
      rootDir: ['src/*/']
    }
  }
};
