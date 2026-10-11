import { ResultElements } from './ResultElements';
import { Card } from '@/shared/components/Card';
import type { AgentResult, AgentResultElement } from '@flowforge/contract';

interface ResultProps {
    result: AgentResult | null;
    resultMetadata: string | null;
    isStale: boolean;
    error: string | null;
    onNavigateToElement: (element: AgentResultElement) => void;
    onOpenOnboarding: () => void;
}

export function Result({ result, resultMetadata, isStale, error, onNavigateToElement, onOpenOnboarding }: ResultProps) {
    if (error) {
        return <Card title="Couldn't" text={error} direction="left" error data-testid="flowforge-result-error"></Card>;
    }
    if (result) {
        return (
            <Card title="Figured out" text={result.answer} direction="left" data-testid="flowforge-result">
                {result.elements.length > 0 && (
                    <ResultElements
                        elements={result.elements}
                        mode={result.mode}
                        isStale={isStale}
                        onNavigateToElement={onNavigateToElement}
                        onOpenOnboarding={onOpenOnboarding}
                    />
                )}
                {resultMetadata && (
                    <div className="flowforge-card__footer flowforge-result-metadata">{resultMetadata}</div>
                )}
            </Card>
        );
    }
    return null;
}
