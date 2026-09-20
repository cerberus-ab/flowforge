import type { ContainerElement, ContainerTreeNode } from '../../types/index.ts';
import type { ExtractedElements } from './ExtractedElements.ts';

/**
 * Builds a semantic container hierarchy from a DOM subtree.
 *
 * The tree includes supported landmark, sectioning, dialog, form, table, and
 * ARIA container roles. Unsupported elements are ignored while their supported
 * descendants are attached to the nearest supported ancestor. Container
 * elements are preserved in DOM order and are not importance-scored or limited.
 */
export class ContainerTree {
    private readonly root: Element;
    private readonly containers: ExtractedElements<ContainerElement>;

    private readonly nodeByEl = new WeakMap<Element, ContainerTreeNode>();
    private readonly parentByNode = new WeakMap<ContainerTreeNode, ContainerTreeNode>();

    readonly structure: ContainerTreeNode[] = [];

    constructor(root: Element, containers: ExtractedElements<ContainerElement>) {
        this.root = root;
        this.containers = containers;

        this.buildTree();
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
        for (const container of this.containers) {
            this.nodeByEl.set(container.el, { container: container.data, nodes: [] });
        }
        // connect ancestors though the map
        for (const container of this.containers) {
            const node = this.nodeByEl.get(container.el);
            if (!node) continue;

            const parent = this.getParentNode(container.el);
            if (parent) {
                parent.nodes.push(node);
                // keep the reverse edge in sync with the child attachment.
                this.parentByNode.set(node, parent);
            } else {
                this.structure.push(node);
            }
        }
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

    getPathToRoot(el: Element): ContainerElement[] {
        if (!this.root.contains(el)) return [];

        const path: ContainerElement[] = [];
        let current = el.parentElement;
        while (current) {
            const node = this.nodeByEl.get(current);
            if (node) {
                path.push(node.container);
                // after the nearest container is found, follow tree parents instead of the DOM.
                let parent = this.parentByNode.get(node);
                while (parent) {
                    path.push(parent.container);
                    parent = this.parentByNode.get(parent);
                }
                return path;
            }
            if (current === this.root) break;
            current = current.parentElement;
        }
        return path;
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
    getMaxDepth(): number {
        return this.getMaxDepthR(this.structure);
    }
}
