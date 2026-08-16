export function getCssSelector(el: Element): string | undefined {
    void el;
    // CSS selector is currently unsupported and is used only as a fallback.
    // The previous "css-selector-generator" based implementation had a dramatic
    // performance impact during collection, so keep it disabled for now.
    return undefined;
}
