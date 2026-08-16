import { afterEach, describe, expect, it, vi } from 'vitest';

import { markHidden, markVisible, resetDocument, setViewport } from '../../test/domUtils';
import { PageTrailCollector } from './PageTrailCollector';

afterEach(() => {
    resetDocument();
    vi.restoreAllMocks();
});

describe('PageTrailCollector', () => {
    it('collects page basics', () => {
        document.documentElement.lang = 'en';
        document.head.innerHTML = `<meta name="description" content="Page description" />`;
        document.title = 'Test page';

        setViewport({ width: 1024, height: 768, scrollY: 100, scrollHeight: 2000 });

        const model = collect();

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
        document.documentElement.lang = ' en ';
        document.head.innerHTML = `<meta name="description" content=" Page   description " />`;
        document.title = ' Test   page ';

        const model = collect();

        expect(model.basics).toEqual(
            expect.objectContaining({
                title: 'Test page',
                description: 'Page description',
                language: 'en',
            }),
        );
    });

    it('collects visible content elements', () => {
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

        const model = collect();

        expect(model.content).toEqual(
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
        expect(model.content.some((el) => el.dataId === 'short')).toBeFalsy();
    });

    it('collects visible interactive elements', () => {
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

        const model = collect();

        expect(model.interactive).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    kind: 'interactive',
                    type: 'button',
                    role: 'button',
                    dataId: 'save',
                    cssSelector: undefined,
                    labels: [{ source: 'aria-label', value: 'Save changes' }],
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
    });

    it('skips hidden and sensitive interactive elements', () => {
        document.body.innerHTML = `
            <button id="visible">Visible action</button>
            <button id="hidden">Hidden action</button>
            <input id="password" type="password" />
        `;
        markVisible('#visible');
        markHidden('#hidden');
        markVisible('#password');

        const model = collect();

        expect(model.interactive.map((el) => el.dataId)).toEqual(['visible']);
    });

    it('applies content and interactive limits after scoring', () => {
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

        const model = collect({
            contentElementsLimit: 1,
            interactiveElementsLimit: 1,
        });

        expect(model.content).toHaveLength(1);
        expect(model.content[0]).toEqual(expect.objectContaining({ dataId: 'heading' }));
        expect(model.interactive).toHaveLength(1);
        expect(model.interactive[0]).toEqual(expect.objectContaining({ dataId: 'button' }));
    });

    it('reports container metadata without scoring limit totals', () => {
        document.body.innerHTML = `
            <main id="main">
                <section id="section"></section>
            </main>
        `;
        markVisible('#main');
        markVisible('#section');

        const model = collect();

        expect(model.metadata.containerElements).toBe(2);
        expect(model.metadata.containerMaxDepth).toBe(2);
        expect(model.metadata).not.toHaveProperty('containerElementsTotal');
        expect(model.metadata).not.toHaveProperty('containerElementsLimitReached');
        expect(model.container[0]).not.toHaveProperty('importanceScore');
    });

    it('keeps cssSelector undefined when css selector resolver is not configured', () => {
        document.body.innerHTML = `<button id="save">Save</button>`;
        markVisible('#save');

        const model = PageTrailCollector.collectFor(window, document, {
            getElementDataId: (el) => el.id,
        });

        expect(model.interactive[0]).toEqual(expect.objectContaining({ dataId: 'save', cssSelector: undefined }));
    });

    it('collectFor returns a collected page trail', () => {
        document.body.innerHTML = `<button id="save">Save</button>`;
        markVisible('#save');

        const model = PageTrailCollector.collectFor(window, document, {
            getElementDataId: (el) => el.id,
        });

        expect(model.interactive).toHaveLength(1);
        expect(model.interactive[0]).toEqual(expect.objectContaining({ dataId: 'save' }));
    });
});

function collect(options: Partial<ConstructorParameters<typeof PageTrailCollector>[2]> = {}) {
    return new PageTrailCollector(window, document, {
        getElementDataId: (el) => el.id,
        ...options,
    }).collect();
}
