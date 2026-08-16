import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'happy-dom',
        include: ['src/**/*.test.ts'],
        reporters: ['default', 'junit'],
        outputFile: {
            junit: './reports/unit-tests/results/junit.xml',
        },
        coverage: {
            provider: 'v8',
            reportsDirectory: './reports/unit-tests/coverage',
            reporter: ['text', 'html', 'lcov'],
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.test.ts', 'src/types/**', 'src/index.ts'],
            thresholds: {
                statements: 80,
                branches: 70,
                functions: 80,
                lines: 80,
            },
        },
    },
});
