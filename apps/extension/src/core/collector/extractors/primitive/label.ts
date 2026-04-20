import { normalizeText } from '#self/core/utils/text';
import { dedupeBy } from '#self/core/utils/array';
import type { ElementLabel } from '@flowforge/shared';

/**
 * Resolves the `aria-labelledby` attribute of an element into a normalized label string.
 *
 * Each referenced ID is looked up in the document, its text content is collected,
 * whitespace is normalized, empty parts are removed, and the remaining parts are
 * joined with a single space.
 *
 * @param el - The DOM element whose `aria-labelledby` attribute should be resolved.
 * @param doc - The document containing the referenced elements.
 * @returns The resolved label text, or `undefined` when the attribute is missing.
 */
export function getElementAttrAriaLabelledBy(el: Element, doc: Document): string | undefined {
    const ariaLabelledBy = el.getAttribute('aria-labelledby');
    if (!ariaLabelledBy) return undefined;

    return ariaLabelledBy
        .split(/\s+/)
        .map((id) => doc.getElementById(id)?.textContent)
        .map((part) => normalizeText(part ?? ''))
        .filter(Boolean)
        .join(' ');
}

/**
 * Extracts human-readable labels for a DOM element from multiple sources.
 *
 * Sources are evaluated in priority order:
 * 1. `aria-labelledby` (resolved to text content)
 * 2. `aria-label`
 * 3. `<label for="...">` matching the element's `id`
 * 4. Wrapping `<label>` ancestor
 * 5. `value` property
 * 6. `placeholder` property
 * 7. `alt` attribute
 * 8. `title` attribute
 * 9. `name` property
 *
 * Labels are deduplicated case-insensitively and whitespace is normalized.
 *
 * @param el - Target DOM element.
 * @param doc - Document containing the element.
 * @returns Array of `ElementAttrLabel` in priority order, or an empty array when no label text is found.
 */
export function getElementLabels(el: Element, doc: Document): ElementLabel[] {
    const elementLabels: ElementLabel[] = [];

    // 1. aria-labelledby
    const ariaLabelledBy = getElementAttrAriaLabelledBy(el, doc);
    if (ariaLabelledBy) {
        elementLabels.push({ value: ariaLabelledBy, source: 'aria-labelledby' });
    }
    // 2. aria-label
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) {
        elementLabels.push({ value: normalizeText(ariaLabel), source: 'aria-label' });
    }
    // 3. <label for="...">
    if (el.id) {
        const escapedId = typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(el.id) : el.id;

        const labelFor = doc.querySelector(`label[for="${escapedId}"]`);
        if (labelFor) {
            elementLabels.push({ value: normalizeText(labelFor.textContent), source: 'label-for' });
        }
    }
    // 4. wrapping <label>
    const parentLabel = el.closest?.('label');
    if (parentLabel) {
        elementLabels.push({ value: normalizeText(parentLabel.textContent), source: 'label-wrapper' });
    }
    // 5. value
    if ('value' in el) {
        elementLabels.push({
            value: normalizeText((el as HTMLInputElement | HTMLButtonElement).value),
            source: 'value',
        });
    }
    // 6. placeholder
    if ('placeholder' in el) {
        elementLabels.push({
            value: normalizeText((el as HTMLInputElement | HTMLTextAreaElement).placeholder),
            source: 'placeholder',
        });
    }
    // 7. alt
    const alt = el.getAttribute('alt');
    if (alt) {
        elementLabels.push({ value: normalizeText(alt), source: 'alt' });
    }
    // 8. title
    const title = el.getAttribute('title');
    if (title) {
        elementLabels.push({ value: normalizeText(title), source: 'title' });
    }
    // 9. name
    if ('name' in el) {
        elementLabels.push({
            value: normalizeText((el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).name),
            source: 'name',
        });
    }
    return dedupeBy(
        elementLabels.filter((l) => Boolean(l.value)),
        (l) => l.value.toLowerCase(),
    );
}
