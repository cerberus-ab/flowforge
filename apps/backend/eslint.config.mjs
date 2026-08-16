import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: ['dist/**', 'data/**'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['src/**/*.ts', 'scripts/**/*.{js,ts}'],
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
