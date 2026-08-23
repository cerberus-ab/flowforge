import type {
    ContainerElement,
    ContainerTreeNode,
    ContainerPathNode,
    ContentElement,
    InteractiveElement,
} from '../../types/index.ts';

import { getContainerElementLabels } from './primitive/label.ts';
import { getContainerRole, roleToContainerElementType } from './primitive/role.ts';
import { SELECTOR_CONTAINER } from '../selectors.ts';
import { getElementBoundingBox, isElementVisible } from './primitive/view.ts';
import type { ElementRegistry } from '../ElementRegistry.ts';
import { getCssSelector } from './primitive/selector.ts';
import {
    scoreContainerMeaning,
    scoreContainerRelevanceForContentTarget,
    scoreContainerRelevanceForInteractiveTarget,
    type ScoringResult,
} from '../scoring/index.ts';

// constants
const CONTAINER_MIN_AREA = 20 * 20;

export type ContentTargetForPath = Pick<ContentElement, 'type'>;
export type InteractiveTargetForPath = Pick<InteractiveElement, 'role' | 'type'>;

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
    private readonly nodeByEl = new WeakMap<Element, ContainerTreeNode>();
    // Internal reverse edges keep the public tree shape acyclic and serializable.
    private readonly parentByNode = new WeakMap<ContainerTreeNode, ContainerTreeNode>();

    readonly elements: ContainerElement[] = [];
    readonly nodes: ContainerTreeNode[] = [];

    constructor(win: Window, root: Element, elementRegistry: ElementRegistry) {
        this.window = win;
        this.root = root;
        this.elementRegistry = elementRegistry;

        this.collectElements();
        this.buildTree();
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
     */
    private collectElements(): void {
        for (const el of Array.from(this.root.querySelectorAll(SELECTOR_CONTAINER))) {
            // skip hidden containers
            if (!isElementVisible(el, this.window)) continue;
            // skip containers with no resolved role
            const role = getContainerRole(el);
            if (!role) continue;
            // skip containers with no resolved type
            const type = roleToContainerElementType(role);
            if (!type) continue;
            // skip too small container area
            const bbox = getElementBoundingBox(el);
            if (bbox.width * bbox.height < CONTAINER_MIN_AREA) continue;

            const labels = getContainerElementLabels(el);

            const containerElement: ContainerElement = {
                role,
                type,
                dataId: this.elementRegistry.register(el),
                cssSelector: getCssSelector(el),
                tag: el.tagName.toLowerCase(),
                kind: 'container',
                labels,
                bbox,
                meaningScore: scoreContainerMeaning({ role, type, labels, bbox }),
            };
            this.elements.push(containerElement);
        }
    }

    /**
     * Build the nested container tree from extracted container elements
     *
     * Preserves DOM order and attaches each extracted container to the nearest
     * extracted ancestor. Unsupported wrapper elements are skipped by walking
     * up the DOM until an extracted ancestor container is found.
     *
     */
    private buildTree() {
        // collect node by element map
        this.elements.forEach((containerElement) => {
            const el = this.elementRegistry.get(containerElement.dataId);
            if (!el) return;

            this.nodeByEl.set(el, { element: containerElement, nodes: [] });
        });

        // connect ancestors though the map
        this.elements.forEach((containerElement) => {
            const el = this.elementRegistry.get(containerElement.dataId);
            if (!el) return;

            const node = this.nodeByEl.get(el);
            if (!node) return;

            const parent = this.getParentNode(el);
            if (parent) {
                parent.nodes.push(node);
                // Keep the reverse edge in sync with the child attachment.
                this.parentByNode.set(node, parent);
            } else {
                this.nodes.push(node);
            }
        });
    }

    private getParentNode(el: Element): ContainerTreeNode | undefined {
        if (!this.root.contains(el)) return undefined;

        let current = el.parentElement;
        while (current) {
            const parent = this.nodeByEl.get(current);
            if (parent) return parent;
            if (current === this.root) return undefined;
            current = current.parentElement;
        }
        return undefined;
    }

    private getPathToRoot(el: Element): ContainerTreeNode[] {
        if (!this.root.contains(el)) return [];

        const path: ContainerTreeNode[] = [];
        let current = el.parentElement;
        while (current) {
            const node = this.nodeByEl.get(current);
            if (node) {
                path.push(node);
                // After the nearest container is found, follow tree parents instead of the DOM.
                let parent = this.parentByNode.get(node);
                while (parent) {
                    path.push(parent);
                    parent = this.parentByNode.get(parent);
                }
                return path;
            }
            if (current === this.root) break;
            current = current.parentElement;
        }
        return path;
    }

    private getTargetPath(
        el: Element,
        scoreRelevance: (node: ContainerTreeNode, distance: number) => ScoringResult,
    ): ContainerPathNode[] {
        return this.getPathToRoot(el).map((node, distance) => ({
            distance,
            element: node.element,
            relevanceScore: scoreRelevance(node, distance),
        }));
    }

    /**
     * Returns the semantic container path for a content target.
     *
     * The path starts with the nearest ancestor container and walks toward the
     * root. Each container is annotated with its distance from the target and a
     * relevance score calculated for the target content type.
     */
    getContentTargetPath(el: Element, target: ContentTargetForPath): ContainerPathNode[] {
        return this.getTargetPath(el, (node, distance) =>
            scoreContainerRelevanceForContentTarget({
                targetType: target.type,
                containerRole: node.element.role,
                containerType: node.element.type,
                containerMeaningScore: node.element.meaningScore.value,
                distance,
            }),
        );
    }

    /**
     * Returns the semantic container path for an interactive target.
     *
     * The path starts with the nearest ancestor container and walks toward the
     * root. Each container is annotated with its distance from the target and a
     * relevance score calculated for the target interactive role and type.
     */
    getInteractiveTargetPath(el: Element, target: InteractiveTargetForPath): ContainerPathNode[] {
        return this.getTargetPath(el, (node, distance) =>
            scoreContainerRelevanceForInteractiveTarget({
                targetRole: target.role,
                targetType: target.type,
                containerRole: node.element.role,
                containerType: node.element.type,
                containerMeaningScore: node.element.meaningScore.value,
                distance,
            }),
        );
    }

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
