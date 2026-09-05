import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';

import { Advanced } from './Advanced.tsx';

describe('Advanced', () => {
    it('opens inspector tabs from its actions', () => {
        // Given
        const onOpenPageInspector = vi.fn();

        // When
        render(<Advanced onOpenPageInspector={onOpenPageInspector} />);
        fireEvent.click(screen.getByRole('button', { name: 'Inspect page context' }));
        fireEvent.click(screen.getByRole('button', { name: 'Markdown' }));

        // Then
        expect(onOpenPageInspector).toHaveBeenCalledWith('basics');
        expect(onOpenPageInspector).toHaveBeenCalledWith('markdown');
    });
});
