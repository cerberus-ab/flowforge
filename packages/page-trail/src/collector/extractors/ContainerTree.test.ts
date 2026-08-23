import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ContainerTreeNode } from '../../types';
import { markVisible, resetDocument } from '../../../test/domUtils';
import { containerElement, containerNode, type ContainerNodeFixture } from '../../../test/fixtures';
import { ElementRegistry } from '../ElementRegistry';
import { ContainerTree } from './ContainerTree';

const containerRect = {
    top: 0,
    left: 0,
    width: 100,
    height: 100,
    right: 100,
    bottom: 100,
    x: 0,
    y: 0,
    toJSON: () => {},
} as DOMRect;

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
        markVisible('#main', containerRect);
        markVisible('#overview', containerRect);
        markVisible('#feature', containerRect);
        markVisible('#nav', containerRect);

        const tree = createTree();

        expect(toContainerNodeFixture(tree.nodes)).toEqual([
            containerNode(
                containerElement({
                    dataId: 'main',
                    role: 'main content',
                    type: 'landmark',
                    tag: 'main',
                    labels: [{ source: 'aria-label', value: 'Dashboard' }],
                }),
                [
                    containerNode(
                        containerElement({
                            dataId: 'overview',
                            role: 'section',
                            type: 'section',
                            tag: 'section',
                            labels: [{ source: 'aria-label', value: 'Overview' }],
                        }),
                        [
                            containerNode(
                                containerElement({
                                    dataId: 'feature',
                                    role: 'article',
                                    type: 'section',
                                    tag: 'article',
                                    labels: [{ source: 'title', value: 'Feature card' }],
                                }),
                                [],
                            ),
                        ],
                    ),
                    containerNode(
                        containerElement({
                            dataId: 'nav',
                            role: 'navigation',
                            type: 'navigation',
                            tag: 'nav',
                            labels: [{ source: 'aria-label', value: 'Primary navigation' }],
                        }),
                        [],
                    ),
                ],
            ),
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
        markVisible('#main', containerRect);
        markVisible('#wrapped', containerRect);

        const tree = createTree();

        expect(toContainerNodeFixture(tree.nodes)).toEqual([
            containerNode(
                containerElement({
                    dataId: 'main',
                    role: 'main content',
                    type: 'landmark',
                    tag: 'main',
                    labels: [],
                }),
                [
                    containerNode(
                        containerElement({
                            dataId: 'wrapped',
                            role: 'section',
                            type: 'section',
                            tag: 'section',
                            labels: [{ source: 'aria-label', value: 'Wrapped section' }],
                        }),
                    ),
                ],
            ),
        ]);
    });

    it('returns top-level nodes when the root is not a supported container', () => {
        document.body.innerHTML = `
            <div id="root">
                <header id="header"></header>
                <main id="main"></main>
            </div>
        `;
        markVisible('#header', containerRect);
        markVisible('#main', containerRect);

        const tree = createTree(document.querySelector('#root')!);

        expect(toContainerNodeFixture(tree.nodes)).toEqual([
            containerNode(
                containerElement({
                    dataId: 'header',
                    role: 'header',
                    type: 'landmark',
                    tag: 'header',
                    labels: [],
                }),
            ),
            containerNode(
                containerElement({
                    dataId: 'main',
                    role: 'main content',
                    type: 'landmark',
                    tag: 'main',
                    labels: [],
                }),
            ),
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
        markVisible('#main', containerRect);
        markVisible('#announcements', containerRect);
        markVisible('#toolbar', containerRect);

        const tree = createTree();

        expect(toContainerNodeFixture(tree.nodes)[0]?.nodes).toEqual([
            containerNode(
                containerElement({
                    dataId: 'announcements',
                    role: 'region',
                    type: 'section',
                    tag: 'div',
                    labels: [{ source: 'aria-label', value: 'Announcements' }],
                }),
                [],
            ),
            containerNode(
                containerElement({
                    dataId: 'toolbar',
                    role: 'toolbar',
                    type: 'widget',
                    tag: 'div',
                    labels: [{ source: 'aria-label', value: 'Editor toolbar' }],
                }),
                [],
            ),
        ]);
    });

    it('builds from document body', () => {
        document.body.innerHTML = `
            <header id="header" aria-label="Site header"></header>
            <main id="main" aria-label="Content"></main>
        `;
        markVisible('#header', containerRect);
        markVisible('#main', containerRect);

        const tree = ContainerTree.extractFor(window, document, createRegistry());

        expect(toContainerNodeFixture(tree.nodes)).toEqual([
            containerNode(
                containerElement({
                    dataId: 'header',
                    role: 'header',
                    type: 'landmark',
                    tag: 'header',
                    labels: [{ source: 'aria-label', value: 'Site header' }],
                }),
            ),
            containerNode(
                containerElement({
                    dataId: 'main',
                    role: 'main content',
                    type: 'landmark',
                    tag: 'main',
                    labels: [{ source: 'aria-label', value: 'Content' }],
                }),
            ),
        ]);
    });

    it('collects visible containers in DOM order with meaning scores', () => {
        document.body.innerHTML = `
            <main id="main">
                <section id="section"></section>
                <nav id="nav"></nav>
            </main>
        `;
        markVisible('#main', containerRect);
        markVisible('#section', containerRect);
        markVisible('#nav', containerRect);

        const tree = createTree();

        expect(tree.elements.map((el) => el.dataId)).toEqual(['main', 'section', 'nav']);
        tree.elements.forEach((el) => {
            expect(el).not.toHaveProperty('importanceScore');
            expect(el.meaningScore.value).toBeGreaterThanOrEqual(0);
            expect(el.meaningScore.value).toBeLessThanOrEqual(1);
        });
    });

    it('adds target-specific relevance scores to container path nodes', () => {
        document.body.innerHTML = `
            <main id="main">
                <form id="form" aria-label="Payment">
                    <button id="button">Save</button>
                </form>
            </main>
        `;
        markVisible('#main', containerRect);
        markVisible('#form', containerRect);

        const tree = createTree();
        const path = tree.getInteractiveTargetPath(document.querySelector('#button')!, {
            role: 'button',
            type: 'button',
        });

        expect(path.map((node) => node.element.dataId)).toEqual(['form', 'main']);
        path.forEach((node) => {
            expect(node.relevanceScore.value).toBeGreaterThanOrEqual(0);
            expect(node.relevanceScore.value).toBeLessThanOrEqual(1);
            expect(node.relevanceScore).toHaveProperty('features');
        });
        expect(path[0]!.relevanceScore.value).toBeGreaterThan(path[1]!.relevanceScore.value);
    });

    it('builds a container node path from an element to the root in reverse order', () => {
        document.body.innerHTML = `
            <main id="main">
                <div class="layout">
                    <section id="section" aria-label="Section">
                        <article id="article">
                            <button id="button">Save</button>
                        </article>
                    </section>
                </div>
            </main>
        `;
        markVisible('#main', containerRect);
        markVisible('#section', containerRect);
        markVisible('#article', containerRect);

        const tree = createTree();
        const path = getPathToRoot(tree, document.querySelector('#button')!);

        expect(path.map((node) => node.element.dataId)).toEqual(['article', 'section', 'main']);
    });

    it('keeps using the extracted container tree after finding the nearest path node', () => {
        document.body.innerHTML = `
            <main id="main">
                <section id="section" aria-label="Section">
                    <article id="article">
                        <button id="button">Save</button>
                    </article>
                </section>
            </main>
        `;
        markVisible('#main', containerRect);
        markVisible('#section', containerRect);
        markVisible('#article', containerRect);

        const tree = createTree();
        document.querySelector('#main')!.append(document.querySelector('#article')!);

        const path = getPathToRoot(tree, document.querySelector('#button')!);

        expect(path.map((node) => node.element.dataId)).toEqual(['article', 'section', 'main']);
    });

    it('starts from the parent when building a path from an extracted container', () => {
        document.body.innerHTML = `
            <main id="main">
                <section id="section"></section>
            </main>
        `;
        markVisible('#main', containerRect);
        markVisible('#section', containerRect);

        const tree = createTree();

        expect(getPathToRoot(tree, document.querySelector('#section')!).map((node) => node.element.dataId)).toEqual([
            'main',
        ]);
    });

    it('returns an empty container node path for elements outside the tree root', () => {
        document.body.innerHTML = `
            <main id="main"></main>
            <aside id="outside"></aside>
        `;
        markVisible('#main', containerRect);
        markVisible('#outside', containerRect);

        const tree = createTree(document.querySelector('#main')!);

        expect(getPathToRoot(tree, document.querySelector('#outside')!)).toEqual([]);
    });

    it('returns an empty container node path for the tree root itself', () => {
        document.body.innerHTML = `
            <main id="main">
                <section id="section"></section>
            </main>
        `;
        markVisible('#section', containerRect);

        const root = document.querySelector('#main')!;
        const tree = createTree(root);

        expect(getPathToRoot(tree, root)).toEqual([]);
    });
});

function createTree(root: Element = document.body) {
    return new ContainerTree(window, root, createRegistry());
}

function createRegistry() {
    return new ElementRegistry((el) => el.id);
}

function getPathToRoot(tree: ContainerTree, el: Element): ContainerTreeNode[] {
    return (tree as unknown as { getPathToRoot(el: Element): ContainerTreeNode[] }).getPathToRoot(el);
}

function toContainerNodeFixture(nodes: ContainerTreeNode[]): ContainerNodeFixture[] {
    return nodes.map((node) =>
        containerNode(
            containerElement({
                dataId: node.element.dataId,
                kind: node.element.kind,
                role: node.element.role,
                type: node.element.type,
                tag: node.element.tag,
                labels: node.element.labels,
            }),
            toContainerNodeFixture(node.nodes),
        ),
    );
}
