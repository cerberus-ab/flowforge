import type { ExamplesViewModel } from '#self/popup/hooks/types';

export function Examples({ examples, applyExampleQuestion }: ExamplesViewModel) {
    if (examples.length === 0) {
        return null;
    }
    return (
        <section className="flowforge-card" aria-labelledby="flowforge-examples-heading">
            <h2 id="flowforge-examples-heading" className="flowforge-card__title">
                Try one of these
            </h2>
            <div className="flowforge-examples-list">
                {examples.map((example, index) => (
                    <button
                        key={index}
                        type="button"
                        className={`flowforge-example-chip flowforge-example-chip--${
                            example.type === 'default' ? 'primary' : 'secondary'
                        }`}
                        onClick={() => applyExampleQuestion(example.question)}
                    >
                        {example.question}
                    </button>
                ))}
            </div>
        </section>
    );
}
