const RE_SENSITIVE_SIGNAL =
    /\b(password|passwd|passcode|otp|verification[-\s]?code|one[-\s]?time[-\s]?code|pin|cvv|cvc|card[-\s]?number|credit[-\s]?card|iban|api[-_\s]?key|secret[-_\s]?key)\b/i;

/**
 * Determines if an HTML element is sensitive based on its type and attributes.
 *
 * An element is considered sensitive if:
 * - It's an input with type "password", "hidden", or "file"
 * - It's an input-like element (input, textarea, select, or role="textbox/combobox")
 *   whose name, id, autocomplete, aria-label, or placeholder matches sensitive keywords
 *   (e.g., password, otp, api-key, cvv, card-number, etc.)
 *
 * @param {Element} el - The HTML element to check
 * @returns {boolean} True if the element is sensitive, false otherwise
 */
export function isSensitiveElement(el: Element): boolean {
    // typed password, hidden, file is considered sensitive
    if (el instanceof HTMLInputElement) {
        const type = (el.type || '').toLowerCase();
        if (type === 'password' || type === 'hidden' || type === 'file') {
            return true;
        }
    }
    // continue always for input-like elements
    const isInputLike =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement ||
        el.getAttribute('role') === 'textbox' ||
        el.getAttribute('role') === 'combobox';

    if (!isInputLike) return false;

    // create a signal from the element's attributes to validate
    const signal = [
        el.getAttribute('name'),
        el.getAttribute('id'),
        el.getAttribute('autocomplete'),
        el.getAttribute('aria-label'),
        el.getAttribute('placeholder'),
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    return RE_SENSITIVE_SIGNAL.test(signal);
}
