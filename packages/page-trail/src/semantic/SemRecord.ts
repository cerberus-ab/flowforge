import { capitaliseFirst } from '../utils/index.ts';

const SEPARATOR_VALUES = ', ';
const SEPARATOR_PARTS = '. ';

class SemRecordBuilder {
    constructor(
        private readonly data: Partial<{
            descriptor: string;
            payload?: string;
            labels?: Set<string>;
            action?: string;
            state?: Set<string>;
            context?: string;
        }> = {},
    ) {}

    withDescriptor(descriptor: string): SemRecordBuilder {
        this.data.descriptor = descriptor;
        return this;
    }

    withPayload(payload: string | undefined): SemRecordBuilder {
        this.data.payload = payload;
        return this;
    }

    withState(state: string[]): SemRecordBuilder {
        this.data.state = state.length > 0 ? new Set(state) : undefined;
        return this;
    }

    addState(state: string): SemRecordBuilder {
        if (this.data.state === undefined) {
            this.data.state = new Set();
        }
        this.data.state.add(state);
        return this;
    }

    withLabels(labels: string[]): SemRecordBuilder {
        this.data.labels = labels.length > 0 ? new Set(labels) : undefined;
        return this;
    }

    addLabel(label: string): SemRecordBuilder {
        if (this.data.labels === undefined) {
            this.data.labels = new Set();
        }
        this.data.labels.add(label);
        return this;
    }

    withAction(action: string | undefined): SemRecordBuilder {
        this.data.action = action;
        return this;
    }

    withContext(context: string | undefined): SemRecordBuilder {
        this.data.context = context;
        return this;
    }

    /**
     * Creates the semantic record.
     *
     * @throws Error when descriptor is missing.
     */
    build(): SemRecord {
        if (this.data.descriptor === undefined) {
            throw new Error('Descriptor is required');
        }
        return new SemRecord(
            this.data.descriptor,
            this.data.payload,
            this.data.labels !== undefined ? Array.from(this.data.labels) : undefined,
            this.data.action,
            this.data.state !== undefined ? Array.from(this.data.state) : undefined,
            this.data.context,
        );
    }
}

// Exports

export class SemRecord {
    constructor(
        private readonly descriptor: string,
        private readonly payload?: string,
        private readonly labels?: string[],
        private readonly action?: string,
        private readonly state?: string[],
        private readonly context?: string,
    ) {}

    // subject is descriptor + payload
    private subject(): string {
        if (this.payload !== undefined) {
            return `${capitaliseFirst(this.descriptor)}: ${this.payload}`;
        }
        return capitaliseFirst(this.descriptor);
    }

    text(): string {
        const parts = [this.subject()];
        // optional labels (and name)
        if (this.labels !== undefined && this.labels.length > 0) {
            parts.push(`Name: ${this.labels[0]}`);
            if (this.labels.length > 1) {
                parts.push(`Also labeled: ${this.labels.slice(1).join(SEPARATOR_VALUES)}`);
            }
        }
        // optional action
        if (this.action !== undefined) {
            parts.push(`Action: ${this.action}`);
        }
        // optional state
        if (this.state !== undefined && this.state.length > 0) {
            parts.push(`State: ${this.state.join(SEPARATOR_VALUES)}`);
        }
        // optional context
        if (this.context !== undefined) {
            parts.push(`Context: ${this.context}`);
        }
        return parts.join(SEPARATOR_PARTS);
    }

    short(): string {
        const parts = [this.subject()];
        // name by labels
        if (this.labels !== undefined && this.labels.length > 0) {
            parts.push(`Name: ${this.labels[0]}`);
        }
        return parts.join(SEPARATOR_PARTS);
    }

    static builder(): SemRecordBuilder {
        return new SemRecordBuilder();
    }
}
