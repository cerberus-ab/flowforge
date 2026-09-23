import type { BaseElement } from '../../types/index.ts';

export interface ExtractedElement<T extends BaseElement> {
    el: Element;
    data: T;
}

export class ExtractedElements<T extends BaseElement> {
    constructor(
        private readonly data: ExtractedElement<T>[],
        readonly matched: number,
        readonly candidates: number,
        readonly limitReached: boolean = false,
    ) {}

    elements(): T[] {
        return this.data.map((ee) => ee.data);
    }

    get length(): number {
        return this.data.length;
    }

    [Symbol.iterator](): ArrayIterator<ExtractedElement<T>> {
        return this.data[Symbol.iterator]();
    }
}
