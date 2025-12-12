import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginReactConfig from 'eslint-plugin-react/configs/recommended.js';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  // 1. Global Settings
  {
    files: ['**/*.{js,jsx}'], // Target JS and JSX files
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } }, // Enable JSX parsing
      globals: globals.browser, // Define browser global variables like 'document', 'window'
    },
  },

  // 2. ESLint's Recommended Rules
  pluginJs.configs.recommended,

  // 3. React Recommended Rules
  {
    ...pluginReactConfig,
    settings: {
      react: {
        version: 'detect', // Automatically detect the React version
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'no-unused-vars': 'warn',
    },
  },

  // 4. Prettier Integration (MUST BE THE LAST ELEMENT!)
  // This turns off all ESLint rules that are unnecessary or might conflict with Prettier.
  eslintConfigPrettier,
];
