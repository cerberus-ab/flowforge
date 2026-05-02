declare global {
    interface Window {
        loadFlowForge: () => Promise<FlowForgeRuntime>;
    }
}

export interface FlowForgeRuntime {
    readonly version: string;

    start(options?: { triggerSize?: 'medium' | 'large' }): Promise<FlowForgeInstance>;

    demo(options?: {
        triggerSize?: 'medium' | 'large';
        topic?: string;
        stubModel?: string;
        stubQA?: { question: string; result: unknown }[];
    }): Promise<FlowForgeInstance>;
}

export interface FlowForgeInstance {
    openPopup(question?: string): void;
    closePopup(): void;
    destroy(): void;
}

export {};
