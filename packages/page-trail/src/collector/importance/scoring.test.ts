import { describe, expect, it } from 'vitest';

import { scoreContentElement, scoreInteractiveElement } from './scoring';

describe('scoring exports', () => {
    it('re-exports content and interactive scorers', () => {
        expect(scoreContentElement).toBeTypeOf('function');
        expect(scoreInteractiveElement).toBeTypeOf('function');
    });
});
