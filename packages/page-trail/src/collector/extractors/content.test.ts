import { afterEach, describe, expect, it, vi } from 'vitest';

import { markHidden, markVisible, resetDocument } from '../../../test/domUtils';
import { ElementLocatorCreator } from '../ElementLocatorCreator';
import { ContainerTree } from './ContainerTree';
import { extractContainerElements } from './container';
import { extractContentElements } from './content';
import { nextIdGenerator } from '../../utils/nextId';

afterEach(() => {
    resetDocument();
    vi.restoreAllMocks();
});

describe('extractContentElements', () => {
    it('extracts visible content elements after scoring', () => {
        // Given
        document.body.innerHTML = `
            <main>
                <h1 id="title">Welcome</h1>
                <p id="intro">Useful paragraph text</p>
                <p id="short">No</p>
                <p id="hidden">Hidden paragraph text</p>
            </main>
        `;
        markVisible('main');
        markVisible('#title');
        markVisible('#intro');
        markVisible('#short');
        markHidden('#hidden');

        const nextId = nextIdGenerator();
        const locatorCreator = new ElementLocatorCreator((el) => el.id);
        const containerTree = createContainerTree(nextId, locatorCreator);

        // When
        const extracted = extractContentElements(window, document.body, nextId, locatorCreator, containerTree, {
            elementsLimit: 0,
        });

        // Then
        expect(extracted.elements()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    kind: 'content',
                    type: 'heading',
                    tag: 'h1',
                    text: 'Welcome',
                    locator: { dataId: 'title', cssSelector: undefined },
                }),
                expect.objectContaining({
                    kind: 'content',
                    type: 'text',
                    tag: 'p',
                    text: 'Useful paragraph text',
                    locator: { dataId: 'intro', cssSelector: undefined },
                }),
            ]),
        );
        expect(extracted.elements().map((el) => el.locator.dataId)).not.toContain('short');
        expect(extracted.elements().map((el) => el.locator.dataId)).not.toContain('hidden');

        extracted.elements().forEach((el) => {
            expect(el.context.contextScore.value).toBeGreaterThan(0);
            expect(el.context.breadcrumbs.length).toBeGreaterThan(0);
        });
    });

    it('applies the element limit after importance scoring', () => {
        // Given
        document.body.innerHTML = `
            <main>
                <h1 id="heading">Important heading</h1>
                <p id="paragraph">Regular paragraph text</p>
            </main>
        `;
        markVisible('main');
        markVisible('#heading');
        markVisible('#paragraph');

        const nextId = nextIdGenerator();
        const locatorCreator = new ElementLocatorCreator((el) => el.id);
        const containerTree = createContainerTree(nextId, locatorCreator);

        // When
        const extracted = extractContentElements(window, document.body, nextId, locatorCreator, containerTree, {
            elementsLimit: 1,
        });

        // Then
        expect(extracted.elements()).toHaveLength(1);
        expect(extracted.elements()[0]).toEqual(
            expect.objectContaining({ locator: { dataId: 'heading', cssSelector: undefined } }),
        );
        expect(extracted.candidates).toBe(2);
        expect(extracted.limitReached).toBe(true);
    });
});

function createContainerTree(nextId: () => number, locatorCreator: ElementLocatorCreator) {
    const containers = extractContainerElements(window, document.body, nextId, locatorCreator);
    return new ContainerTree(document.body, containers);
}
