import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage, AIMessage, createAgent } from 'langchain';
import type { BaseMessage } from 'langchain';

import { buildSystemPrompt, buildStructuredOutputPrompt } from './prompts.ts';
import { PageContextProvider } from '#self/indexer';
import type { AgentExecResult, ToolCallInfo, AgentResponse } from '#self/types';
import { ToolsRegistry } from './tools/ToolsRegistry.ts';
import type { AgentResult } from '@flowforge/shared';
import { AgentResultSchema } from '@flowforge/shared';

interface WebNavigationAgentOptions {
    chatModel: BaseChatModel;
    toolCallLimit?: number;
    recursionLimit?: number;
    verbose?: boolean;
}

export class WebNavigationAgent {
    private readonly chatModel: BaseChatModel;
    private readonly toolsRegistry: ToolsRegistry;
    private readonly toolCallLimit: number;
    private readonly recursionLimit: number;
    private readonly verbose: boolean;

    /**
     * Creates a new web navigation agent instance.
     *
     * @param options - Configuration options for the agent.
     * @param options.chatModel - Chat model used to run the agent.
     * @param options.toolCallLimit - Maximum number of tool calls allowed per query. Defaults to `5`.
     * @param options.recursionLimit - Maximum recursion depth for agent execution. Defaults to `10`.
     * @param options.verbose - Enables verbose logging when set to `true`. Defaults to `false`.
     */
    constructor(options: WebNavigationAgentOptions) {
        const config = {
            toolCallLimit: 5,
            recursionLimit: 10,
            verbose: false,
            ...options,
        };
        this.chatModel = config.chatModel;
        this.toolsRegistry = new ToolsRegistry();
        this.toolCallLimit = config.toolCallLimit;
        this.recursionLimit = config.recursionLimit;
        this.verbose = config.verbose;
    }

    /**
     * Processes a user query using the web navigation agent
     *
     * Invokes the agent with the provided question and page context, handles tool calls,
     * and structures the result into a standardized format.
     *
     * @param question - The user's query or question to process
     * @param pageContext - The page context provider for tool execution
     * @returns A promise that resolves to an Agent result containing success status, structured result, execution details, and timing information
     * @throws Does not throw; errors are caught and returned in the Agent result object
     */
    async processQuery(question: string, pageContext: PageContextProvider): Promise<AgentResponse> {
        const t0 = performance.now();
        const agent = createAgent({
            model: this.chatModel,
            tools: this.toolsRegistry.createStructuredTools(pageContext),
            // TODO: provide draft response format
            //responseFormat: AgentResultSchema,
            systemPrompt: buildSystemPrompt({
                toolCallLimit: this.toolCallLimit,
            }),
        });
        try {
            const agentInvokeState = await agent.invoke(
                { messages: [{ role: 'user', content: question }] },
                { recursionLimit: this.recursionLimit },
            );
            if (this.verbose) {
                console.log('[Agent] The invoke state:', agentInvokeState);
            }
            const agentExecResult = this.parseAgentExecResult(agentInvokeState);
            if (this.verbose) {
                console.log('[Agent] The execution result:', agentExecResult);
            }
            if (agentExecResult.lastAiMessageContent.length === 0) {
                throw new Error('Agent did not provide an answer.');
            }
            const agentResult = await this.structAgentResult(question, agentExecResult.lastAiMessageContent);
            return {
                success: true,
                result: agentResult,
                execResult: agentExecResult,
                execTimeMs: performance.now() - t0,
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('[Agent] Error processing query:', message);
            return {
                success: false,
                result: {
                    answer: `An error occurred: ${message}`,
                    elements: [],
                    mode: 'direct',
                    topic: null,
                },
                execResult: null,
                execTimeMs: performance.now() - t0,
            };
        }
    }

    private async structAgentResult(question: string, aiMessageContent: string): Promise<AgentResult> {
        let agentResult: AgentResult;
        try {
            const parsed = JSON.parse(aiMessageContent);
            agentResult = AgentResultSchema.parse(parsed);
        } catch (error) {
            if (this.verbose) {
                console.log(`[Agent] The execution result is not valid JSON, invoking structured prompt...`);
            }
            const formatter = this.chatModel.withStructuredOutput(AgentResultSchema);
            const result = await formatter.invoke(
                buildStructuredOutputPrompt({
                    question,
                    agentAnswer: aiMessageContent,
                }),
            );
            agentResult = AgentResultSchema.parse(result);
        }
        if (this.verbose) {
            console.log('[Agent] The structured result:', agentResult);
        }
        // filter out hallucinated elements
        agentResult.elements = agentResult.elements.filter((el) => {
            if (!el.dataId) {
                console.warn(`[Agent] Element with missing dataId found:`, el);
                return false;
            }
            return true;
        });
        return agentResult;
    }

    private parseAgentExecResult(invokeState: { messages: BaseMessage[] }): AgentExecResult {
        let tc = 0;
        let humanMessageContent = '';
        let lastAiMessageContent = '';
        const toolCallsList: ToolCallInfo[] = [];

        for (const message of invokeState.messages) {
            if (message instanceof HumanMessage && humanMessageContent.length === 0) {
                // from the first message
                humanMessageContent = typeof message?.content === 'string' ? message.content : '';
            } else if (message instanceof AIMessage) {
                if (message.tool_calls && message.tool_calls.length > 0) {
                    for (const call of message.tool_calls) {
                        tc += 1;
                        toolCallsList.push({ order: tc, name: call.name, args: call.args });
                    }
                }
                // from the last message
                lastAiMessageContent = typeof message?.content === 'string' ? message.content : '';
            }
        }
        return {
            humanMessageContent,
            lastAiMessageContent,
            toolCallsList,
        };
    }
}
