import {
    isClearPageMessage,
    isCollectPageTrailMessage,
    isHighlightElementMessage,
    isStartOnboardingMessage,
} from '@/types';
import type { Message, StartOnboardingMessageData } from '@/types';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { findElement, getOrCreateDataId } from '@/core/locator/locate';
import type { PageViewModel, HighlightState, WizardState } from './usePage.types';
import type { TransportService } from '@/adapters/interface';
import { constants } from '@/constants';
import type { AgentResultElement } from '@flowforge/contract';
import { PageTrailCollector } from '@flowforge/page-trail';

export interface UsePageOptions {
    transport: TransportService;
}

export function usePage({ transport }: UsePageOptions): PageViewModel {
    const [highlights, setHighlights] = useState<HighlightState[]>([]);
    const [wizard, setWizard] = useState<WizardState | null>(null);

    // Clear all highlights and wizard
    const clearPage = useCallback(() => {
        setHighlights([]);
        setWizard(null);
    }, []);

    // Highlight an element
    const highlightElement = useCallback((element: AgentResultElement) => {
        const el = findElement(document, element.dataId, element.selector);

        if (el) {
            setHighlights([
                {
                    id: `highlight-${Date.now()}`,
                    el,
                    element,
                    duration: constants.HIGHLIGHT_DEFAULT_DURATION_MS,
                },
            ]);
        }
    }, []);

    // Start onboarding navigation
    const startOnboarding = useCallback(
        (data: StartOnboardingMessageData) => {
            if (data.elements.length === 0) return;

            // Wizard mode - step by step
            if (data.mode === 'steps') {
                setWizard({
                    title: data.title,
                    description: data.description,
                    steps: data.elements,
                    currentStep: 0,
                });
            }
            // Direct highlight mode
            else if (data.elements[0]) {
                highlightElement(data.elements[0]);
            }
        },
        [highlightElement],
    );

    // Handle wizard step change
    const handleWizardChangeStep = useCallback((stepIndex: number) => {
        // Use functional update to avoid dependency on wizard
        setWizard((prevWizard) => {
            if (!prevWizard) return null;

            // Clear previous highlights
            setHighlights([]);

            // Show highlight for current step
            if (stepIndex > 0 && stepIndex <= prevWizard.steps.length) {
                const stepData = prevWizard.steps[stepIndex - 1]!;
                const el = findElement(document, stepData.dataId, stepData.selector);

                if (el) {
                    setHighlights([
                        {
                            id: `wizard-step-${stepIndex}`,
                            el,
                            element: stepData,
                            stepIndex,
                            duration: 0, // No auto-hide for wizard steps
                        },
                    ]);
                }
            }

            // Return updated wizard state
            return { ...prevWizard, currentStep: stepIndex };
        });
    }, []);

    // Handle close wizard
    const handleWizardClose = useCallback(() => {
        clearPage();
    }, [clearPage]);

    // Remove highlight by id
    const handleHighlightRemove = useCallback((id: string) => {
        setHighlights((prev) => prev.filter((h) => h.id !== id));
    }, []);

    // Listen to messages from background
    useEffect(() => {
        return transport.addMessageListener((message: Message) => {
            if (isCollectPageTrailMessage(message)) {
                const pageTrail = PageTrailCollector.collectFor(window, document, {
                    contentElementsLimit: constants.CONTENT_ELEMENTS_LIMIT,
                    interactiveElementsLimit: constants.INTERACTIVE_ELEMENTS_LIMIT,
                    getElementDataId: getOrCreateDataId,
                });
                return { success: true, data: pageTrail };
            }
            if (isClearPageMessage(message)) {
                clearPage();
                return { success: true };
            }
            if (isStartOnboardingMessage(message)) {
                startOnboarding(message.data);
                return { success: true };
            }
            if (isHighlightElementMessage(message)) {
                highlightElement(message.data.element);
                return { success: true };
            }
            return undefined;
        });
    }, [transport, startOnboarding, highlightElement, clearPage]);

    return {
        highlights: highlights.map((highlight) => ({
            ...highlight,
            remove: () => handleHighlightRemove(highlight.id),
        })),
        wizard: wizard
            ? {
                  ...wizard,
                  close: handleWizardClose,
                  changeStep: handleWizardChangeStep,
              }
            : null,
    };
}
