/// <reference types="node" />

import { defineConfig, devices } from '@playwright/test';
import { BACKEND_URL, SANDBOX_PORT, SANDBOX_URL } from './test/e2e/constants';

export default defineConfig({
    testDir: './test/e2e',
    outputDir: './reports/e2e-tests/artifacts',
    fullyParallel: false,
    reporter: [
        ['list'],
        [
            'junit',
            {
                outputFile: './reports/e2e-tests/results/junit.xml',
            },
        ],
    ],
    use: {
        trace: 'retain-on-failure',
    },
    projects: [
        {
            name: 'embed',
            testMatch: /(?:embed|demo)\.spec\.ts/,
            use: {
                ...devices['Desktop Chrome'],
                baseURL: SANDBOX_URL,
            },
        },
        {
            name: 'chrome',
            testMatch: /chrome\.spec\.ts/,
            use: {
                ...devices['Desktop Chrome'],
                baseURL: SANDBOX_URL,
            },
        },
    ],
    webServer: {
        command: `VITE_FLOWFORGE_SERVER_URL=${BACKEND_URL} npm run build && npm run sandbox -- --port ${SANDBOX_PORT}`,
        url: SANDBOX_URL,
        reuseExistingServer: !process.env.CI,
    },
});
