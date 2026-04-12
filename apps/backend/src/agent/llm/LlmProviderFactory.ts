import type { AppConfig } from '#self/config';
import type { LlmProvider } from '#self/types';
import { OpenAiLlmProvider } from './OpenAiLlmProvider.ts';
import { OllamaLocalLlmProvider } from './OllamaLocalLlmProvider.ts';

export class LlmProviderFactory {
    static create(appConfig: AppConfig): LlmProvider {
        // Strategy to create LLM provider based on configuration
        switch (appConfig.llm.provider) {
            case 'ollama-local': {
                if (!appConfig.llm.ollamaLocal) {
                    throw new Error('[LLM] Ollama Local configuration is missing');
                }
                return new OllamaLocalLlmProvider(
                    appConfig.llm.ollamaLocal.baseUrl,
                    appConfig.llm.ollamaLocal.model,
                    appConfig.llm.ollamaLocal.embedding,
                );
            }
            case 'openai': {
                if (!appConfig.llm.openai) {
                    throw new Error('[LLM] OpenAI configuration is missing');
                }
                return new OpenAiLlmProvider(
                    appConfig.llm.openai.apiKey,
                    appConfig.llm.openai.model,
                    appConfig.llm.openai.embedding,
                );
            }
            default:
                throw new Error(`[LLM] Unsupported LLM provider: ${appConfig.llm.provider}`);
        }
    }
}
