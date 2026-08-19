import { describe, expect, it } from 'vitest';

import { contentElement } from '../../../test/fixtures';
import { semContentElement } from './content';

describe('semContentElement', () => {
    it('formats heading kind with its heading tag', () => {
        expect(
            semContentElement(
                contentElement({
                    type: 'heading',
                    tag: 'h1',
                    text: 'Pricing',
                }),
            ).text(),
        ).toBe('Heading h1: Pricing');
    });

    it('uses text override', () => {
        expect(semContentElement(contentElement(), 'Hello').text()).toBe('Text: Hello');
    });
});
