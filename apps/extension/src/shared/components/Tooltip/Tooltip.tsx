import { cloneElement, toChildArray } from 'preact';
import type { ComponentChildren, VNode } from 'preact';
import { useEffect, useId, useRef, useState } from 'preact/hooks';

// constants
const TOOLTIP_POINTER_OPEN_DELAY_MS = 800;
const TOOLTIP_KEYBOARD_FOCUS_WINDOW_MS = 200;

type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

type TooltipProps = {
    content: ComponentChildren;
    children: ComponentChildren;
    side?: TooltipSide;
    disabled?: boolean;
    variant?: 'primary' | 'secondary';
};

const keyboardTooltipKeys = new Set(['Tab', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'Home', 'End']);

// Checks whether a value is a single element that can be cloned.
function isVNode(value: unknown): value is VNode<Record<string, unknown>> {
    return typeof value === 'object' && value !== null && 'type' in value && 'props' in value;
}

// Detects keyboard-visible focus on the trigger or one of its descendants.
function hasVisibleFocus(el: HTMLElement): boolean {
    return el.matches(':focus-visible') || el.querySelector(':focus-visible') !== null;
}

// Calculates a viewport-clamped fixed position for the tooltip bubble.
function getTooltipPosition(
    triggerRect: DOMRect,
    tooltipRect: DOMRect,
    side: TooltipSide,
): { top: number; left: number } {
    const gap = 6;
    const viewportPadding = 8;
    const maxLeft = Math.max(viewportPadding, window.innerWidth - tooltipRect.width - viewportPadding);
    const maxTop = Math.max(viewportPadding, window.innerHeight - tooltipRect.height - viewportPadding);
    const clampLeft = (value: number) => Math.min(Math.max(value, viewportPadding), maxLeft);
    const clampTop = (value: number) => Math.min(Math.max(value, viewportPadding), maxTop);
    const centeredLeft = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    const centeredTop = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
    const preferredTop = triggerRect.top - tooltipRect.height - gap;
    const preferredBottom = triggerRect.bottom + gap;
    const preferredLeft = triggerRect.left - tooltipRect.width - gap;
    const preferredRight = triggerRect.right + gap;

    if (side === 'top') {
        return {
            top: preferredTop >= viewportPadding ? preferredTop : clampTop(preferredBottom),
            left: clampLeft(centeredLeft),
        };
    }
    if (side === 'bottom') {
        return {
            top: preferredBottom <= maxTop ? preferredBottom : clampTop(preferredTop),
            left: clampLeft(centeredLeft),
        };
    }
    if (side === 'left') {
        return {
            top: clampTop(centeredTop),
            left: preferredLeft >= viewportPadding ? preferredLeft : clampLeft(preferredRight),
        };
    }
    return {
        top: clampTop(centeredTop),
        left: preferredRight <= maxLeft ? preferredRight : clampLeft(preferredLeft),
    };
}

// Renders a delayed, viewport-positioned tooltip around a trigger element.
export function Tooltip({ variant = 'primary', side = 'top', disabled = false, content, children }: TooltipProps) {
    let lastKeyboardTooltipIntentAt = 0;
    const id = `flowforge-tooltip-${useId()}`;
    const wrapperRef = useRef<HTMLSpanElement>(null);
    const contentRef = useRef<HTMLSpanElement>(null);
    const pointerOpenTimerRef = useRef<number>();
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState<{ top: number; left: number }>();
    const childItems = toChildArray(children);
    const onlyChild = childItems.length === 1 ? childItems[0] : undefined;
    const classes = [
        'flowforge-tooltip',
        `flowforge-tooltip--${variant}`,
        `flowforge-tooltip--${side}`,
        disabled && 'flowforge-tooltip--disabled',
    ]
        .filter(Boolean)
        .join(' ');

    const triggerProps = isVNode(onlyChild) ? (onlyChild.props as Record<string, unknown>) : undefined;
    const existingDescribedBy =
        typeof triggerProps?.['aria-describedby'] === 'string' ? triggerProps['aria-describedby'] : undefined;
    const trigger =
        !disabled && isVNode(onlyChild)
            ? cloneElement(onlyChild, {
                  'aria-describedby': [existingDescribedBy, id].filter(Boolean).join(' '),
              })
            : children;

    // Updates the tooltip bubble coordinates from the current trigger bounds.
    const updatePosition = () => {
        const wrapper = wrapperRef.current;
        const tooltip = contentRef.current;
        if (!wrapper || !tooltip) return;

        setPosition(getTooltipPosition(wrapper.getBoundingClientRect(), tooltip.getBoundingClientRect(), side));
    };

    // Clears any pending delayed pointer-open timer.
    const clearPointerOpenTimer = () => {
        if (pointerOpenTimerRef.current === undefined) return;

        window.clearTimeout(pointerOpenTimerRef.current);
        pointerOpenTimerRef.current = undefined;
    };

    // Starts the delayed hover-open timer for pointer users.
    const schedulePointerOpen = () => {
        if (disabled) return;

        clearPointerOpenTimer();
        pointerOpenTimerRef.current = window.setTimeout(() => {
            pointerOpenTimerRef.current = undefined;
            setOpen(true);
        }, TOOLTIP_POINTER_OPEN_DELAY_MS);
    };

    // Closes the tooltip and cancels pending hover-open work.
    const closeTooltip = () => {
        clearPointerOpenTimer();
        setOpen(false);
    };

    // Opens the tooltip for recent keyboard-driven focus only.
    const openTooltipOnKeyboardFocus = () => {
        if (disabled) return;

        window.requestAnimationFrame(() => {
            const wrapper = wrapperRef.current;
            if (!wrapper || !hasVisibleFocus(wrapper)) return;
            if (Date.now() - lastKeyboardTooltipIntentAt > TOOLTIP_KEYBOARD_FOCUS_WINDOW_MS) return;

            setOpen(true);
        });
    };

    // Keeps the fixed tooltip aligned while the viewport or scroll position changes.
    useEffect(() => {
        if (!open) return;

        updatePosition();
        const handlePositionChange = () => {
            updatePosition();
        };
        window.addEventListener('resize', handlePositionChange);
        document.addEventListener('scroll', handlePositionChange, true);
        return () => {
            window.removeEventListener('resize', handlePositionChange);
            document.removeEventListener('scroll', handlePositionChange, true);
        };
    }, [open, side, content]);

    // Clears pending pointer timers when the tooltip unmounts.
    useEffect(() => {
        return () => {
            clearPointerOpenTimer();
        };
    }, []);

    // Records recent keyboard navigation so programmatic focus does not open the tooltip.
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!keyboardTooltipKeys.has(e.key)) return;

            lastKeyboardTooltipIntentAt = Date.now();
        };
        document.addEventListener('keydown', handleKeyDown, true);
        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, []);

    return (
        <span
            ref={wrapperRef}
            className={classes}
            onPointerEnter={schedulePointerOpen}
            onPointerLeave={closeTooltip}
            onPointerDown={closeTooltip}
            onClick={closeTooltip}
            onFocusIn={openTooltipOnKeyboardFocus}
            onFocusOut={closeTooltip}
            data-open={open ? 'true' : undefined}
        >
            {trigger}
            {!disabled && (
                <span
                    ref={contentRef}
                    id={id}
                    className="flowforge-tooltip__content"
                    role="tooltip"
                    style={position ? { top: `${position.top}px`, left: `${position.left}px` } : undefined}
                >
                    {content}
                </span>
            )}
        </span>
    );
}
