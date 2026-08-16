import { describe, expect, it } from 'vitest';

import { normalizeText } from './text';

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
});
