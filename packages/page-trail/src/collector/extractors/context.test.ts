import { describe, expect, it } from 'vitest';

import { getElementContext } from './context';

describe('getElementContext', () => {
    it('collects semantic container path from nearest ancestors', () => {
        document.body.innerHTML = `
            <main>
                <nav>
                    <form>
                        <button>Submit</button>
                    </form>
                </nav>
            </main>
        `;

        const button = document.querySelector('button')!;

        expect(getElementContext(button, document).path).toEqual(['form', 'navigation', 'main content']);
    });

    it('deduplicates consecutive container roles', () => {
        document.body.innerHTML = `
            <nav>
                <div role="navigation">
                    <a href="/docs">Docs</a>
                </div>
            </nav>
        `;

        const link = document.querySelector('a')!;

        expect(getElementContext(link, document).path).toEqual(['navigation']);
    });

    it('uses aria-labelledby as section name', () => {
        document.body.innerHTML = `
            <section aria-labelledby="title">
                <h2 id="title">Account settings</h2>
                <button>Save</button>
            </section>
        `;

        const button = document.querySelector('button')!;

        expect(getElementContext(button, document).sectionName).toBe('Account settings');
    });

    it('falls back to headings for section name', () => {
        document.body.innerHTML = `
            <section>
                <h2>Billing details</h2>
                <button>Update</button>
            </section>
        `;

        const button = document.querySelector('button')!;

        expect(getElementContext(button, document).sectionName).toBe('Billing details');
    });

    it('ignores section names outside length limits', () => {
        document.body.innerHTML = `
            <section aria-label="FAQ">
                <button>Open</button>
            </section>
        `;

        const button = document.querySelector('button')!;

        expect(getElementContext(button, document).sectionName).toBeUndefined();
    });
});
