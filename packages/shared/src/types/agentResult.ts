import { z } from 'zod';

export const AgentResultElementActionSchema = z.enum(['click', 'navigate', 'input', 'select', 'highlight']);

export const AgentResultElementSchema = z.object({
    text: z.string(),
    dataId: z.string(),
    selector: z.string(),
    action: AgentResultElementActionSchema,
});

export const AgentResultModeSchema = z.enum(['direct', 'steps']);

export const AgentResultSchema = z.object({
    answer: z.string(),
    elements: z.array(AgentResultElementSchema),
    mode: AgentResultModeSchema,
    topic: z.string().nullable(),
});

export type AgentResultElementAction = z.infer<typeof AgentResultElementActionSchema>;
export type AgentResultElement = z.infer<typeof AgentResultElementSchema>;
export type AgentResultMode = z.infer<typeof AgentResultModeSchema>;
export type AgentResult = z.infer<typeof AgentResultSchema>;
