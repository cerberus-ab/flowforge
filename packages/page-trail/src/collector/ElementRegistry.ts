import type { ElementId } from '../types/index.ts';

// Contains the map of all used DOM elements
export class ElementRegistry {
    private nextId = 0;

    private readonly elementById = new Map<ElementId, Element>();
    private readonly idByElement = new WeakMap<Element, ElementId>();

    register(el: Element): ElementId {
        const existingId = this.idByElement.get(el);
        if (existingId !== undefined) return existingId;

        const id = this.nextId++;

        this.elementById.set(id, el);
        this.idByElement.set(el, id);

        return id;
    }

    get(id: ElementId): Element | undefined {
        return this.elementById.get(id);
    }
}
