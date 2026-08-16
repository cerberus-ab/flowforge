import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: ['dist/**', 'sandbox/**'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['src/**/*.{ts,tsx}'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.es2022,
                chrome: 'readonly',
            },
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        rules: {
            'no-undef': 'off',
        },
    },
    {
        files: ['scripts/**/*.{js,ts}', 'vite.config.*.ts'],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.es2022,
            },
        },
        rules: {
            'no-undef': 'off',
        },
    },
);
