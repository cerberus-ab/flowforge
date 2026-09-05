import {
    isClearPageMessage,
    isCollectPageTrailMessage,
    isHighlightElementMessage,
    isOpenInspectorMessage,
    isStartOnboardingMessage,
} from '@/types';
import type { Message, StartOnboardingMessageData } from '@/types';
import { useCallback, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { findElement, getOrCreateDataId } from '@/core/locator/locate';
import type { TransportService } from '@/adapters/interface';
import { constants } from '@/constants';
import type { AgentResultElement, PageTrail } from '@flowforge/contract';
import { PageTrailCollector } from '@flowforge/page-trail';

function collectPageTrail(): PageTrail {
    return PageTrailCollector.collectFor(window, document, {
        contentElementsLimit: constants.CONTENT_ELEMENTS_LIMIT,
        interactiveElementsLimit: constants.INTERACTIVE_ELEMENTS_LIMIT,
        getElementDataId: getOrCreateDataId,
    });
}

export interface UsePageOptions {
    transport: TransportService;
    devMode: boolean;
    onDevModeChange: (enabled: boolean) => void | Promise<void>;
    onReady?: () => void;
}

interface HighlightState {
    id: string;
    el: Element;
    element: AgentResultElement;
    stepIndex?: number;
    duration: number;
}

export interface HighlightViewModel extends HighlightState {
    remove: () => void;
}

interface WizardState {
    title: string;
    description: string;
    steps: AgentResultElement[];
    currentStep: number;
}

export interface WizardViewModel extends WizardState {
    close: () => void;
    changeStep: (step: number) => void;
}

interface InspectorState {
    pageTrail: PageTrail;
    initialTab?: string;
}

export interface InspectorViewModel extends InspectorState {
    close: () => void;
    devMode: boolean;
    onDevModeChange: (enabled: boolean) => void | Promise<void>;
}

export interface PageViewModel {
    highlights: HighlightViewModel[];
    wizard: WizardViewModel | null;
    inspector: InspectorViewModel | null;
}

export function usePage({ transport, devMode, onDevModeChange, onReady }: UsePageOptions): PageViewModel {
    const [highlights, setHighlights] = useState<HighlightState[]>([]);
    const [wizard, setWizard] = useState<WizardState | null>(null);
    const [inspector, setInspector] = useState<InspectorState | null>(null);
    const readyRef = useRef(false);

    const closeWizard = useCallback(() => {
        setHighlights([]);
        setWizard(null);
    }, []);

    const closeInspector = useCallback(() => {
        setInspector(null);
    }, []);

    // Close wizard (with all highlights) and inspector
    const clearPage = useCallback(() => {
        closeWizard();
        closeInspector();
    }, [closeWizard, closeInspector]);

    // Highlight an element
    const highlightElement = useCallback((element: AgentResultElement) => {
        const el = findElement(document, element.dataId, element.cssSelector);

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
            // Direct highlight mode if a single element
            else if (data.elements.length === 1 && data.elements[0]) {
                highlightElement(data.elements[0]);
            }
        },
        [highlightElement],
    );

    // Open inspector
    const openInspector = useCallback((pageTrail: PageTrail, initialTab?: string) => {
        setInspector({ pageTrail, initialTab });
    }, []);

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
                const el = findElement(document, stepData.dataId, stepData.cssSelector);

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

    // Remove highlight by id
    const handleHighlightRemove = useCallback((id: string) => {
        setHighlights((prev) => prev.filter((h) => h.id !== id));
    }, []);

    // Listen to messages from background
    useLayoutEffect(() => {
        const unsubscribe = transport.addMessageListener((message: Message) => {
            if (isCollectPageTrailMessage(message)) {
                const pageTrail = collectPageTrail();
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
            if (isOpenInspectorMessage(message)) {
                const pageTrail = collectPageTrail();
                openInspector(pageTrail, message.data.tab);
                return { success: true };
            }
            return undefined;
        });

        if (!readyRef.current) {
            readyRef.current = true;
            onReady?.();
        }
        return unsubscribe;
    }, [transport, startOnboarding, highlightElement, openInspector, clearPage, onReady]);

    return {
        highlights: highlights.map((highlight) => ({
            ...highlight,
            remove: () => handleHighlightRemove(highlight.id),
        })),
        wizard: wizard
            ? {
                  ...wizard,
                  close: closeWizard,
                  changeStep: handleWizardChangeStep,
              }
            : null,
        inspector: inspector
            ? {
                  ...inspector,
                  close: closeInspector,
                  devMode,
                  onDevModeChange,
              }
            : null,
    };
}
