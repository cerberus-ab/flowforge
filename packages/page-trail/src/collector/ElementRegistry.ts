import type { ElementDataId } from '../types/index.ts';

export class ElementRegistry {
    private readonly elementByDataId = new Map<ElementDataId, Element>();
    private dataIdByElement = new WeakMap<Element, ElementDataId>();

    constructor(private readonly produceDataId: (el: Element) => ElementDataId) {}

    register(el: Element): ElementDataId {
        const existingDataId = this.dataIdByElement.get(el);
        if (existingDataId) return existingDataId;

        const dataId = this.produceDataId(el);
        this.elementByDataId.set(dataId, el);
        this.dataIdByElement.set(el, dataId);

        return dataId;
    }

    get(dataId: ElementDataId): Element | undefined {
        return this.elementByDataId.get(dataId);
    }
}
