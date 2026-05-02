import type { ContainerElementRole, InteractiveElementRole, InteractiveElementType } from '#self/types';

// https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles

/**
 * Resolves a semantic container role for an element from its native tag or ARIA role.
 *
 * Mapping priority is ARIA role first where explicitly checked, then HTML tag fallbacks.
 * For dialogs, `aria-modal="true"` is classified as `modal dialog`; otherwise `dialog`.
 *
 * @param el - Element to classify.
 * @returns Matched container role, or `undefined` when no supported role is found.
 */
export function getContainerRole(el: Element): ContainerElementRole | undefined {
    const role = el.getAttribute('role');
    const tag = el.tagName.toLowerCase();

    // dialogs
    if (role === 'alertdialog') return 'alert dialog';
    if (tag === 'dialog' || role === 'dialog') {
        return el.getAttribute('aria-modal') === 'true' ? 'modal dialog' : 'dialog';
    }
    // landmarks / layout
    if (tag === 'main' || role === 'main') return 'main content';
    if (tag === 'header' || role === 'banner') return 'header';
    if (tag === 'footer' || role === 'contentinfo') return 'footer';
    if (tag === 'nav' || role === 'navigation') return 'navigation';
    if (tag === 'aside' || role === 'complementary') return 'sidebar';
    if (tag === 'form' || role === 'form') return 'form';
    if (tag === 'search' || role === 'search') return 'search';
    // semantic containers
    if (tag === 'article' || role === 'article') return 'article';
    if (tag === 'section') return 'section';
    if (role === 'region') return 'region';
    if (tag === 'figure' || role === 'figure') return 'figure';
    if (role === 'feed') return 'feed';
    if (role === 'note') return 'note';
    // UI containers
    if (role === 'tabpanel') return 'tab panel';
    if (role === 'toolbar') return 'toolbar';
    if (role === 'menu') return 'menu';
    // tables
    if (tag === 'table' || role === 'table') return 'table';
    if (tag === 'tr' || role === 'row') return 'table row';

    return undefined;
}

/**
 * Resolves an interactive role for an element from its explicit ARIA role or native HTML semantics.
 *
 * Mapping priority is ARIA role first, then tag-based fallbacks, then input/select specific logic.
 * Select elements are classified as `combobox` for single-select controls and `listbox` otherwise.
 *
 * @param el - Element to classify.
 * @returns Matched interactive role, or `undefined` when no supported role is found.
 */
export function getInteractiveRole(el: Element): InteractiveElementRole | undefined {
    const role = el.getAttribute('role');
    const tag = el.tagName.toLowerCase();

    // ARIA roles
    if (role === 'button') return 'button';
    if (role === 'link') return 'link';
    if (role === 'checkbox') return 'checkbox';
    if (role === 'radio') return 'radio';
    if (role === 'switch') return 'switch';
    if (role === 'slider') return 'slider';
    if (role === 'textbox') return 'textbox';
    if (role === 'searchbox') return 'searchbox';
    if (role === 'combobox') return 'combobox';
    if (role === 'listbox') return 'listbox';
    if (role === 'option') return 'option';
    if (role === 'tab') return 'tab';
    if (role === 'menuitem') return 'menuitem';
    if (role === 'dialog') return 'dialog';

    // native elements
    if (tag === 'button' || tag === 'summary') return 'button';
    if (tag === 'a' && el.hasAttribute('href')) return 'link';
    if (tag === 'textarea') return 'textbox';
    if (tag === 'dialog') return 'dialog';
    if (tag === 'option') return 'option';

    if (tag === 'select') {
        const select = el as HTMLSelectElement;
        const size = Number(select.getAttribute('size') ?? '0');
        return !select.multiple && size <= 1 ? 'combobox' : 'listbox';
    }

    if (tag === 'input') {
        const input = el as HTMLInputElement;
        const type = (input.getAttribute('type') ?? 'text').toLowerCase();

        if (type === 'hidden') return undefined;
        if (type === 'button' || type === 'submit' || type === 'reset' || type === 'image') {
            return 'button';
        }
        if (type === 'checkbox') return 'checkbox';
        if (type === 'radio') return 'radio';
        if (type === 'range') return 'slider';
        if (type === 'search') return 'searchbox';
        if (
            type === 'text' ||
            type === 'email' ||
            type === 'tel' ||
            type === 'url' ||
            type === 'password' ||
            type === 'number'
        ) {
            return 'textbox';
        }
    }
    return undefined;
}

/**
 * Maps an interactive role to the corresponding extracted interactive element type.
 *
 * Roles are grouped into broader element categories used by the extractor layer.
 * Returns `undefined` when the role does not map to a supported interactive element type.
 *
 * @param role - Interactive role to convert.
 * @returns Matching interactive element type, or `undefined` when no mapping exists.
 */
export function roleToInteractiveElementType(role: InteractiveElementRole): InteractiveElementType | undefined {
    switch (role) {
        case 'button':
        case 'dialog':
        case 'tab':
        case 'menuitem':
            return 'button';
        case 'link':
            return 'link';
        case 'textbox':
        case 'searchbox':
            return 'input';
        case 'checkbox':
        case 'radio':
        case 'switch':
        case 'slider':
        case 'combobox':
        case 'listbox':
        case 'option':
            return 'select';
        default:
            return undefined;
    }
}
