import type { ContainerElementRole, InteractiveElementRole, InteractiveElementType } from '@flowforge/shared';

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

    if (role === 'alertdialog') return 'alert dialog';
    if (tag === 'dialog' || role === 'dialog') {
        return el.getAttribute('aria-modal') === 'true' ? 'modal dialog' : 'dialog';
    }
    if (tag === 'form' || role === 'form') return 'form';
    if (tag === 'nav' || role === 'navigation') return 'navigation';
    if (tag === 'header' || role === 'banner') return 'header';
    if (tag === 'main' || role === 'main') return 'main content';
    if (tag === 'footer' || role === 'contentinfo') return 'footer';
    if (tag === 'aside' || role === 'complementary') return 'sidebar';
    if (role === 'tabpanel') return 'tab panel';
    if (role === 'toolbar') return 'toolbar';
    if (tag === 'table' || role === 'table') return 'table';
    if (tag === 'tr' || role === 'row') return 'table row';
    if (role === 'menu') return 'menu';
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

    if (role === 'button') return 'button';
    if (role === 'link') return 'link';
    if (role === 'checkbox') return 'checkbox';
    if (role === 'radio') return 'radio';
    if (role === 'slider') return 'slider';
    if (role === 'textbox') return 'textbox';
    if (role === 'searchbox') return 'searchbox';
    if (role === 'combobox') return 'combobox';
    if (role === 'listbox') return 'listbox';
    if (role === 'dialog') return 'dialog';

    if (tag === 'button' || tag === 'summary') return 'button';
    if (tag === 'a' && el.hasAttribute('href')) return 'link';
    if (tag === 'textarea') return 'textbox';
    if (tag === 'dialog') return 'dialog';

    if (tag === 'select') {
        const select = el as HTMLSelectElement;
        const size = Number(select.getAttribute('size') ?? '0');
        return !select.multiple && size <= 1 ? 'combobox' : 'listbox';
    }
    if (tag === 'input') {
        const input = el as HTMLInputElement;
        const type = (input.getAttribute('type') ?? 'text').toLowerCase();

        if (type === 'button' || type === 'submit' || type === 'reset') return 'button';
        if (type === 'checkbox') return 'checkbox';
        if (type === 'radio') return 'radio';
        if (type === 'range') return 'slider';
        if (type === 'search') return 'searchbox';
        if (type === 'text' || type === 'email' || type === 'tel' || type === 'url' || type === 'password') {
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
            return 'button';
        case 'link':
            return 'link';
        case 'textbox':
        case 'searchbox':
            return 'input';
        case 'checkbox':
        case 'radio':
        case 'slider':
        case 'combobox':
        case 'listbox':
            return 'select';
        default:
            return undefined;
    }
}
