import type { AgentResultElement } from '@flowforge/contract';
import { render, screen } from '@testing-library/preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { constants } from '@/constants';
import { Highlight } from './Highlight';

const element: AgentResultElement = {
    text: 'Settings',
    dataId: 'flowforge-settings',
    cssSelector: '#settings-button',
    action: 'click',
};

function createTargetElement() {
    const target = document.createElement('button');
    target.textContent = 'Settings';
    target.getBoundingClientRect = () =>
        ({
            top: 100,
            left: 120,
            right: 220,
            bottom: 140,
            width: 100,
            height: 40,
            x: 120,
            y: 100,
            toJSON: () => undefined,
        }) satisfies DOMRect;
    document.body.append(target);
    return target;
}

async function mountHighlight() {
    await act(async () => {
        await vi.advanceTimersByTimeAsync(constants.HIGHLIGHT_MOUNT_DELAY_MS);
    });
    await act(async () => {
        await vi.runOnlyPendingTimersAsync();
    });
}

describe('Highlight', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
            return window.setTimeout(() => callback(performance.now()), 0);
        });
        vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
            window.clearTimeout(id);
        });
        vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders the highlight label after measuring the target element', async () => {
        // Given
        const target = createTargetElement();

        // When
        render(<Highlight id="highlight-1" el={target} element={element} duration={0} remove={vi.fn()} />);
        await mountHighlight();

        // Then
        expect(screen.getAllByText('Settings')).toHaveLength(2);
        expect(screen.getByText('Action:')).toBeTruthy();
        expect(screen.getByText('click')).toBeTruthy();
        expect(target.scrollIntoView).toHaveBeenCalledWith({
            behavior: 'smooth',
            block: 'center',
            inline: 'center',
        });
    });

    it('renders wizard step labels and hides action text for highlight-only elements', async () => {
        // Given
        const target = createTargetElement();

        // When
        render(
            <Highlight
                id="highlight-1"
                el={target}
                element={{ ...element, action: 'highlight' }}
                stepIndex={2}
                duration={0}
                remove={vi.fn()}
            />,
        );
        await mountHighlight();

        // Then
        expect(screen.getByText('Step 2:')).toBeTruthy();
        expect(screen.getAllByText('Settings')).toHaveLength(2);
        expect(screen.queryByText('Action:')).toBeNull();
    });

    it('auto-hides after the configured duration', async () => {
        // Given
        const remove = vi.fn();
        const target = createTargetElement();

        // When
        render(<Highlight id="highlight-1" el={target} element={element} duration={250} remove={remove} />);
        await mountHighlight();
        await act(async () => {
            await vi.advanceTimersByTimeAsync(250);
        });
        await act(async () => {
            await vi.advanceTimersByTimeAsync(constants.HIGHLIGHT_UNMOUNT_DELAY_MS);
        });

        // Then
        expect(remove).toHaveBeenCalledTimes(1);
    });
});
