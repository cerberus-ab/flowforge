import type { BrowserContext, Page } from '@playwright/test';
import type { QueryResponse } from '@flowforge/contract';
import { BACKEND_URL } from '../constants';

const corsHeaders = {
    'access-control-allow-headers': 'content-type',
    'access-control-allow-methods': 'OPTIONS, POST',
    'access-control-allow-origin': '*',
};

export async function mockQuery(target: BrowserContext | Page, response: QueryResponse, delayMs = 0) {
    await target.route(`${BACKEND_URL}/query`, async (route) => {
        if (route.request().method() === 'OPTIONS') {
            await route.fulfill({
                status: 204,
                headers: corsHeaders,
            });
            return;
        }
        if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: corsHeaders,
            body: JSON.stringify(response),
        });
    });
}
