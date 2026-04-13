import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactNativePlugin from 'eslint-plugin-react-native';
import prettierPlugin from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default tseslint.config(
    {
        ignores: ['babel.config.js', 'metro.config.js', 'eslint.config.mjs'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['src/**/*.{js,jsx,ts,tsx}'],
        plugins: {
            react: reactPlugin,
            'react-native': reactNativePlugin,
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                require: true,
                console: true,
            },
        },
        rules: {
            'react-native/no-unused-styles': 'warn',
            'no-console': 'off',
            '@typescript-eslint/no-require-imports': 'off',
        },
    },
    prettierPlugin
);