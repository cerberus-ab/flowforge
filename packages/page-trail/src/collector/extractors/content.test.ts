import { afterEach, describe, expect, it, vi } from 'vitest';

import { markHidden, markVisible, resetDocument } from '../../../test/domUtils';
import { ElementRegistry } from '../ElementRegistry';
import { ContainerTree } from './ContainerTree';
import { extractContentElements } from './content';

afterEach(() => {
    resetDocument();
    vi.restoreAllMocks();
});

describe('extractContentElements', () => {
    it('extracts visible content elements after scoring', () => {
        document.body.innerHTML = `
            <main>
                <h1 id="title">Welcome</h1>
                <p id="intro">Useful paragraph text</p>
                <p id="short">No</p>
                <p id="hidden">Hidden paragraph text</p>
            </main>
        `;
        markVisible('#title');
        markVisible('#intro');
        markVisible('#short');
        markHidden('#hidden');

        const registry = createRegistry();
        const containerTree = ContainerTree.extractFor(window, document, registry);
        const topElements = extractContentElements(window, document.body, registry, containerTree, { elementsLimit: 0 });

        expect(topElements.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    kind: 'content',
                    type: 'heading',
                    tag: 'h1',
                    text: 'Welcome',
                    dataId: 'title',
                    cssSelector: undefined,
                }),
                expect.objectContaining({
                    kind: 'content',
                    type: 'text',
                    tag: 'p',
                    text: 'Useful paragraph text',
                    dataId: 'intro',
                    cssSelector: undefined,
                }),
            ]),
        );
        expect(topElements.data.map((el) => el.dataId)).not.toContain('short');
        expect(topElements.data.map((el) => el.dataId)).not.toContain('hidden');

        topElements.data.forEach((el) => {
            expect(el.context.contextScore.value).toBeGreaterThan(0);
            expect(el.context.contextScore).toHaveProperty('features');
        });
    });

    it('applies the element limit after importance scoring', () => {
        document.body.innerHTML = `
            <main>
                <h1 id="heading">Important heading</h1>
                <p id="paragraph">Regular paragraph text</p>
            </main>
        `;
        markVisible('#heading');
        markVisible('#paragraph');

        const registry = createRegistry();
        const containerTree = ContainerTree.extractFor(window, document, registry);
        const topElements = extractContentElements(window, document.body, registry, containerTree, { elementsLimit: 1 });

        expect(topElements.data).toHaveLength(1);
        expect(topElements.data[0]).toEqual(expect.objectContaining({ dataId: 'heading' }));
        expect(topElements.total).toBe(2);
        expect(topElements.limitReached).toBe(true);
    });
});

function createRegistry() {
    return new ElementRegistry((el) => el.id);
}
