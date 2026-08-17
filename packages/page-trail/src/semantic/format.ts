import type { ContainerElementRole, ContentElement, InteractiveElement, TargetElement } from '../types/index.ts';

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

export function formatConcatElements(formatted: string[]): string {
    return formatConcat(formatted, formatSeparator.ELEMENTS);
}

// [in section "Pricing", inside "main content"]
function formatElementContext(el: TargetElement): string[] {
    const parts: string[] = [];

    if (el.contextDeprecated.sectionName) {
        parts.push(`in section "${el.contextDeprecated.sectionName}"`);
    }
    if (el.contextDeprecated.path.length > 0) {
        parts.push(`inside "${formantElementContextPath(el.contextDeprecated.path)}"`);
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

/**
 * Formats a small heading sample from content elements.
 *
 * Only heading elements are included. They are ordered by descending
 * `importanceScore`, limited by `headingsLimit`, formatted with
 * `formatContentElementShort`, and joined with ` | `.
 *
 * @param contentElements - Content elements collected from the page
 * @param headingsLimit - Maximum number of headings to include
 * @returns Compact heading sample for previews or page-level summaries
 *
 * @example
 * // → "h1. Pricing | h2. Enterprise"
 * formatSampleHeadings([
 *   { type: 'heading', tag: 'h2', text: 'Enterprise', importanceScore: 0.7 },
 *   { type: 'text', tag: 'p', text: 'Choose a plan', importanceScore: 0.9 },
 *   { type: 'heading', tag: 'h1', text: 'Pricing', importanceScore: 1 },
 * ], 2)
 *
 * @example
 * // → ""
 * formatSampleHeadings([{ type: 'text', tag: 'p', text: 'No headings here', importanceScore: 1 }])
 */
export function formatSampleHeadings(contentElements: ContentElement[], headingsLimit = 5): string {
    return formatConcatElements(
        contentElements
            .filter((el) => el.type === 'heading')
            .sort((a, b) => b.importanceScore - a.importanceScore)
            .slice(0, headingsLimit)
            .map((el) => formatContentElementShort(el)),
    );
}

/**
 * Formats a small interaction sample from interactive elements.
 *
 * Only elements with at least one label or text value are included. They are
 * ordered by descending `importanceScore`, limited by `interactionsLimit`,
 * formatted with `formatInteractiveElementShort`, and joined with ` | `.
 *
 * @param interactiveElements - Interactive elements collected from the page
 * @param interactionsLimit - Maximum number of interactions to include
 * @returns Compact interaction sample for previews or page-level summaries
 *
 * @example
 * // → "link. Docs | button. Start"
 * formatSampleInteractions([
 *   { role: 'button', text: 'Start', labels: [], importanceScore: 0.7 },
 *   { role: 'link', text: 'Docs', labels: [], importanceScore: 1 },
 *   { role: 'button', text: undefined, labels: [], importanceScore: 0.9 },
 * ], 2)
 *
 * @example
 * // → "button. Submit"
 * formatSampleInteractions([
 *   {
 *     role: 'button',
 *     text: 'Submit form',
 *     labels: [{ source: 'aria-label', value: 'Submit' }],
 *     importanceScore: 1,
 *   },
 * ])
 */
export function formatSampleInteractions(interactiveElements: InteractiveElement[], interactionsLimit = 10): string {
    return formatConcatElements(
        interactiveElements
            .filter((el) => el.labels.length > 0 || el.text)
            .sort((a, b) => b.importanceScore - a.importanceScore)
            .slice(0, interactionsLimit)
            .map((el) => formatInteractiveElementShort(el)),
    );
}
