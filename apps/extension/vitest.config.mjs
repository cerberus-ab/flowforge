import preact from '@preact/preset-vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [preact()],
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        environment: 'happy-dom',
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        setupFiles: ['./test/unit/setup.ts'],
        reporters: ['default', 'junit'],
        outputFile: {
            junit: './reports/unit-tests/results/junit.xml',
        },
    },
});
