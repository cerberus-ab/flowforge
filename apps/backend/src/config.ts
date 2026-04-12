import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const pkgPath = path.resolve(process.cwd(), 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const LlmProviderTypeSchema = z.enum(['ollama-local', 'openai']).default('ollama-local');

const OllamaLocalConfigSchema = z.object({
    baseUrl: z
        .string()
        .refine(
            (val) => {
                try {
                    new URL(val);
                    return true;
                } catch {
                    return false;
                }
            },
            {
                message: 'Invalid URL',
            },
        )
        .default('http://localhost:11434'),
    model: z.string().default('llama3.1:latest'),
    embedding: z.string().default('nomic-embed-text'),
});

const OpenAiConfigSchema = z.object({
    apiKey: z.string(),
    model: z.string().default('gpt-4o-mini'),
    embedding: z.string().default('text-embedding-3-small'),
});

const AppConfigSchema = z
    .object({
        pkg: z.object({
            version: z.string().default('unknown'),
        }),
        port: z.coerce.number().int().positive().default(3477),
        nodeEnv: z.enum(['development', 'production']).default('development'),
        logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

        indexer: z.object({
            chunkSize: z.coerce.number().int().positive().default(500),
            chunkOverlapRatio: z.coerce.number().min(0).max(1).default(0.1),
        }),
        llm: z.object({
            provider: LlmProviderTypeSchema,
            ollamaLocal: OllamaLocalConfigSchema.optional(),
            openai: OpenAiConfigSchema.optional(),
        }),
        agent: z.object({
            toolCallLimit: z.coerce.number().int().positive().default(6),
            recursionLimit: z.coerce.number().int().positive().default(10),
            temperature: z.coerce.number().min(0).max(2).default(0.7),
            maxTokens: z.coerce.number().int().positive().default(1500),
        }),
    })
    .superRefine((config, ctx) => {
        if (config.llm.provider === 'ollama-local' && !config.llm.ollamaLocal) {
            ctx.addIssue({
                code: 'custom',
                path: ['llm', 'ollamaLocal'],
                message: 'Ollama Local configuration is required when LLM_PROVIDER=ollama-local',
            });
        }
        if (config.llm.provider === 'openai' && !config.llm.openai) {
            ctx.addIssue({
                code: 'custom',
                path: ['llm', 'openai'],
                message: 'OpenAI configuration is required when LLM_PROVIDER=openai',
            });
        }
    });

export type LlmProviderType = z.infer<typeof LlmProviderTypeSchema>;

function loadLlmConfig(provider: LlmProviderType) {
    switch (provider) {
        case 'ollama-local':
            return {
                provider,
                ollamaLocal: {
                    baseUrl: process.env.OLLAMA_LOCAL_BASE_URL,
                    model: process.env.OLLAMA_LOCAL_MODEL,
                    embedding: process.env.OLLAMA_LOCAL_EMBEDDING,
                },
            };
        case 'openai':
            return {
                provider,
                openai: {
                    apiKey: process.env.OPENAI_API_KEY,
                    model: process.env.OPENAI_MODEL,
                    embedding: process.env.OPENAI_EMBEDDING,
                },
            };
        default: {
            return { provider };
        }
    }
}

export type AppConfig = z.infer<typeof AppConfigSchema>;

export function loadAppConfig(): AppConfig {
    dotenv.config();

    const llmProviderType = LlmProviderTypeSchema.parse(process.env.LLM_PROVIDER);

    const config = {
        pkg: {
            version: pkg.version,
        },
        port: process.env.PORT,
        nodeEnv: process.env.NODE_ENV,
        logLevel: process.env.LOG_LEVEL,

        indexer: {
            chunkSize: process.env.INDEXER_CHUNK_SIZE,
            chunkOverlapRatio: process.env.INDEXER_CHUNK_OVERLAP_RATIO,
        },
        llm: loadLlmConfig(llmProviderType),
        agent: {
            toolCallLimit: process.env.AGENT_TOOL_CALL_LIMIT,
            recursionLimit: process.env.AGENT_RECURSION_LIMIT,
            temperature: process.env.AGENT_TEMPERATURE,
            maxTokens: process.env.AGENT_MAX_TOKENS,
        },
    };

    return AppConfigSchema.parse(config);
}
