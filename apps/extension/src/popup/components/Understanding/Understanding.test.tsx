import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';

import { Understanding } from './Understanding';

describe('Understanding', () => {
    it('opens inspector tabs from its actions', () => {
        // Given
        const onOpenPageInspector = vi.fn();

        // When
        render(<Understanding onOpenPageInspector={onOpenPageInspector} />);
        fireEvent.click(screen.getByRole('button', { name: 'Inspect page context' }));
        fireEvent.click(screen.getByRole('button', { name: '.md' }));

        // Then
        expect(onOpenPageInspector).toHaveBeenCalledWith('basics');
        expect(onOpenPageInspector).toHaveBeenCalledWith('markdown');
    });
});
