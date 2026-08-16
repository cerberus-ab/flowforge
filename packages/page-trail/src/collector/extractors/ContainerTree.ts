import type { ContainerElement, ContainerTreeNode } from '../../types/index.ts';

import { getContainerElementLabels } from './primitive/label.ts';
import { getContainerRole, roleToContainerElementType } from './primitive/role.ts';
import { SELECTOR_CONTAINER } from '../selectors.ts';
import { getElementBoundingBox, isElementVisible } from './primitive/view.ts';
import type { ElementRegistry } from '../ElementRegistry.ts';
import { getCssSelector } from './primitive/selector.ts';

/**
 * Builds a semantic container hierarchy from a DOM subtree.
 *
 * The tree includes supported landmark, sectioning, dialog, form, table, and
 * ARIA container roles. Unsupported elements are ignored while their supported
 * descendants are attached to the nearest supported ancestor. Container
 * elements are preserved in DOM order and are not importance-scored or limited.
 */
export class ContainerTree {
    private readonly window: Window;
    private readonly root: Element;
    private readonly elementRegistry: ElementRegistry;

    readonly elements: ContainerElement[];
    readonly nodes: ContainerTreeNode[];

    constructor(win: Window, root: Element, elementRegistry: ElementRegistry) {
        this.window = win;
        this.root = root;
        this.elementRegistry = elementRegistry;

        this.elements = this.collectElements();
        this.nodes = this.buildTree();
    }

    /**
     * Builds a container tree from the document body.
     */
    static extractFor(win: Window, doc: Document, elementRegistry: ElementRegistry): ContainerTree {
        return new ContainerTree(win, doc.body, elementRegistry);
    }

    /**
     * Collect visible semantic container elements from the root subtree
     *
     * Scans supported native and ARIA container selectors, filters out hidden
     * or unsupported nodes, and returns structured metadata including locator
     * info, role, type, labels, and bounding box.
     *
     * @returns {ContainerElement[]} Extracted container elements.
     */
    private collectElements(): ContainerElement[] {
        const elements: ContainerElement[] = [];

        for (const el of Array.from(this.root.querySelectorAll(SELECTOR_CONTAINER))) {
            // skip hidden containers
            if (!isElementVisible(el, this.window)) continue;
            // skip containers with no resolved role
            const role = getContainerRole(el);
            if (!role) continue;
            // skip containers with no resolved type
            const type = roleToContainerElementType(role);
            if (!type) continue;

            elements.push({
                role,
                type,
                dataId: this.elementRegistry.register(el),
                cssSelector: getCssSelector(el),
                tag: el.tagName.toLowerCase(),
                kind: 'container',
                labels: getContainerElementLabels(el),
                bbox: getElementBoundingBox(el),
            });
        }
        return elements;
    }

    /**
     * Build the nested container tree from extracted container elements
     *
     * Preserves DOM order and attaches each extracted container to the nearest
     * extracted ancestor. Unsupported wrapper elements are skipped by walking
     * up the DOM until an extracted ancestor container is found.
     *
     * @returns A hierarchy of extracted container nodes.
     */
    private buildTree(): ContainerTreeNode[] {
        const nodes: ContainerTreeNode[] = [];

        const nodeByEl = new WeakMap<Element, ContainerTreeNode>();
        // finds the nearest extracted container node above an element.
        const getParentNode = (el: Element, root: Element): ContainerTreeNode | undefined => {
            let current = el.parentElement;

            while (current) {
                const parent = nodeByEl.get(current);
                if (parent) return parent;
                if (current === root) return undefined;
                current = current.parentElement;
            }
            return undefined;
        };

        // collect node by element map
        this.elements.forEach((containerElement) => {
            const el = this.elementRegistry.get(containerElement.dataId);
            if (!el) return;

            nodeByEl.set(el, { ...containerElement, nodes: [] });
        });

        // connect ancestors though the map
        this.elements.forEach((containerElement) => {
            const el = this.elementRegistry.get(containerElement.dataId);
            if (!el) return;

            const node = nodeByEl.get(el);
            if (!node) return;

            const parent = getParentNode(el, this.root);
            if (parent) {
                parent.nodes.push(node);
            } else {
                nodes.push(node);
            }
        });

        return nodes;
    }

    /**
     * Compute max depth for a container subtree
     *
     * Empty node arrays have depth 0. Leaf nodes have depth 1.
     *
     * @param nodes - Container nodes to inspect.
     * @returns Maximum nested depth.
     */
    private getMaxDepthR(nodes: ContainerTreeNode[]): number {
        if (nodes.length === 0) return 0;

        return Math.max(...nodes.map((node) => 1 + this.getMaxDepthR(node.nodes)));
    }

    /**
     * Compute max depth for the collected container tree
     *
     * @returns Maximum nested depth across all top-level container nodes.
     */
    getMathDepth(): number {
        return this.getMaxDepthR(this.nodes);
    }
}
