import { afterEach, describe, expect, it, vi } from 'vitest';

import { markHidden, markVisible, resetDocument, setViewport } from '../../../test/domUtils';
import { ElementLocatorCreator } from '../ElementLocatorCreator';
import { extractPageBasics } from './basics';
import { ContainerTree } from './ContainerTree';
import { extractContainerElements } from './container';
import { extractInteractiveElements } from './interactive';
import { nextIdGenerator } from '../../utils/nextId';

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

        const nextId = nextIdGenerator();
        const locatorCreator = new ElementLocatorCreator((el) => el.id);
        const containerTree = createContainerTree(nextId, locatorCreator);

        // When
        const extracted = extractInteractiveElements(
            window,
            document.body,
            nextId,
            locatorCreator,
            extractPageBasics(window, document),
            containerTree,
            { elementsLimit: 0 },
        );

        // Then
        expect(extracted.elements()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    kind: 'interactive',
                    type: 'button',
                    role: 'button',
                    locator: { dataId: 'save', cssSelector: undefined },
                    labels: [{ source: 'aria-label', value: 'Save changes' }],
                    inViewport: true,
                    aboveTheFold: true,
                }),
                expect.objectContaining({
                    kind: 'interactive',
                    type: 'link',
                    role: 'link',
                    locator: { dataId: 'docs', cssSelector: undefined },
                    link: {
                        type: 'internal',
                        href: 'http://localhost:3000/docs',
                    },
                }),
                expect.objectContaining({
                    kind: 'interactive',
                    type: 'input',
                    role: 'textbox',
                    locator: { dataId: 'email', cssSelector: undefined },
                    labels: [{ source: 'placeholder', value: 'Email' }],
                }),
            ]),
        );
        expect(extracted.elements().map((el) => el.locator.dataId)).not.toContain('hidden');
        expect(extracted.elements().map((el) => el.locator.dataId)).not.toContain('password');

        extracted.elements().forEach((el) => {
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

        const nextId = nextIdGenerator();
        const locatorCreator = new ElementLocatorCreator((el) => el.id);
        const containerTree = createContainerTree(nextId, locatorCreator);

        // When
        const extracted = extractInteractiveElements(
            window,
            document.body,
            nextId,
            locatorCreator,
            extractPageBasics(window, document),
            containerTree,
            { elementsLimit: 1 },
        );

        // Then
        expect(extracted.elements()).toHaveLength(1);
        expect(extracted.elements()[0]).toEqual(
            expect.objectContaining({ locator: { dataId: 'button', cssSelector: undefined } }),
        );
        expect(extracted.candidates).toBe(2);
        expect(extracted.limitReached).toBe(true);
    });
});

function createContainerTree(nextId: () => number, locatorCreator: ElementLocatorCreator) {
    const containers = extractContainerElements(window, document.body, nextId, locatorCreator);
    return new ContainerTree(document.body, containers);
}
