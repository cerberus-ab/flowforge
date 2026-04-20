import type { BaseElement, ContainerElementRole, ContentElement, InteractiveElement } from '@flowforge/shared';

const formatSeparator = {
    PARTS: '. ',
    VALUES: '; ',
    ELEMENTS: ' | ',
    PATH: ' > ',
} as const;

type FormatSeparator = (typeof formatSeparator)[keyof typeof formatSeparator];

function formatConcat(contents: string[], separator: FormatSeparator): string {
    return contents.join(separator);
}

// [in section "Pricing", inside "main content"]
function formatElementContext(el: BaseElement): string[] {
    const parts: string[] = [];

    if (el.context.sectionName) {
        parts.push(`in section "${el.context.sectionName}"`);
    }
    if (el.context.path.length > 0) {
        parts.push(`inside "${formantElementContextPath(el.context.path)}"`);
    }
    return parts;
}

// button, internal link, searchbox, text input, etc.
function formatInteractiveElementKind(el: InteractiveElement): string {
    switch (el.role) {
        case 'button':
            return 'button';
        case 'link':
            switch (el.link?.type) {
                case 'internal':
                    return 'internal link';
                case 'external':
                    return 'external link';
                case 'anchor':
                    return 'anchor link';
                case 'mailto':
                    return 'email link';
                case 'tel':
                    return 'phone link';
                default:
                    return 'link';
            }
        case 'searchbox':
            return 'searchbox';
        case 'textbox':
            return 'text input';
        case 'checkbox':
            return 'checkbox';
        case 'radio':
            return 'radio input';
        case 'slider':
            return 'slider';
        case 'combobox':
            return 'combobox';
        case 'listbox':
            return 'listbox';
        case 'dialog':
            return 'dialog control';
        default:
            return 'interactive element';
    }
}

// click action, text input, selection control, adjustable control, etc.
function formatInteractiveElementActionHint(el: InteractiveElement): string {
    switch (el.role) {
        case 'button':
        case 'link':
            return 'click action';
        case 'textbox':
        case 'searchbox':
            return 'text input';
        case 'checkbox':
        case 'radio':
        case 'combobox':
        case 'listbox':
            return 'selection control';
        case 'slider':
            return 'adjustable control';
        default:
            return 'interactive action';
    }
}

// name "Log in; Sign up"
function formatInteractiveElementName(el: InteractiveElement): string | null {
    const values = [...new Set([...el.labels.map((label) => label.value), el.text ?? ''].filter(Boolean))];

    if (values.length === 0) return null;
    return `name "${formatConcat(values, formatSeparator.VALUES)}"`;
}

// [disabled, readonly, required, etc.]
function formatInteractiveElementState(el: InteractiveElement): string[] {
    const parts: string[] = [];

    if (el.state.disabled) parts.push('disabled');
    if (el.state.readonly) parts.push('readonly');
    if (el.state.required) parts.push('required');
    if (el.state.checked) parts.push('checked');
    if (el.state.selected) parts.push('selected');
    if (el.state.expanded) parts.push('expanded');
    if (el.state.pressed) parts.push('pressed');
    if (el.state.hidden) parts.push('hidden');
    return parts;
}

// [visible on initial screen, currently visible]
function formatInteractiveElementVisibility(el: InteractiveElement): string[] {
    const parts: string[] = [];

    if (el.aboveTheFold) {
        parts.push('visible on initial screen');
    } else if (el.inViewport) {
        parts.push('currently visible');
    }
    return parts;
}

// Exports

export function formatContentElementShort(el: ContentElement, textOverride?: string) {
    return formatConcat([el.tag, textOverride ?? el.text], formatSeparator.PARTS);
}

export function formatInteractiveElementShort(el: InteractiveElement) {
    const anchor = el.labels[0]?.value ?? el.text;
    return anchor ? formatConcat([el.role, anchor], formatSeparator.PARTS) : el.role;
}

export function formatConcatElements(formatted: string[]): string {
    return formatConcat(formatted, formatSeparator.ELEMENTS);
}

export function formantElementContextPath(path: ContainerElementRole[]): string {
    return formatConcat(path, formatSeparator.PATH);
}

/**
 * Formats a content element into a short string:
 * type + text + optional context (section, path).
 *
 * @param el - Content element
 * @param textOverride - Optional text instead of `el.text`
 * @returns Formatted string
 *
 * @example
 * // → "text. Welcome"
 * formatContentElement({ type: 'text', text: 'Welcome', context: { path: [] } })
 *
 * @example
 * // → "heading. Pricing. in section \"Plans\". inside \"main content\""
 * formatContentElement({
 *   type: 'heading',
 *   text: 'Pricing',
 *   context: { path: ['main content'], sectionName: 'Plans' }
 * })
 */
export function formatContentElement(el: ContentElement, textOverride?: string): string {
    const parts: string[] = [];

    parts.push(el.type);
    parts.push(textOverride ?? el.text);
    const contextParts = formatElementContext(el);
    parts.push(...contextParts);

    return formatConcat(parts, formatSeparator.PARTS);
}

/**
 * Formats an interactive element into a short string:
 * kind + action + optional name + state + visibility + context.
 *
 * @param el - Interactive element
 * @returns Formatted string
 *
 * @example
 * // → "button. click action. name \"Log in\""
 * formatInteractiveElement(el)
 *
 * @example
 * // → "internal link. click action. name \"Pricing\". visible on initial screen. inside \"navigation\""
 * formatInteractiveElement(el)
 */
export function formatInteractiveElement(el: InteractiveElement): string {
    const parts: string[] = [];

    parts.push(formatInteractiveElementKind(el));
    parts.push(formatInteractiveElementActionHint(el));

    const nameText = formatInteractiveElementName(el);
    if (nameText) {
        parts.push(nameText);
    }

    const stateParts = formatInteractiveElementState(el);
    parts.push(...stateParts);

    const visibilityParts = formatInteractiveElementVisibility(el);
    parts.push(...visibilityParts);

    const contextParts = formatElementContext(el);
    parts.push(...contextParts);

    return formatConcat(parts, formatSeparator.PARTS);
}
