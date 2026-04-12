import { useEffect, useRef, useState } from 'preact/hooks';
import { calcLabelLayout, calcElementPosition, isNewPosition, isNewLabelLayout } from '#self/page/utils/position';
import type { HighlightViewModel } from '#self/page/hooks/types';
import { constants } from '#self/constants';

export function Highlight({ el, element, stepIndex, duration, remove }: HighlightViewModel) {
    const [isVisible, setIsVisible] = useState(false);
    const [isHiding, setIsHiding] = useState(false);
    const [position, setPosition] = useState<ReturnType<typeof calcElementPosition> | null>(null);
    const [labelLayout, setLabelLayout] = useState<ReturnType<typeof calcLabelLayout> | null>(null);

    const labelRef = useRef<HTMLDivElement>(null);
    const measureFrameRef = useRef<number | null>(null);
    const visibleFrameRef = useRef<number | null>(null);

    const updatePosition = () => {
        if (measureFrameRef.current) {
            window.cancelAnimationFrame(measureFrameRef.current);
        }
        measureFrameRef.current = window.requestAnimationFrame(() => {
            const next = calcElementPosition(el);
            setPosition((prev) => (isNewPosition(prev, next) ? next : prev));
        });
    };

    // Initial mount with smooth scroll
    useEffect(() => {
        el.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center',
        });

        const mountTimer = window.setTimeout(() => {
            updatePosition();
            visibleFrameRef.current = window.requestAnimationFrame(() => {
                setIsVisible(true);
            });
        }, constants.HIGHLIGHT_MOUNT_DELAY_MS);

        return () => {
            window.clearTimeout(mountTimer);
            if (measureFrameRef.current) {
                window.cancelAnimationFrame(measureFrameRef.current);
            }
            if (visibleFrameRef.current) {
                window.cancelAnimationFrame(visibleFrameRef.current);
            }
        };
    }, [el]);

    // Recalculate overlay position on viewport changes
    useEffect(() => {
        const handleChange = () => {
            updatePosition();
        };

        updatePosition();

        window.addEventListener('resize', handleChange);
        window.addEventListener('scroll', handleChange, true);

        const viewport = window.visualViewport;
        viewport?.addEventListener('resize', handleChange);
        viewport?.addEventListener('scroll', handleChange);

        return () => {
            window.removeEventListener('resize', handleChange);
            window.removeEventListener('scroll', handleChange, true);

            viewport?.removeEventListener('resize', handleChange);
            viewport?.removeEventListener('scroll', handleChange);
        };
    }, [el]);

    // Recalculate the label only after the overlay position is known and the label is rendered
    useEffect(() => {
        if (!position || !labelRef.current) return;

        const frameId = window.requestAnimationFrame(() => {
            if (!labelRef.current) return;

            const next = calcLabelLayout(labelRef.current, position, el);
            setLabelLayout((prev) => (isNewLabelLayout(prev, next) ? next : prev));
        });

        return () => {
            window.cancelAnimationFrame(frameId);
        };
    }, [position, el, element.text, element.action, stepIndex]);

    // Auto-hide after duration
    useEffect(() => {
        if (!isVisible || duration <= 0) return;

        let unmountTimer: number | undefined;

        const hideTimer = window.setTimeout(() => {
            setIsHiding(true);
            unmountTimer = window.setTimeout(() => {
                remove();
            }, constants.HIGHLIGHT_UNMOUNT_DELAY_MS);
        }, duration);

        return () => {
            window.clearTimeout(hideTimer);
            if (unmountTimer) {
                window.clearTimeout(unmountTimer);
            }
        };
    }, [isVisible, duration, remove]);

    if (!position) return null;

    const overlayClasses = [
        'flowforge-highlight',
        isVisible && !isHiding ? 'flowforge-highlight--visible' : null,
        isHiding ? 'flowforge-highlight--hiding' : null,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div
            className={overlayClasses}
            aria-hidden="true"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                width: `${position.width}px`,
                height: `${position.height}px`,
            }}
        >
            <div className="flowforge-highlight__glow" />
            <div className="flowforge-highlight__ring" />

            {element.text && (
                <div
                    ref={labelRef}
                    className={[
                        'flowforge-highlight__label',
                        labelLayout?.placement === 'top' ? 'flowforge-highlight__label--top' : null,
                        labelLayout?.placement === 'bottom' ? 'flowforge-highlight__label--bottom' : null,
                    ]
                        .filter(Boolean)
                        .join(' ')}
                    style={{
                        maxWidth: labelLayout ? `${labelLayout.maxWidth}px` : undefined,
                        top: labelLayout ? `${labelLayout.top}px` : undefined,
                        left: labelLayout ? `${labelLayout.left}px` : undefined,
                    }}
                >
                    <div className="flowforge-highlight__label-text">
                        {stepIndex !== undefined && <span>Step {stepIndex}: </span>}
                        {element.text}
                    </div>
                    {element.action !== 'highlight' && (
                        <div className="flowforge-highlight__label-action">
                            <span>Action: </span>
                            {element.action}
                        </div>
                    )}
                    <div className="flowforge-highlight__label-star" aria-hidden="true">
                        ✦
                    </div>
                </div>
            )}
        </div>
    );
}
