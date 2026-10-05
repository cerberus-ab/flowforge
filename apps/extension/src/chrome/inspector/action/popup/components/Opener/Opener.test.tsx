import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';

import { Opener } from './Opener';

describe('Opener', () => {
    it('shows the inspector description and website link', () => {
        // Given / When
        render(<Opener website="https://flowforge.test" onOpenPageInspector={vi.fn()} />);

        // Then
        expect(screen.getByText('Inspect page context')).toBeTruthy();
        expect(screen.getByText('Explore the page structure')).toBeTruthy();
        expect(screen.getByText('Review content and interactive elements')).toBeTruthy();
        expect(screen.getByText('Preview the page as Markdown')).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Web Onboarding Assistant' }).getAttribute('href')).toBe(
            'https://flowforge.test',
        );
    });

    it('opens the page inspector when its button is clicked', () => {
        // Given
        const onOpenPageInspector = vi.fn();
        render(<Opener website="https://flowforge.test" onOpenPageInspector={onOpenPageInspector} />);

        // When
        fireEvent.click(screen.getByTestId('flowforge-ip-opener-submit'));

        // Then
        expect(onOpenPageInspector).toHaveBeenCalledOnce();
        expect(onOpenPageInspector).toHaveBeenCalledWith();
    });
});
