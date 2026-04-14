import { ResultElements } from './ResultElements';
import type { ResultViewModel } from '#self/popup/hooks/usePopup.types';
import { Card } from '#self/shared/components/Card';

export function Result({ result, resultMetadata, error, navigateToElement }: ResultViewModel) {
    if (error) {
        return <Card title="Misunderstood" text={error} direction="left" error></Card>;
    }
    if (result) {
        return (
            <Card title="Figured out" text={result.answer} direction="left">
                {result.elements.length > 0 && (
                    <ResultElements
                        elements={result.elements}
                        mode={result.mode}
                        navigateToElement={navigateToElement}
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
