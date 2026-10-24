import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';

import { ModalContainer } from './ModalContainer';

describe('ModalContainer', () => {
    it('closes from the button, Escape, and the backdrop', () => {
        // Given
        const onClose = vi.fn();
        render(
            <ModalContainer onClose={onClose} title="Inspector" titleId="modal-title">
                <p>Content</p>
            </ModalContainer>,
        );

        // When
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        fireEvent.keyDown(document, { key: 'Escape' });
        fireEvent.pointerDown(screen.getByTestId('flowforge-modal-container'));

        // Then
        expect(screen.getByRole('dialog', { name: 'Inspector' })).toBeTruthy();
        expect(onClose).toHaveBeenCalledTimes(3);
    });

    it('does not close for an inside click or Escape while editing text', () => {
        // Given
        const onClose = vi.fn();
        render(
            <ModalContainer onClose={onClose} title="Inspector" titleId="modal-title">
                <input aria-label="Edit" />
            </ModalContainer>,
        );

        // When
        fireEvent.pointerDown(screen.getByRole('dialog'));
        fireEvent.keyDown(screen.getByRole('textbox', { name: 'Edit' }), { key: 'Escape' });

        // Then
        expect(onClose).not.toHaveBeenCalled();
    });
});
