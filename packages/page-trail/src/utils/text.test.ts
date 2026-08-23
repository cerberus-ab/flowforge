import { describe, expect, it } from 'vitest';

import { normalizeText, toUpperSnakeCase } from './text';

describe('normalizeText', () => {
    it('trims leading and trailing whitespace', () => {
        expect(normalizeText('  Hello world  ')).toBe('Hello world');
    });

    it('collapses repeated whitespace into a single space', () => {
        expect(normalizeText('Hello   world\nfrom\tFlowForge')).toBe('Hello world from FlowForge');
    });

    it('removes whitespace before punctuation', () => {
        expect(normalizeText('Hello , world ! Is it ok ? Yes : fine ; done .')).toBe(
            'Hello, world! Is it ok? Yes: fine; done.',
        );
    });

    it('returns an empty string for whitespace-only input', () => {
        expect(normalizeText(' \n\t ')).toBe('');
    });

    it('truncates normalized text to the provided maximum length', () => {
        expect(normalizeText('Hello   world from FlowForge', { maxLength: 12 })).toBe('Hello world');
    });

    it('cuts at the maximum length when no whitespace exists before the limit', () => {
        expect(normalizeText('FlowForge', { maxLength: 4 })).toBe('Flow');
    });
});

describe('toUpperSnakeCase', () => {
    it('converts camelCase to uppercase snake case', () => {
        expect(toUpperSnakeCase('hasVisibleText')).toBe('HAS_VISIBLE_TEXT');
    });

    it('converts hyphen and whitespace separators to underscores', () => {
        expect(toUpperSnakeCase('generic-unlabeled')).toBe('GENERIC_UNLABELED');
        expect(toUpperSnakeCase('main content')).toBe('MAIN_CONTENT');
    });

    it('handles mixed separators and camelCase boundaries together', () => {
        expect(toUpperSnakeCase('ariaLabel primary-action')).toBe('ARIA_LABEL_PRIMARY_ACTION');
    });

    it('preserves existing underscores', () => {
        expect(toUpperSnakeCase('HAS_VISIBLE_TEXT')).toBe('HAS_VISIBLE_TEXT');
        expect(toUpperSnakeCase('has_visible_text')).toBe('HAS_VISIBLE_TEXT');
    });
});
