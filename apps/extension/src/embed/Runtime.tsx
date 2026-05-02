import { EmbedTransportService } from '#self/adapters/embed/EmbedTransportService';
import { type InjectedRoot, ShadowRootInjector } from '#self/core/services/RootInjector';
import { render } from 'preact';

import shellStyles from './shell/shell.css?inline';

import type { TransportService } from '#self/adapters/interface';
import { type ApiClient, DemoApiClient, HttpApiClient } from '#self/core/services/ApiClient';
import { config } from '#self/config';
import { HistoryStorage } from '#self/core/services/HistoryStorage';
import { SettingsStorage } from '#self/core/services/SettignsStorage';
import { BackgroundWorker } from '#self/background/BackgroundWorker';
import { ShellApp, type ShellAppDemoProps, type ShellAppRef } from '#self/embed/shell/ShellApp';
import { createRef, type RefObject } from 'preact/compat';
import { EmbedLocalStorage } from '#self/adapters/embed/EmbedLocalStorage';
import type { AgentResult } from '@flowforge/contract';
import { embedConstants } from '#self/embed/constants';
import type { TriggerSize } from '#self/embed/components/Trigger/Trigger';

interface RuntimeStartOptions {
    triggerSize?: TriggerSize;
}

interface RuntimeDemoOptions extends RuntimeStartOptions {
    topic?: string;
    stubModel?: string;
    stubQA?: {
        question: string;
        result: AgentResult;
    }[];
}

interface MountShellOptions {
    triggerSize?: TriggerSize;
    demoProps?: ShellAppDemoProps;
}

interface RuntimeApi {
    openPopup(question?: string): void;
    closePopup(): void;
    destroy(): void;
}

export class Runtime implements RuntimeApi {
    private readonly transport: TransportService;
    private readonly shellRef: RefObject<ShellAppRef>;
    // on initialization
    private backgroundWorker?: BackgroundWorker;
    private shellRoot?: InjectedRoot;

    private constructor() {
        this.transport = new EmbedTransportService();
        this.shellRef = createRef<ShellAppRef>();
    }

    static version = config.version;

    /**
     * Creates and initializes a ready-to-use Runtime instance
     *
     * Starts background services and mounts UI. Safe to use immediately.
     *
     * @param options - Optional configuration for the Runtime.
     * @returns Initialized Runtime instance.
     */
    static async start(options: RuntimeStartOptions = {}): Promise<Runtime> {
        const runtime = new Runtime();
        const apiClient = new HttpApiClient(config.serverUrl);
        runtime.startBackground(apiClient);
        await runtime.mountShell({
            triggerSize: options.triggerSize
        });
        console.log('[FlowForge] Runtime successfully started');

        return runtime;
    }

    /**
     * Creates a demo Runtime instance with a mock API client
     *
     * Uses DemoApiClient to simulate responses, delays, and metadata
     * without requiring a real backend. Useful for demos, testing, and landing pages.
     *
     * @param options - Demo configuration (model, predefined results, etc.)
     * @returns Initialized Runtime instance ready to use.
     */
    static async demo(options: RuntimeDemoOptions = {}): Promise<Runtime> {
        const runtime = new Runtime();
        const apiClient = new DemoApiClient({
            delayMs: 2200,
            stubModel: options.stubModel,
            stubQA: options.stubQA,
        });
        runtime.startBackground(apiClient);
        await runtime.mountShell({
            triggerSize: options.triggerSize,
            demoProps: {
                enabled: true,
                setup: {
                    topic: options.topic,
                    stubQuestions: options.stubQA?.map((s) => s.question) ?? [],
                },
            }
        });
        console.log('[FlowForge] Demo runtime successfully started');

        return runtime;
    }

    openPopup(question?: string) {
        this.shellRef.current?.open(question);
    }

    closePopup() {
        this.shellRef.current?.close();
    }

    destroy() {
        this.stopBackground();
        this.unmountShell();
        console.log('[FlowForge] Runtime successfully destroyed');
    }

    private startBackground(apiClient: ApiClient): void {
        const localStorage = new EmbedLocalStorage();
        const historyStorage = new HistoryStorage(localStorage, config.questionsHistoryLimit);
        const settingsStorage = new SettingsStorage(localStorage, config.defaultSettings);

        this.backgroundWorker = new BackgroundWorker(this.transport, apiClient, historyStorage, settingsStorage);
        this.backgroundWorker.start();
    }

    private stopBackground(): void {
        this.backgroundWorker?.stop();
        this.backgroundWorker = undefined;
    }

    private async mountShell(options: MountShellOptions): Promise<void> {
        const rootInjector = new ShadowRootInjector();

        const doMount = () => {
            const shellRoot = rootInjector.inject(document, embedConstants.SHELL_ROOT_ID, { overlay: true });
            rootInjector.injectStyles(shellRoot, shellStyles);
            render(
                <ShellApp ref={this.shellRef} transport={this.transport} triggerSize={options.triggerSize} demoProps={options.demoProps} />,
                shellRoot.mountPoint,
            );
            this.shellRoot = shellRoot;
            console.log('[FlowForge] Shell with popup loaded');
        };

        if (document.readyState === 'loading') {
            await new Promise<void>((resolve) => {
                document.addEventListener('DOMContentLoaded', () => {
                    doMount();
                    resolve();
                });
            });
        } else {
            doMount();
        }
        await new Promise<void>((resolve) => queueMicrotask(resolve));
    }

    private unmountShell(): void {
        if (this.shellRoot) {
            render(null, this.shellRoot.mountPoint);
            this.shellRoot.destroy();
            this.shellRoot = undefined;
        }
        this.shellRef.current = null;
    }
}
