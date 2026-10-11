import { ResultElements } from './ResultElements';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Tooltip } from '@/shared/components/Tooltip';
import type { AgentResult, AgentResultElement } from '@flowforge/contract';
import { X } from 'lucide-preact';

interface ResultProps {
    result: AgentResult | null;
    resultMetadata: string | null;
    isStale: boolean;
    error: string | null;
    onNavigateToElement: (element: AgentResultElement) => void;
    onOpenOnboarding: () => void;
    onClearResult: () => void;
    isClearing?: boolean;
}

export function Result({
    result,
    resultMetadata,
    isStale,
    error,
    onNavigateToElement,
    onOpenOnboarding,
    onClearResult,
    isClearing = false,
}: ResultProps) {
    if (error) {
        return <Card title="Couldn't" text={error} direction="left" error data-testid="flowforge-result-error"></Card>;
    }
    if (result) {
        return (
            <Card
                title="Figured out"
                text={result.answer}
                direction="left"
                data-testid="flowforge-result"
                action={
                    <Tooltip content="Clear result" variant="primary" side="bottom" disabled={isClearing}>
                        <Button
                            size="small"
                            hollow
                            compact
                            icon={X}
                            aria-label="Clear result"
                            disabled={isClearing}
                            data-testid="flowforge-clear-result"
                            onClick={onClearResult}
                        />
                    </Tooltip>
                }
            >
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
