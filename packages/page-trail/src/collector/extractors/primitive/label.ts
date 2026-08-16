import { dedupeBy, normalizeText } from '../../../utils/index.ts';
import type { ContainerElementLabel, InteractiveElementLabel } from '../../../types/index.ts';
import { getContainerHeading } from './heading.ts';

/**
 * Resolves the `aria-labelledby` attribute of an element into a normalized label string.
 *
 * Each referenced ID is looked up in the document, its text content is collected,
 * whitespace is normalized, empty parts are removed, and the remaining parts are
 * joined with a single space.
 *
 * @param el - The DOM element whose `aria-labelledby` attribute should be resolved.
 * @returns The resolved label text, or `undefined` when the attribute is missing.
 */
export function getElementAttrAriaLabelledBy(el: Element): string | undefined {
    const ariaLabelledBy = el.getAttribute('aria-labelledby');
    if (!ariaLabelledBy) return undefined;

    return ariaLabelledBy
        .split(/\s+/)
        .map((id) => el.ownerDocument.getElementById(id)?.textContent)
        .map((part) => normalizeText(part ?? ''))
        .filter(Boolean)
        .join(' ');
}

/**
 * Extracts human-readable labels for a semantic container.
 *
 * Sources are evaluated in priority order:
 * 1. `aria-labelledby` (resolved to text content)
 * 2. `aria-label`
 * 3. direct child `<legend>`
 * 4. owned heading
 * 5. `title`
 *
 * Labels are deduplicated case-insensitively and whitespace is normalized.
 *
 * @param el - Target container element.
 * @returns Array of container labels in priority order, or an empty array when no labels are found.
 */
export function getContainerElementLabels(el: Element): ContainerElementLabel[] {
    const labels: ContainerElementLabel[] = [];

    // 1. aria-labelledby
    const ariaLabelledBy = getElementAttrAriaLabelledBy(el);
    if (ariaLabelledBy) {
        labels.push({ value: ariaLabelledBy, source: 'aria-labelledby' });
    }
    // 2. aria-label
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) {
        labels.push({ value: normalizeText(ariaLabel), source: 'aria-label' });
    }
    // 3. legend
    const legend = Array.from(el.children).find((child) => child.tagName.toLowerCase() === 'legend');
    if (legend) {
        labels.push({ value: normalizeText(legend.textContent), source: 'legend' });
    }
    // 4. heading
    const heading = getContainerHeading(el);
    if (heading) {
        labels.push({ value: normalizeText(heading.textContent), source: 'heading' });
    }
    // 5. title
    const title = el.getAttribute('title');
    if (title) {
        labels.push({ value: normalizeText(title), source: 'title' });
    }
    return dedupeBy(
        labels.filter((l) => Boolean(l.value)),
        (l) => l.value.toLowerCase(),
    );
}

/**
 * Extracts human-readable labels for an interactive element from multiple sources.
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
 * @returns Array of `ElementAttrLabel` in priority order, or an empty array when no label text is found.
 */
export function getInteractiveElementLabels(el: Element): InteractiveElementLabel[] {
    const labels: InteractiveElementLabel[] = [];

    // 1. aria-labelledby
    const ariaLabelledBy = getElementAttrAriaLabelledBy(el);
    if (ariaLabelledBy) {
        labels.push({ value: ariaLabelledBy, source: 'aria-labelledby' });
    }
    // 2. aria-label
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) {
        labels.push({ value: normalizeText(ariaLabel), source: 'aria-label' });
    }
    // 3. <label for="...">
    if (el.id) {
        const escapedId = typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(el.id) : el.id;

        const labelFor = el.ownerDocument.querySelector(`label[for="${escapedId}"]`);
        if (labelFor) {
            labels.push({ value: normalizeText(labelFor.textContent), source: 'label-for' });
        }
    }
    // 4. wrapping <label>
    const parentLabel = el.closest?.('label');
    if (parentLabel) {
        labels.push({ value: normalizeText(parentLabel.textContent), source: 'label-wrapper' });
    }
    // 5. value
    if ('value' in el) {
        labels.push({
            value: normalizeText((el as HTMLInputElement | HTMLButtonElement).value),
            source: 'value',
        });
    }
    // 6. placeholder
    if ('placeholder' in el) {
        labels.push({
            value: normalizeText((el as HTMLInputElement | HTMLTextAreaElement).placeholder),
            source: 'placeholder',
        });
    }
    // 7. alt
    const alt = el.getAttribute('alt');
    if (alt) {
        labels.push({ value: normalizeText(alt), source: 'alt' });
    }
    // 8. title
    const title = el.getAttribute('title');
    if (title) {
        labels.push({ value: normalizeText(title), source: 'title' });
    }
    // 9. name
    if ('name' in el) {
        labels.push({
            value: normalizeText((el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).name),
            source: 'name',
        });
    }
    return dedupeBy(
        labels.filter((l) => Boolean(l.value)),
        (l) => l.value.toLowerCase(),
    );
}
