import { ResultElements } from '#self/popup/components/ResultElements';
import type { ResultViewModel } from '#self/popup/hooks/types';

export function Result({ result, error, navigateToElement }: ResultViewModel) {
    if (error) {
        return (
            <section
                className="flowforge-card flowforge-card--left"
                aria-labelledby="flowforge-result-heading"
                data-state="error"
            >
                <h2 id="flowforge-result-heading" className="flowforge-card__title">
                    Error
                </h2>
                <p className="flowforge-card__text">{error}</p>
            </section>
        );
    }
    if (result) {
        return (
            <section
                className="flowforge-card flowforge-card--left"
                aria-labelledby="flowforge-result-heading"
                data-state="success"
            >
                <h2 id="flowforge-result-heading" className="flowforge-card__title">
                    Answer
                </h2>
                <p className="flowforge-card__text">{result.answer}</p>

                {result.elements.length > 0 && (
                    <ResultElements
                        elements={result.elements}
                        mode={result.mode}
                        navigateToElement={navigateToElement}
                    />
                )}
            </section>
        );
    }
    return null;
}
