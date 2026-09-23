import type { ElementDataId, ElementLocator } from '../types/index.ts';

export class ElementLocatorCreator {
    private readonly locatorByElement = new WeakMap<Element, ElementLocator>();

    constructor(private readonly produceDataId: (el: Element) => ElementDataId) {}

    createFor(el: Element): ElementLocator {
        const existingLocator = this.locatorByElement.get(el);
        if (existingLocator !== undefined) return existingLocator;

        const locator = {
            dataId: this.produceDataId(el),
            cssSelector: this.getCssSelector(el),
        };
        this.locatorByElement.set(el, locator);
        return locator;
    }

    private getCssSelector(el: Element): string | undefined {
        void el;
        // CSS selector is currently unsupported and is used only as a fallback.
        // The previous "css-selector-generator" based implementation had a dramatic
        // performance impact during collection, so keep it disabled for now.
        return undefined;
    }
}
