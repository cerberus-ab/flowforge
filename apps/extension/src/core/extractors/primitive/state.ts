import { parseElementBooleanAttribute } from '#self/core/utils/dom';
import type { InteractiveElementState } from '@flowforge/shared';

/**
 * Extracts the state of an interactive element by reading native HTML properties and ARIA attributes.
 * ARIA attributes take precedence over native properties when both are present.
 *
 * @param el - The DOM element to extract state from
 * @returns An object containing the element's interactive state properties
 */
export function getInteractiveElementState(el: Element): InteractiveElementState {
    const state: InteractiveElementState = {};

    // Native HTML states

    if ('disabled' in el) {
        state.disabled = (
            el as HTMLInputElement | HTMLButtonElement | HTMLSelectElement | HTMLTextAreaElement
        ).disabled;
    }
    if ('readOnly' in el) {
        state.readonly = (el as HTMLInputElement | HTMLTextAreaElement).readOnly;
    }
    if ('required' in el) {
        state.required = (el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).required;
    }
    if ('checked' in el) {
        state.checked = (el as HTMLInputElement).checked;
    }
    if ('selected' in el) {
        state.selected = (el as HTMLOptionElement).selected;
    }
    if ('hidden' in el && el.hidden !== false) {
        state.hidden = true;
    }

    // ARIA states

    const ariaDisabled = parseElementBooleanAttribute(el, 'aria-disabled');
    if (typeof ariaDisabled !== 'undefined') state.disabled = ariaDisabled;

    const ariaChecked = parseElementBooleanAttribute(el, 'aria-checked');
    if (ariaChecked !== undefined) state.checked = ariaChecked;

    const ariaExpanded = parseElementBooleanAttribute(el, 'aria-expanded');
    if (ariaExpanded !== undefined) state.expanded = ariaExpanded;

    const ariaPressed = parseElementBooleanAttribute(el, 'aria-pressed');
    if (ariaPressed !== undefined) state.pressed = ariaPressed;

    const ariaSelected = parseElementBooleanAttribute(el, 'aria-selected');
    if (ariaSelected !== undefined) state.selected = ariaSelected;

    const ariaHidden = parseElementBooleanAttribute(el, 'aria-hidden');
    if (ariaHidden !== undefined) state.hidden = ariaHidden;

    const ariaRequired = parseElementBooleanAttribute(el, 'aria-required');
    if (ariaRequired !== undefined) state.required = ariaRequired;

    const ariaReadonly = parseElementBooleanAttribute(el, 'aria-readonly');
    if (ariaReadonly !== undefined) state.readonly = ariaReadonly;

    return state;
}
