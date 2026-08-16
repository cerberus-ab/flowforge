import { afterEach, describe, expect, it, vi } from 'vitest';

import { markVisible, resetDocument } from '../../../test/domUtils';
import { ElementRegistry } from '../ElementRegistry';
import { ContainerTree } from './ContainerTree';

afterEach(() => {
    resetDocument();
    vi.restoreAllMocks();
});

describe('ContainerTree', () => {
    it('builds a nested container tree in DOM order', () => {
        document.body.innerHTML = `
            <main id="main" aria-label="Dashboard">
                <section id="overview" aria-label="Overview">
                    <article id="feature" title="Feature card"></article>
                </section>
                <nav id="nav" aria-label="Primary navigation"></nav>
            </main>
        `;
        markVisible('#main');
        markVisible('#overview');
        markVisible('#feature');
        markVisible('#nav');

        const tree = createTree();

        expect(tree.nodes).toEqual([
            expect.objectContaining({
                dataId: 'main',
                kind: 'container',
                role: 'main content',
                type: 'landmark',
                tag: 'main',
                labels: [{ source: 'aria-label', value: 'Dashboard' }],
                nodes: [
                    expect.objectContaining({
                        dataId: 'overview',
                        role: 'section',
                        type: 'section',
                        tag: 'section',
                        labels: [{ source: 'aria-label', value: 'Overview' }],
                        nodes: [
                            expect.objectContaining({
                                dataId: 'feature',
                                role: 'article',
                                type: 'section',
                                tag: 'article',
                                labels: [{ source: 'title', value: 'Feature card' }],
                                nodes: [],
                            }),
                        ],
                    }),
                    expect.objectContaining({
                        dataId: 'nav',
                        role: 'navigation',
                        type: 'navigation',
                        tag: 'nav',
                        labels: [{ source: 'aria-label', value: 'Primary navigation' }],
                        nodes: [],
                    }),
                ],
            }),
        ]);
    });

    it('attaches supported descendants through unsupported wrapper elements', () => {
        document.body.innerHTML = `
            <main id="main">
                <div class="layout">
                    <section id="wrapped" aria-label="Wrapped section"></section>
                </div>
            </main>
        `;
        markVisible('#main');
        markVisible('#wrapped');

        const tree = createTree();

        expect(tree.nodes).toEqual([
            expect.objectContaining({
                dataId: 'main',
                role: 'main content',
                nodes: [
                    expect.objectContaining({
                        dataId: 'wrapped',
                        role: 'section',
                        labels: [{ source: 'aria-label', value: 'Wrapped section' }],
                    }),
                ],
            }),
        ]);
    });

    it('returns top-level nodes when the root is not a supported container', () => {
        document.body.innerHTML = `
            <div id="root">
                <header id="header"></header>
                <main id="main"></main>
            </div>
        `;
        markVisible('#header');
        markVisible('#main');

        const tree = createTree(document.querySelector('#root')!);

        expect(tree.nodes).toEqual([
            expect.objectContaining({ dataId: 'header', role: 'header', nodes: [] }),
            expect.objectContaining({ dataId: 'main', role: 'main content', nodes: [] }),
        ]);
    });

    it('includes supported ARIA containers and skips unsupported roles', () => {
        document.body.innerHTML = `
            <main id="main">
                <div id="announcements" role="region" aria-label="Announcements"></div>
                <div role="presentation">
                    <div id="toolbar" role="toolbar" aria-label="Editor toolbar"></div>
                </div>
            </main>
        `;
        markVisible('#main');
        markVisible('#announcements');
        markVisible('#toolbar');

        const tree = createTree();

        expect(tree.nodes[0].nodes).toEqual([
            expect.objectContaining({
                dataId: 'announcements',
                role: 'region',
                labels: [{ source: 'aria-label', value: 'Announcements' }],
                nodes: [],
            }),
            expect.objectContaining({
                dataId: 'toolbar',
                role: 'toolbar',
                labels: [{ source: 'aria-label', value: 'Editor toolbar' }],
                nodes: [],
            }),
        ]);
    });

    it('builds from document body', () => {
        document.body.innerHTML = `
            <header id="header" aria-label="Site header"></header>
            <main id="main" aria-label="Content"></main>
        `;
        markVisible('#header');
        markVisible('#main');

        const tree = ContainerTree.extractFor(window, document, createRegistry());

        expect(tree.nodes).toEqual([
            expect.objectContaining({
                dataId: 'header',
                role: 'header',
                labels: [{ source: 'aria-label', value: 'Site header' }],
            }),
            expect.objectContaining({
                dataId: 'main',
                role: 'main content',
                labels: [{ source: 'aria-label', value: 'Content' }],
            }),
        ]);
    });

    it('collects visible containers in DOM order without importance scores', () => {
        document.body.innerHTML = `
            <main id="main">
                <section id="section"></section>
                <nav id="nav"></nav>
            </main>
        `;
        markVisible('#main');
        markVisible('#section');
        markVisible('#nav');

        const tree = createTree();

        expect(tree.elements.map((el) => el.dataId)).toEqual(['main', 'section', 'nav']);
        tree.elements.forEach((el) => {
            expect(el).not.toHaveProperty('importanceScore');
        });
    });
});

function createTree(root: Element = document.body) {
    return new ContainerTree(window, root, createRegistry());
}

function createRegistry() {
    return new ElementRegistry((el) => el.id);
}
