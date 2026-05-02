/**
 * Parses a boolean ARIA/HTML attribute from an element.
 *
 * @param el - The DOM element to read the attribute from
 * @param attr - The attribute name (e.g. "aria-expanded", "aria-checked")
 * @returns Parsed boolean value, or undefined if not present or not a valid boolean
 */
export function getElementBooleanAttribute(el: Element, attr: string): boolean | undefined {
    const value = el.getAttribute(attr);

    if (value === null) return undefined;

    const lowerValue = value.toLowerCase();
    if (lowerValue === 'true') return true;
    if (lowerValue === 'false') return false;
    return undefined;
}
