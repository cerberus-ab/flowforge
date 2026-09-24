import { afterEach, describe, expect, it, vi } from 'vitest';

import { markHidden, markVisible, resetDocument, setViewport } from '../../test/domUtils';
import { type CollectorOptions, PageTrailCollector } from './PageTrailCollector';

afterEach(() => {
    resetDocument();
    vi.restoreAllMocks();
});

describe('PageTrailCollector', () => {
    it('keeps unique record IDs and shares locators for the same DOM element', () => {
        // Given
        document.body.innerHTML = `<main id="main"><p id="action" role="button">Open settings</p></main>`;
        markVisible('#main');
        markVisible('#action');
        const getElementDataId = vi.fn((el: Element) => `locator-${el.id}`);

        // When
        const model = collect({ getElementDataId });

        // Then
        const containers = model.mapStructureTree((node) => ('container' in node ? [node.container] : [])).flat();
        const contentElements = model.getContent();
        const interactiveElements = model.getInteractive();
        expect(containers).toHaveLength(1);
        expect(contentElements).toHaveLength(1);
        expect(interactiveElements).toHaveLength(1);
        const container = containers[0]!;
        const content = contentElements[0]!;
        const interactive = interactiveElements[0]!;
        expect(container.id).toBeTypeOf('number');
        expect(content.id).toBeTypeOf('number');
        expect(interactive.id).not.toBe(content.id);
        expect(content.id).not.toBe(container.id);
        expect(content.locator).toEqual({ dataId: 'locator-action', cssSelector: undefined });
        expect(interactive.locator).toBe(content.locator);
        expect(content.context.path[0]?.container).toBe(container);
        expect(interactive.context.path[0]?.container).toBe(container);
        expect(model.getStructure().nodes[0]?.content).toEqual([content]);
        expect(model.getStructure().nodes[0]?.interactive).toEqual([interactive]);
        expect(model.getStructure().content).toEqual([]);
        expect(model.getStructure().interactive).toEqual([]);
        expect(getElementDataId).toHaveBeenCalledTimes(2);
        expect(getElementDataId).toHaveBeenCalledWith(document.querySelector('#main'));
        expect(getElementDataId).toHaveBeenCalledWith(document.querySelector('#action'));
    });

    it('collects page basics', () => {
        // Given
        document.documentElement.lang = 'en';
        document.head.innerHTML = `<meta name="description" content="Page description" />`;
        document.title = 'Test page';

        setViewport({ width: 1024, height: 768, scrollY: 100, scrollHeight: 2000 });

        // When
        const model = collect();

        // Then
        expect(model.basics).toEqual({
            url: 'http://localhost:3000/',
            title: 'Test page',
            description: 'Page description',
            language: 'en',
            viewport: {
                width: 1024,
                height: 768,
                scrollY: 100,
                scrollHeight: 2000,
            },
        });
        expect(model.metadata.collectedAt).toBeTypeOf('number');
        expect(model.metadata.performance.totalMs).toBeTypeOf('number');
    });

    it('normalizes page basics text', () => {
        // Given
        document.documentElement.lang = ' en ';
        document.head.innerHTML = `<meta name="description" content=" Page   description " />`;
        document.title = ' Test   page ';

        // When
        const model = collect();

        // Then
        expect(model.basics).toEqual(
            expect.objectContaining({
                title: 'Test page',
                description: 'Page description',
                language: 'en',
            }),
        );
    });

    it('collects visible content elements', () => {
        // Given
        document.body.innerHTML = `
            <main>
                <h1 id="title">Welcome</h1>
                <p id="intro">Useful paragraph text</p>
                <p id="short">No</p>
            </main>
        `;
        markVisible('#title');
        markVisible('#intro');
        markVisible('#short');

        // When
        const model = collect();

        // Then
        expect(model.getContent()).toEqual(
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
        expect(model.getContent().some((el) => el.locator!.dataId === 'short')).toBeFalsy();
    });

    it('collects visible interactive elements', () => {
        // Given
        document.body.innerHTML = `
            <main>
                <button id="save" aria-label="Save changes">💾</button>
                <a id="docs" href="/docs">Docs</a>
                <input id="email" placeholder="Email" />
            </main>
        `;
        markVisible('#save');
        markVisible('#docs');
        markVisible('#email');

        // When
        const model = collect();

        // Then
        expect(model.getInteractive()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    kind: 'interactive',
                    type: 'button',
                    role: 'button',
                    locator: { dataId: 'save', cssSelector: undefined },
                    labels: [{ source: 'aria-label', value: 'Save changes' }],
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
    });

    it('skips hidden and sensitive interactive elements', () => {
        // Given
        document.body.innerHTML = `
            <button id="visible">Visible action</button>
            <button id="hidden">Hidden action</button>
            <input id="password" type="password" />
        `;
        markVisible('#visible');
        markHidden('#hidden');
        markVisible('#password');

        // When
        const model = collect();

        // Then
        expect(model.getInteractive().map((el) => el.locator!.dataId)).toEqual(['visible']);
    });

    it('applies content and interactive limits after scoring', () => {
        // Given
        document.body.innerHTML = `
            <main>
                <h1 id="heading">Important heading</h1>
                <p id="paragraph">Regular paragraph text</p>
                <button id="button">Submit</button>
                <a id="link" href="/docs">Docs</a>
            </main>
        `;
        markVisible('#heading');
        markVisible('#paragraph');
        markVisible('#button');
        markVisible('#link');

        // When
        const model = collect({
            contentElementsLimit: 1,
            interactiveElementsLimit: 1,
        });

        // Then
        expect(model.getContent()).toHaveLength(1);
        expect(model.getContent()[0]).toEqual(
            expect.objectContaining({ locator: { dataId: 'heading', cssSelector: undefined } }),
        );
        expect(model.getInteractive()).toHaveLength(1);
        expect(model.getInteractive()[0]).toEqual(
            expect.objectContaining({ locator: { dataId: 'button', cssSelector: undefined } }),
        );
    });

    it('reports container metadata without scoring limit totals', () => {
        // Given
        document.body.innerHTML = `
            <main id="main">
                <section id="section"></section>
            </main>
        `;
        markVisible('#main');
        markVisible('#section');

        // When
        const model = collect();

        // Then
        expect(model.metadata.containerElements).toBe(2);
        expect(model.metadata.containerElementsMaxDepth).toBe(2);
        expect(model.metadata).not.toHaveProperty('containerElementsTotal');
        expect(model.metadata).not.toHaveProperty('containerElementsLimitReached');
        expect(
            model.mapStructureTree((node) => ('container' in node ? node.container : undefined))[1],
        ).not.toHaveProperty('importanceScore');
    });

    it('keeps locator cssSelector undefined while CSS selectors are unsupported', () => {
        // Given
        document.body.innerHTML = `<button id="save">Save</button>`;
        markVisible('#save');

        // When
        const model = PageTrailCollector.collectFor(window, document, {
            getElementDataId: (el) => el.id,
        });

        // Then
        expect(model.getInteractive()[0]).toEqual(
            expect.objectContaining({ locator: { dataId: 'save', cssSelector: undefined } }),
        );
    });

    it('collectFor returns a collected page trail', () => {
        // Given
        document.body.innerHTML = `<button id="save">Save</button>`;
        markVisible('#save');

        // When
        const model = PageTrailCollector.collectFor(window, document, {
            getElementDataId: (el) => el.id,
        });

        // Then
        expect(model.contextOnly).toBe(false);
        expect(model.getInteractive()).toHaveLength(1);
        expect(model.getInteractive()[0]).toEqual(
            expect.objectContaining({ locator: { dataId: 'save', cssSelector: undefined } }),
        );
    });

    it('collects context without DOM locators', () => {
        // Given
        document.body.innerHTML = `<main id="main"><button id="save">Save</button></main>`;
        markVisible('#main');
        markVisible('#save');

        // When
        const model = PageTrailCollector.collectFor(window, document, { contextOnly: true });

        // Then
        expect(model.contextOnly).toBe(true);
        const elements = [
            ...model.mapStructureTree((node) => ('container' in node ? [node.container] : [])).flat(),
            ...model.getContent(),
            ...model.getInteractive(),
        ];
        expect(elements).not.toHaveLength(0);
        expect(elements.every((element) => element.locator === undefined)).toBe(true);
    });
});

type CollectOptions = Partial<
    Pick<CollectorOptions, 'contentElementsLimit' | 'interactiveElementsLimit' | 'getElementDataId'>
>;

function collect(options: CollectOptions = {}) {
    return new PageTrailCollector(window, document, {
        getElementDataId: (el) => el.id,
        ...options,
    }).collect();
}
