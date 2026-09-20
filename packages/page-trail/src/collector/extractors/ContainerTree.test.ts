import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ContainerElement, ContainerTreeNode } from '../../types';
import { markVisible, resetDocument } from '../../../test/domUtils';
import { containerElement, containerNode, type ContainerNodeFixture } from '../../../test/fixtures';
import { ElementLocatorCreator } from '../ElementLocatorCreator';
import { ContainerTree } from './ContainerTree';
import { extractContainerElements } from './container';
import { nextIdGenerator } from '../../utils/nextId';

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
        // Given
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

        // When
        const tree = createTree();

        // Then
        expect(toContainerNodeFixture(tree.structure)).toEqual([
            containerNode(
                containerElement({
                    locator: { dataId: 'main', cssSelector: undefined },
                    role: 'main content',
                    type: 'landmark',
                    tag: 'main',
                    labels: [{ source: 'aria-label', value: 'Dashboard' }],
                }),
                [
                    containerNode(
                        containerElement({
                            locator: { dataId: 'overview', cssSelector: undefined },
                            role: 'section',
                            type: 'section',
                            tag: 'section',
                            labels: [{ source: 'aria-label', value: 'Overview' }],
                        }),
                        [
                            containerNode(
                                containerElement({
                                    locator: { dataId: 'feature', cssSelector: undefined },
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
                            locator: { dataId: 'nav', cssSelector: undefined },
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
        // Given
        document.body.innerHTML = `
            <main id="main">
                <div class="layout">
                    <section id="wrapped" aria-label="Wrapped section"></section>
                </div>
            </main>
        `;
        markVisible('#main', containerRect);
        markVisible('#wrapped', containerRect);

        // When
        const tree = createTree();

        // Then
        expect(toContainerNodeFixture(tree.structure)).toEqual([
            containerNode(
                containerElement({
                    locator: { dataId: 'main', cssSelector: undefined },
                    role: 'main content',
                    type: 'landmark',
                    tag: 'main',
                    labels: [],
                }),
                [
                    containerNode(
                        containerElement({
                            locator: { dataId: 'wrapped', cssSelector: undefined },
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
        // Given
        document.body.innerHTML = `
            <div id="root">
                <header id="header"></header>
                <main id="main"></main>
            </div>
        `;
        markVisible('#header', containerRect);
        markVisible('#main', containerRect);

        // When
        const tree = createTree(document.querySelector('#root')!);

        // Then
        expect(toContainerNodeFixture(tree.structure)).toEqual([
            containerNode(
                containerElement({
                    locator: { dataId: 'header', cssSelector: undefined },
                    role: 'header',
                    type: 'landmark',
                    tag: 'header',
                    labels: [],
                }),
            ),
            containerNode(
                containerElement({
                    locator: { dataId: 'main', cssSelector: undefined },
                    role: 'main content',
                    type: 'landmark',
                    tag: 'main',
                    labels: [],
                }),
            ),
        ]);
    });

    it('includes supported ARIA containers and skips unsupported roles', () => {
        // Given
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

        // When
        const tree = createTree();

        // Then
        expect(toContainerNodeFixture(tree.structure)[0]?.nodes).toEqual([
            containerNode(
                containerElement({
                    locator: { dataId: 'announcements', cssSelector: undefined },
                    role: 'region',
                    type: 'section',
                    tag: 'div',
                    labels: [{ source: 'aria-label', value: 'Announcements' }],
                }),
                [],
            ),
            containerNode(
                containerElement({
                    locator: { dataId: 'toolbar', cssSelector: undefined },
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
        // Given
        document.body.innerHTML = `
            <header id="header" aria-label="Site header"></header>
            <main id="main" aria-label="Content"></main>
        `;
        markVisible('#header', containerRect);
        markVisible('#main', containerRect);

        // When
        const tree = createTree();

        // Then
        expect(toContainerNodeFixture(tree.structure)).toEqual([
            containerNode(
                containerElement({
                    locator: { dataId: 'header', cssSelector: undefined },
                    role: 'header',
                    type: 'landmark',
                    tag: 'header',
                    labels: [{ source: 'aria-label', value: 'Site header' }],
                }),
            ),
            containerNode(
                containerElement({
                    locator: { dataId: 'main', cssSelector: undefined },
                    role: 'main content',
                    type: 'landmark',
                    tag: 'main',
                    labels: [{ source: 'aria-label', value: 'Content' }],
                }),
            ),
        ]);
    });

    it('collects visible containers in DOM order with meaning scores', () => {
        // Given
        document.body.innerHTML = `
            <main id="main">
                <section id="section"></section>
                <nav id="nav"></nav>
            </main>
        `;
        markVisible('#main', containerRect);
        markVisible('#section', containerRect);
        markVisible('#nav', containerRect);

        // When
        const containers = createContainers();

        // Then
        expect(containers.elements().map((el) => el.locator.dataId)).toEqual(['main', 'section', 'nav']);
        containers.elements().forEach((el) => {
            expect(el).not.toHaveProperty('importanceScore');
            expect(el.meaningScore.value).toBeGreaterThanOrEqual(0);
            expect(el.meaningScore.value).toBeLessThanOrEqual(1);
        });
    });

    it('returns container references from the nearest ancestor to the root', () => {
        // Given
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

        // When
        const path = tree.getPathToRoot(document.querySelector('#button')!);

        // Then
        expect(path.map((container) => container.locator.dataId)).toEqual(['form', 'main']);
        expect(path[0]).toBe(tree.structure[0]!.nodes[0]!.container);
        expect(path[1]).toBe(tree.structure[0]!.container);
    });

    it('builds a container node path from an element to the root in reverse order', () => {
        // Given
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

        // When
        const path = getPathToRoot(tree, document.querySelector('#button')!);

        // Then
        expect(path.map((container) => container.locator.dataId)).toEqual(['article', 'section', 'main']);
    });

    it('keeps using the extracted container tree after finding the nearest path node', () => {
        // Given
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

        // When
        const path = getPathToRoot(tree, document.querySelector('#button')!);

        // Then
        expect(path.map((container) => container.locator.dataId)).toEqual(['article', 'section', 'main']);
    });

    it('starts from the parent when building a path from an extracted container', () => {
        // Given
        document.body.innerHTML = `
            <main id="main">
                <section id="section"></section>
            </main>
        `;
        markVisible('#main', containerRect);
        markVisible('#section', containerRect);

        const tree = createTree();

        // When
        const path = getPathToRoot(tree, document.querySelector('#section')!);

        // Then
        expect(path.map((container) => container.locator.dataId)).toEqual(['main']);
    });

    it('returns an empty container node path for elements outside the tree root', () => {
        // Given
        document.body.innerHTML = `
            <main id="main"></main>
            <aside id="outside"></aside>
        `;
        markVisible('#main', containerRect);
        markVisible('#outside', containerRect);

        const tree = createTree(document.querySelector('#main')!);

        // When
        const path = getPathToRoot(tree, document.querySelector('#outside')!);

        // Then
        expect(path).toEqual([]);
    });

    it('returns an empty container node path for the tree root itself', () => {
        // Given
        document.body.innerHTML = `
            <main id="main">
                <section id="section"></section>
            </main>
        `;
        markVisible('#section', containerRect);

        const root = document.querySelector('#main')!;
        const tree = createTree(root);

        // When
        const path = getPathToRoot(tree, root);

        // Then
        expect(path).toEqual([]);
    });
});

function createTree(root: Element = document.body) {
    return new ContainerTree(root, createContainers(root));
}

function createContainers(root: Element = document.body) {
    return extractContainerElements(window, root, nextIdGenerator(), new ElementLocatorCreator((el) => el.id));
}

function getPathToRoot(tree: ContainerTree, el: Element): ContainerElement[] {
    return tree.getPathToRoot(el);
}

function toContainerNodeFixture(nodes: ContainerTreeNode[]): ContainerNodeFixture[] {
    return nodes.map((node) =>
        containerNode(
            containerElement({
                locator: node.container.locator,
                kind: node.container.kind,
                role: node.container.role,
                type: node.container.type,
                tag: node.container.tag,
                labels: node.container.labels,
            }),
            toContainerNodeFixture(node.nodes),
        ),
    );
}
