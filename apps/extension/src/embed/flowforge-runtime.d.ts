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
            devMode?: boolean;
        };
    }): Promise<FlowForgeInstance>;

    demo(options?: {
        triggerSize?: 'medium' | 'large';
        settings?: {
            theme?: 'light' | 'dark';
            devMode?: boolean;
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
    openPageInspector(tab?: string): Promise<void>;
    destroy(): void;
}

export {};
