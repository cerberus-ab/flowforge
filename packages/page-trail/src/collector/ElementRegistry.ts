import type { ElementDataId } from '../types/index.ts';

export class ElementRegistry {
    private readonly elementByDataId = new Map<ElementDataId, Element>();

    constructor(private readonly produceDataId: (el: Element) => ElementDataId) {}

    register(el: Element): ElementDataId {
        const dataId = this.produceDataId(el);
        this.elementByDataId.set(dataId, el);
        return dataId;
    }

    get(dataId: ElementDataId): Element | undefined {
        return this.elementByDataId.get(dataId);
    }

    clear(): void {
        this.elementByDataId.clear();
    }
}
