import type { InteractiveElement } from '../../types/index.ts';
import { SemRecord } from '../SemRecord.ts';
import { semElementContext } from './context.ts';

// button, internal link, searchbox, text input, etc.
function semInteractiveElementDescriptor(element: InteractiveElement): string {
    switch (element.role) {
        case 'button':
            return 'button';
        case 'link':
            switch (element.link?.type) {
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
            return 'element';
    }
}

// [Log in, Sign up]
function semInteractiveElementLabels(element: InteractiveElement): string[] {
    const values = [...element.labels.map((l) => l.value)];
    if (element.text) {
        values.push(element.text);
    }
    return values;
}

// click action, input text, select control, etc.
function semInteractiveElementAction(element: InteractiveElement): string {
    switch (element.role) {
        case 'button':
        case 'link':
            return 'click action';
        case 'textbox':
        case 'searchbox':
            return 'input text';
        case 'checkbox':
        case 'radio':
        case 'combobox':
        case 'listbox':
            return 'select control';
        case 'slider':
            return 'adjust control';
        default:
            return 'interact';
    }
}

// [disabled, readonly, required, visible on initial screen, currently visible, etc.]
function semInteractiveElementState(element: InteractiveElement): string[] {
    const state: string[] = [];
    // base
    if (element.state.disabled) state.push('disabled');
    if (element.state.readonly) state.push('readonly');
    if (element.state.required) state.push('required');
    if (element.state.checked) state.push('checked');
    if (element.state.selected) state.push('selected');
    if (element.state.expanded) state.push('expanded');
    if (element.state.pressed) state.push('pressed');
    if (element.state.hidden) state.push('hidden');
    // visibility
    if (element.aboveTheFold) state.push('visible on initial screen');
    else if (element.inViewport) state.push('currently visible');

    return state;
}

// Exports

/**
 * Builds a semantic record for an interactive element:
 * descriptor + optional labels + action + state + optional context.
 *
 * @param element - Interactive element
 * @returns Semantic record
 *
 * @example
 * // → "Button. Name: Log in. Action: click action. Context: header"
 * semInteractiveElement(el).text()
 *
 * @example
 * // → "Internal link. Name: Pricing. Action: click action. State: visible on initial screen"
 * semInteractiveElement(el).text()
 */
export function semInteractiveElement(element: InteractiveElement): SemRecord {
    return SemRecord.builder()
        .withDescriptor(semInteractiveElementDescriptor(element))
        .withLabels(semInteractiveElementLabels(element))
        .withAction(semInteractiveElementAction(element))
        .withState(semInteractiveElementState(element))
        .withContext(semElementContext(element.context))
        .build();
}
