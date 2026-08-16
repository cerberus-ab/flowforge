declare global {
    interface Window {
        loadFlowForge: () => Promise<FlowForgeRuntime>;
    }
}

export interface FlowForgeRuntime {
    readonly version: string;

    start(options?: {
        triggerSize?: 'medium' | 'large';
        settings?: {
            theme?: 'light' | 'dark';
        };
    }): Promise<FlowForgeInstance>;

    demo(options?: {
        triggerSize?: 'medium' | 'large';
        settings?: {
            theme?: 'light' | 'dark';
        };
        topic?: string;
        stubModel?: string;
        stubQA?: {
            question: string;
            result: unknown;
        }[];
    }): Promise<FlowForgeInstance>;
}

export interface FlowForgeInstance {
    openPopup(question?: string): void;
    closePopup(): void;
    openPageInspector(): Promise<void>;
    destroy(): void;
}

export {};
