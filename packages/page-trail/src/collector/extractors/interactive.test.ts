import { afterEach, describe, expect, it, vi } from 'vitest';

import { markHidden, markVisible, resetDocument, setViewport } from '../../../test/domUtils';
import { ElementRegistry } from '../ElementRegistry';
import { extractPageBasics } from './basics';
import { ContainerTree } from './ContainerTree';
import { extractInteractiveElements } from './interactive';

afterEach(() => {
    resetDocument();
    vi.restoreAllMocks();
});

describe('extractInteractiveElements', () => {
    it('extracts visible non-sensitive interactive elements', () => {
        // Given
        document.body.innerHTML = `
            <main>
                <button id="save" aria-label="Save changes">💾</button>
                <a id="docs" href="/docs">Docs</a>
                <input id="email" placeholder="Email" />
                <button id="hidden">Hidden action</button>
                <input id="password" type="password" />
            </main>
        `;
        markVisible('main');
        markVisible('#save');
        markVisible('#docs');
        markVisible('#email');
        markHidden('#hidden');
        markVisible('#password');
        setViewport({ width: 1024, height: 768, scrollY: 0, scrollHeight: 2000 });

        const registry = createRegistry();
        const containerTree = ContainerTree.extractFor(window, document, registry);

        // When
        const topElements = extractInteractiveElements(
            window,
            document.body,
            registry,
            extractPageBasics(window, document),
            containerTree,
            { elementsLimit: 0 },
        );

        // Then
        expect(topElements.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    kind: 'interactive',
                    type: 'button',
                    role: 'button',
                    dataId: 'save',
                    cssSelector: undefined,
                    labels: [{ source: 'aria-label', value: 'Save changes' }],
                    inViewport: true,
                    aboveTheFold: true,
                }),
                expect.objectContaining({
                    kind: 'interactive',
                    type: 'link',
                    role: 'link',
                    dataId: 'docs',
                    cssSelector: undefined,
                    link: {
                        type: 'internal',
                        href: 'http://localhost:3000/docs',
                    },
                }),
                expect.objectContaining({
                    kind: 'interactive',
                    type: 'input',
                    role: 'textbox',
                    dataId: 'email',
                    cssSelector: undefined,
                    labels: [{ source: 'placeholder', value: 'Email' }],
                }),
            ]),
        );
        expect(topElements.data.map((el) => el.dataId)).not.toContain('hidden');
        expect(topElements.data.map((el) => el.dataId)).not.toContain('password');

        topElements.data.forEach((el) => {
            expect(el.context.contextScore.value).toBeGreaterThan(0);
            expect(el.context.breadcrumbs.length).toBeGreaterThan(0);
        });
    });

    it('applies the element limit after importance scoring', () => {
        // Given
        document.body.innerHTML = `
            <main>
                <button id="button">Submit</button>
                <a id="link" href="/docs">Docs</a>
            </main>
        `;
        markVisible('main');
        markVisible('#button');
        markVisible('#link');

        const registry = createRegistry();
        const containerTree = ContainerTree.extractFor(window, document, registry);

        // When
        const topElements = extractInteractiveElements(
            window,
            document.body,
            registry,
            extractPageBasics(window, document),
            containerTree,
            { elementsLimit: 1 },
        );

        // Then
        expect(topElements.data).toHaveLength(1);
        expect(topElements.data[0]).toEqual(expect.objectContaining({ dataId: 'button' }));
        expect(topElements.total).toBe(2);
        expect(topElements.limitReached).toBe(true);
    });
});

function createRegistry() {
    return new ElementRegistry((el) => el.id);
}
