import React, { useState, useMemo } from 'react';
import { 
    IconSettings, 
    IconDatabase, 
    IconMessage, 
    IconInfoCircle, 
    IconAlertTriangle, 
    IconTrendingUp, 
    IconCoins, 
    IconChartBar, 
    IconChartLine, 
    IconSparkles, 
    IconArrowRight,
    IconAdjustments
} from '@tabler/icons-react';
import styles from './BedrockCalculator.module.css';

// Predefined model costs per 1 Million tokens
interface ModelConfig {
    name: string;
    inputCost: number; // cost per 1M input tokens
    outputCost: number; // cost per 1M output tokens
}

const PREDEFINED_MODELS: Record<string, ModelConfig> = {
    'claude-4-6-sonnet': {
        name: 'Anthropic Claude 4.6 Sonnet (us.anthropic.claude-sonnet-4-6)',
        inputCost: 3.00,
        outputCost: 15.00
    },
    'claude-3-7-sonnet': {
        name: 'Anthropic Claude 3.7 Sonnet',
        inputCost: 3.00,
        outputCost: 15.00
    },
    'claude-3-5-sonnet': {
        name: 'Anthropic Claude 3.5 Sonnet (v2)',
        inputCost: 3.00,
        outputCost: 15.00
    },
    'claude-4-5-haiku': {
        name: 'Anthropic Claude 4.5 Haiku',
        inputCost: 1.00,
        outputCost: 5.00
    },
    'claude-3-5-haiku': {
        name: 'Anthropic Claude 3.5 Haiku',
        inputCost: 0.80,
        outputCost: 4.00
    },
    'claude-3-opus': {
        name: 'Anthropic Claude 3 Opus',
        inputCost: 15.00,
        outputCost: 75.00
    },
    'titan-text-premier': {
        name: 'Amazon Titan Text Premier',
        inputCost: 0.50,
        outputCost: 1.50
    },
    'llama-3-1-70b': {
        name: 'Meta Llama 3.1 70B Instruct',
        inputCost: 0.72,
        outputCost: 0.72
    },
    'cohere-command-r-plus': {
        name: 'Cohere Command R+',
        inputCost: 2.50,
        outputCost: 10.00
    },
    'custom': {
        name: 'Custom Model Pricing',
        inputCost: 1.00,
        outputCost: 1.00
    }
};

// Embedding models pricing per 1 Million tokens
interface EmbeddingConfig {
    name: string;
    cost: number;
}

const EMBEDDING_MODELS: Record<string, EmbeddingConfig> = {
    'titan-embed-v2': {
        name: 'Amazon Titan Text Embeddings V2',
        cost: 0.015
    },
    'titan-embed-v1': {
        name: 'Amazon Titan Text Embeddings V1',
        cost: 0.10
    },
    'cohere-embed': {
        name: 'Cohere Embed English',
        cost: 0.10
    },
    'none': {
        name: 'No Embedding Cost',
        cost: 0
    }
};

export default function BedrockCalculator() {
    // Tab Navigation state
    const [activeTab, setActiveTab] = useState<'model' | 'kb' | 'chat'>('model');

    // Unit toggle (Tokens vs Characters)
    const [unitType, setUnitType] = useState<'tokens' | 'chars'>('tokens');

    // Input States
    const [selectedModel, setSelectedModel] = useState<string>('claude-4-6-sonnet');
    const [customInputCost, setCustomInputCost] = useState<number>(3.00);
    const [customOutputCost, setCustomOutputCost] = useState<number>(15.00);

    const [selectedEmbedding, setSelectedEmbedding] = useState<string>('titan-embed-v2');

    // Knowledge Bases Configuration
    const [numKbs, setNumKbs] = useState<number>(2);
    const [chunksPerKb, setChunksPerKb] = useState<number>(3);
    const [chunkSizeVal, setChunkSizeVal] = useState<number>(300); // either tokens or chars based on unitType

    // Agent mode & orchestration parameters
    const [orchestrationMode, setOrchestrationMode] = useState<'agent' | 'direct'>('agent');
    const [orchestrationSteps, setOrchestrationSteps] = useState<number>(2);
    const [thoughtTokensVal, setThoughtTokensVal] = useState<number>(150); // either tokens or chars

    // Chat / Conversation parameters
    const [numTurns, setNumTurns] = useState<number>(10);
    const [systemPromptVal, setSystemPromptVal] = useState<number>(1000);
    const [userMessageVal, setUserMessageVal] = useState<number>(150);
    const [agentResponseVal, setAgentResponseVal] = useState<number>(400);

    // Infrastructure cost toggle
    const [includeAossHost, setIncludeAossHost] = useState<boolean>(true);
    // Reranking toggle
    const [enableReranking, setEnableReranking] = useState<boolean>(false);

    // Helpers to convert to tokens for math calculations
    const getTokens = (value: number, type: 'tokens' | 'chars') => {
        if (type === 'chars') {
            return Math.ceil(value / 4); // Standard approximation: 1 token ≈ 4 characters
        }
        return value;
    };

    // Derived actual token values
    const tokens = useMemo(() => {
        return {
            systemPrompt: getTokens(systemPromptVal, unitType),
            userMessage: getTokens(userMessageVal, unitType),
            agentResponse: getTokens(agentResponseVal, unitType),
            chunkSize: getTokens(chunkSizeVal, unitType),
            thoughtTokens: getTokens(thoughtTokensVal, unitType)
        };
    }, [systemPromptVal, userMessageVal, agentResponseVal, chunkSizeVal, thoughtTokensVal, unitType]);

    // Active LLM model pricing
    const modelPricing = useMemo(() => {
        if (selectedModel === 'custom') {
            return { input: customInputCost, output: customOutputCost };
        }
        const config = PREDEFINED_MODELS[selectedModel];
        return { input: config.inputCost, output: config.outputCost };
    }, [selectedModel, customInputCost, customOutputCost]);

    // Active embedding model pricing
    const embeddingPricing = useMemo(() => {
        return EMBEDDING_MODELS[selectedEmbedding].cost;
    }, [selectedEmbedding]);

    // Detailed Turn-by-Turn Cost Calculation Engine
    const calculations = useMemo(() => {
        const inputRate = modelPricing.input / 1_000_000;
        const outputRate = modelPricing.output / 1_000_000;
        const embedRate = embeddingPricing / 1_000_000;
        const rerankRate = enableReranking ? 0.001 : 0; // $1.00 per 1K queries = $0.001 per query

        // Let's compute details for the SELECTED mode
        const turnsData: Array<{
            turn: number;
            inputTokens: number;
            outputTokens: number;
            embedTokens: number;
            inputCost: number;
            outputCost: number;
            embedCost: number;
            rerankCost: number;
            totalCost: number;
            cumulativeCost: number;
        }> = [];

        // Direct RAG (Single-step) comparison calculations for graphing
        const directTurnsData: Array<{
            turn: number;
            totalCost: number;
            cumulativeCost: number;
        }> = [];

        let cumulativeCostAgent = 0;
        let cumulativeCostDirect = 0;

        for (let i = 1; i <= numTurns; i++) {
            // Context history accumulated up to turn i: (previous turns' user messages + response messages)
            const historyTokens = (i - 1) * (tokens.userMessage + tokens.agentResponse);

            // Total retrieved tokens from Knowledge Bases:
            const kbRetrievedTokens = numKbs * chunksPerKb * tokens.chunkSize;

            // Embedding queries: user query is embedded once to search both KBs
            const embedTokens = tokens.userMessage;
            const turnEmbedCost = embedTokens * embedRate;

            // Reranking cost: if enabled, we do 1 reranking process per turn
            const turnRerankCost = rerankRate;

            // 1. Bedrock Agent Loop Cost Calculation
            // Let's assume orchestrationSteps steps.
            const steps = orchestrationMode === 'agent' ? orchestrationSteps : 1;
            
            // In a Bedrock Agent (using ReAct or orchestration loop):
            // - The system prompt, history, and user input are processed in EVERY step.
            // - Intermediate thoughts are generated: (steps - 1) thoughts, each size T_thought.
            // - Thoughts accumulate as input for subsequent steps.
            // - KB chunks are retrieved and sent as context for steps after the first step.
            
            let turnAgentInputTokens = 0;
            let turnAgentOutputTokens = 0;

            if (orchestrationMode === 'agent') {
                // Step 1: Orchestration / Retrieve decide
                // Input: System Prompt + History + User Message
                const step1Input = tokens.systemPrompt + historyTokens + tokens.userMessage;
                // Output: Orchestration thought
                const step1Output = tokens.thoughtTokens;

                turnAgentInputTokens += step1Input;
                turnAgentOutputTokens += step1Output;

                // Step 2 to S: Subsequent execution / Final Response
                // In a typical 2-step agent, Step 2 is the final answer step.
                // Input: System Prompt + History + User Message + Step 1 thoughts + KB Retrieval Chunks
                // Output: Final response
                for (let s = 2; s <= steps; s++) {
                    // Chunks are included starting step 2
                    const chunksInput = kbRetrievedTokens;
                    // Accumulated thoughts from previous steps in this turn
                    const thoughtsInput = (s - 1) * tokens.thoughtTokens;
                    
                    const stepInput = tokens.systemPrompt + historyTokens + tokens.userMessage + thoughtsInput + chunksInput;
                    turnAgentInputTokens += stepInput;
                    
                    if (s === steps) {
                        turnAgentOutputTokens += tokens.agentResponse;
                    } else {
                        turnAgentOutputTokens += tokens.thoughtTokens;
                    }
                }
            } else {
                // Direct RAG (Single LLM Call)
                // Input: System Prompt + History + User Message + KB Retrieval Chunks
                // Output: Agent Response
                turnAgentInputTokens = tokens.systemPrompt + historyTokens + tokens.userMessage + kbRetrievedTokens;
                turnAgentOutputTokens = tokens.agentResponse;
            }

            const turnAgentInputCost = turnAgentInputTokens * inputRate;
            const turnAgentOutputCost = turnAgentOutputTokens * outputRate;
            const turnTotalCostAgent = turnAgentInputCost + turnAgentOutputCost + turnEmbedCost + turnRerankCost;

            cumulativeCostAgent += turnTotalCostAgent;

            turnsData.push({
                turn: i,
                inputTokens: turnAgentInputTokens,
                outputTokens: turnAgentOutputTokens,
                embedTokens,
                inputCost: turnAgentInputCost,
                outputCost: turnAgentOutputCost,
                embedCost: turnEmbedCost,
                rerankCost: turnRerankCost,
                totalCost: turnTotalCostAgent,
                cumulativeCost: cumulativeCostAgent
            });

            // 2. Direct RAG Cumulative Cost (For visual comparison chart)
            const directInputTokens = tokens.systemPrompt + historyTokens + tokens.userMessage + kbRetrievedTokens;
            const directOutputTokens = tokens.agentResponse;
            const directInputCost = directInputTokens * inputRate;
            const directOutputCost = directOutputTokens * outputRate;
            const turnTotalCostDirect = directInputCost + directOutputCost + turnEmbedCost + turnRerankCost;

            cumulativeCostDirect += turnTotalCostDirect;

            directTurnsData.push({
                turn: i,
                totalCost: turnTotalCostDirect,
                cumulativeCost: cumulativeCostDirect
            });
        }

        // Totals for active mode
        const totalInputTokens = turnsData.reduce((sum, t) => sum + t.inputTokens, 0);
        const totalOutputTokens = turnsData.reduce((sum, t) => sum + t.outputTokens, 0);
        const totalEmbeddingTokens = turnsData.reduce((sum, t) => sum + t.embedTokens, 0);

        const totalInputCost = turnsData.reduce((sum, t) => sum + t.inputCost, 0);
        const totalOutputCost = turnsData.reduce((sum, t) => sum + t.outputCost, 0);
        const totalEmbeddingCost = turnsData.reduce((sum, t) => sum + t.embedCost, 0);
        const totalRerankCost = turnsData.reduce((sum, t) => sum + t.rerankCost, 0);
        
        const totalCost = cumulativeCostAgent;
        const costPer1K = totalCost * 1000;

        // Breakdown categorization (to show in the details graph)
        // System Prompt cost represents the cost of processing the system prompt across all turns & steps
        const stepsPerTurn = orchestrationMode === 'agent' ? orchestrationSteps : 1;
        const systemPromptCost = (numTurns * stepsPerTurn * tokens.systemPrompt) * inputRate;

        // History cost represents the cost of carrying conversation history
        let historyCost = 0;
        for (let i = 1; i <= numTurns; i++) {
            const historyTokens = (i - 1) * (tokens.userMessage + tokens.agentResponse);
            historyCost += (stepsPerTurn * historyTokens) * inputRate;
        }

        // KB Chunks cost represents the cost of processing retrieved chunks
        // Chunks are included for steps >= 2. (i.e. stepsPerTurn - 1 times per turn)
        const kbChunksCost = numTurns * Math.max(1, stepsPerTurn - 1) * (numKbs * chunksPerKb * tokens.chunkSize) * inputRate;

        // Thought cost (LLM reasoning steps: input + output)
        let thoughtCost = 0;
        if (orchestrationMode === 'agent' && stepsPerTurn > 1) {
            // Output tokens for thoughts
            const thoughtOutputCost = numTurns * (stepsPerTurn - 1) * tokens.thoughtTokens * outputRate;
            // Input tokens for thoughts (Step 2 sees Step 1, Step 3 sees Step 1&2, etc.)
            let thoughtInputCount = 0;
            for (let s = 2; s <= stepsPerTurn; s++) {
                thoughtInputCount += (s - 1) * tokens.thoughtTokens;
            }
            const thoughtInputCost = numTurns * thoughtInputCount * inputRate;
            thoughtCost = thoughtOutputCost + thoughtInputCost;
        }

        // Embedding query cost
        const embeddingCost = totalEmbeddingCost;

        // User messages input cost
        const userMsgCost = (numTurns * stepsPerTurn * tokens.userMessage) * inputRate;

        // Final response cost
        const finalResponseCost = numTurns * tokens.agentResponse * outputRate;

        return {
            turns: turnsData,
            directTurns: directTurnsData,
            totals: {
                totalInputTokens,
                totalOutputTokens,
                totalEmbeddingTokens,
                totalInputCost,
                totalOutputCost,
                totalEmbeddingCost,
                totalRerankCost,
                totalCost,
                costPer1K
            },
            breakdown: {
                systemPrompt: systemPromptCost,
                history: historyCost,
                kbChunks: kbChunksCost,
                thoughts: thoughtCost,
                embeddings: embeddingCost,
                userMessages: userMsgCost,
                finalResponses: finalResponseCost,
                reranking: totalRerankCost
            }
        };
    }, [
        modelPricing, 
        embeddingPricing, 
        tokens, 
        numTurns, 
        numKbs, 
        chunksPerKb, 
        orchestrationMode, 
        orchestrationSteps, 
        enableReranking
    ]);

    // OpenSearch Serverless estimated monthly pricing (4 OCUs minimum, 2 indexing + 2 search)
    const ocuCostPerHour = 0.24;
    const aossMonthlyCost = 4 * ocuCostPerHour * 24 * 30.5; // ~$702.72

    // Max cost for scaling graph axes
    const maxGraphCost = useMemo(() => {
        const agentMax = calculations.turns[numTurns - 1]?.cumulativeCost || 0.1;
        const directMax = calculations.directTurns[numTurns - 1]?.cumulativeCost || 0.1;
        return Math.max(agentMax, directMax) * 1.1; // Add 10% headroom
    }, [calculations, numTurns]);

    // Recommendations and warnings based on calculations
    const insights = useMemo(() => {
        const list = [];
        
        const historyRatio = calculations.breakdown.history / calculations.totals.totalCost;
        const systemPromptRatio = calculations.breakdown.systemPrompt / calculations.totals.totalCost;
        const kbRatio = calculations.breakdown.kbChunks / calculations.totals.totalCost;
        const thoughtRatio = calculations.breakdown.thoughts / calculations.totals.totalCost;

        if (orchestrationMode === 'agent' && thoughtRatio > 0.2) {
            list.push({
                type: 'warning',
                text: `Agent reasoning (thoughts) consumes ${(thoughtRatio * 100).toFixed(0)}% of your budget. Consider optimizing agent instructions to exit loops faster or lower thoughts tokens size.`
            });
        }

        if (historyRatio > 0.35) {
            list.push({
                type: 'caution',
                text: `Conversation history constitutes ${(historyRatio * 100).toFixed(0)}% of the cost. Implement sliding-window history truncation or session-memory summarization to save up to ${(historyRatio * 50).toFixed(0)}% of your cost.`
            });
        }

        if (systemPromptRatio > 0.40) {
            list.push({
                type: 'info',
                text: `System prompt repetition is driving ${(systemPromptRatio * 100).toFixed(0)}% of costs. With multi-step agents, system prompts are re-processed on every step. Consider using Bedrock Prompt Caching if available or streamlining instructions.`
            });
        }

        if (kbRatio > 0.3) {
            list.push({
                type: 'info',
                text: `Retrieval context (KB chunks) represents ${(kbRatio * 100).toFixed(0)}% of total cost. Review if retrieving ${chunksPerKb} chunks per knowledge base is necessary, or decrease chunk sizes.`
            });
        }

        if (selectedModel === 'claude-3-opus') {
            list.push({
                type: 'warning',
                text: 'Claude 3 Opus is highly expensive ($15/$75). Switching to Claude 3.5 Sonnet will reduce costs by 80% without losing performance, or Claude 3.5 Haiku for a 95% reduction.'
            });
        }

        if (list.length === 0) {
            list.push({
                type: 'success',
                text: 'Your current architecture is cost-optimized! Token distribution is balanced across system prompts, history, and retrieved context.'
            });
        }

        return list;
    }, [calculations, orchestrationMode, selectedModel, chunksPerKb]);

    // Custom Line Chart rendering coordinates
    const chartWidth = 500;
    const chartHeight = 240;
    const chartPadding = { top: 20, right: 30, bottom: 40, left: 60 };

    const getSvgCoords = (turn: number, cost: number) => {
        const xRange = chartWidth - chartPadding.left - chartPadding.right;
        const yRange = chartHeight - chartPadding.top - chartPadding.bottom;
        
        const x = chartPadding.left + ((turn - 1) / Math.max(1, numTurns - 1)) * xRange;
        const y = chartHeight - chartPadding.bottom - (cost / maxGraphCost) * yRange;
        return { x, y };
    };

    const agentLinePath = useMemo(() => {
        if (calculations.turns.length === 0) return '';
        return calculations.turns.map((t, idx) => {
            const { x, y } = getSvgCoords(t.turn, t.cumulativeCost);
            return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
        }).join(' ');
    }, [calculations.turns, maxGraphCost, numTurns]);

    const directLinePath = useMemo(() => {
        if (calculations.directTurns.length === 0) return '';
        return calculations.directTurns.map((t, idx) => {
            const { x, y } = getSvgCoords(t.turn, t.cumulativeCost);
            return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
        }).join(' ');
    }, [calculations.directTurns, maxGraphCost, numTurns]);

    // Breakdown bars
    const breakdownData = useMemo(() => {
        const total = calculations.totals.totalCost || 1;
        const items = [
            { label: 'System Instructions', value: calculations.breakdown.systemPrompt, color: '#6366f1' }, // Indigo
            { label: 'Session History', value: calculations.breakdown.history, color: '#f59e0b' }, // Amber
            { label: 'KB Retrieved Context', value: calculations.breakdown.kbChunks, color: '#10b981' }, // Teal
            { label: 'User Queries', value: calculations.breakdown.userMessages, color: '#06b6d4' }, // Cyan
            { label: 'Agent Steps (Thoughts)', value: calculations.breakdown.thoughts, color: '#a855f7' }, // Purple
            { label: 'Final LLM Responses', value: calculations.breakdown.finalResponses, color: '#ec4899' }, // Pink
            { label: 'Embedding & Search', value: calculations.breakdown.embeddings + calculations.breakdown.reranking, color: '#64748b' } // Slate
        ];

        return items
            .filter(item => item.value > 0)
            .map(item => ({
                ...item,
                percentage: (item.value / total) * 100
            }))
            .sort((a, b) => b.value - a.value);
    }, [calculations]);

    return (
        <div className={styles['calc-wrapper']}>
            <div className={styles['calc-header']}>
                <div className={styles['title-container']}>
                    <IconSparkles className={styles['title-icon']} size={28} />
                    <div>
                        <h3>AWS Bedrock Cost Calculator</h3>
                        <p>Evaluate multi-turn token compounding in RAG Knowledge Bases & AI Agents</p>
                    </div>
                </div>

                <div className={styles['control-row']}>
                    {/* Unit Switcher */}
                    <div className={styles['unit-toggle']}>
                        <button 
                            className={unitType === 'tokens' ? styles['active-unit'] : ''} 
                            onClick={() => setUnitType('tokens')}
                        >
                            Tokens
                        </button>
                        <button 
                            className={unitType === 'chars' ? styles['active-unit'] : ''} 
                            onClick={() => setUnitType('chars')}
                        >
                            Characters
                        </button>
                    </div>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className={styles['metrics-grid']}>
                <div className={styles['metric-card']}>
                    <div className={styles['metric-icon-bg']} style={{ color: 'var(--accent-cyan)' }}>
                        <IconCoins size={22} />
                    </div>
                    <div className={styles['metric-info']}>
                        <span className={styles['metric-label']}>Cost Per Conversation</span>
                        <h4 className={styles['metric-value']}>
                            ${calculations.totals.totalCost.toFixed(4)}
                        </h4>
                    </div>
                </div>

                <div className={styles['metric-card']}>
                    <div className={styles['metric-icon-bg']} style={{ color: 'var(--accent-indigo)' }}>
                        <IconTrendingUp size={22} />
                    </div>
                    <div className={styles['metric-info']}>
                        <span className={styles['metric-label']}>Cost Per 1,000 Chats</span>
                        <h4 className={styles['metric-value']}>
                            ${calculations.totals.costPer1K.toFixed(2)}
                        </h4>
                    </div>
                </div>

                <div className={styles['metric-card']}>
                    <div className={styles['metric-icon-bg']} style={{ color: 'var(--accent-teal)' }}>
                        <IconMessage size={22} />
                    </div>
                    <div className={styles['metric-info']}>
                        <span className={styles['metric-label']}>Total LLM Tokens</span>
                        <h4 className={styles['metric-value']}>
                            {(calculations.totals.totalInputTokens + calculations.totals.totalOutputTokens).toLocaleString()}
                        </h4>
                        <span className={styles['metric-sub']}>
                            In: {calculations.totals.totalInputTokens.toLocaleString()} | Out: {calculations.totals.totalOutputTokens.toLocaleString()}
                        </span>
                    </div>
                </div>

                <div className={styles['metric-card']}>
                    <div className={styles['metric-icon-bg']} style={{ color: '#f59e0b' }}>
                        <IconDatabase size={22} />
                    </div>
                    <div className={styles['metric-info']}>
                        <span className={styles['metric-label']}>Fixed Infrastructure</span>
                        <h4 className={styles['metric-value']}>
                            {includeAossHost ? `$${aossMonthlyCost.toFixed(0)}/mo` : '$0'}
                        </h4>
                        <span className={styles['metric-sub']}>
                            {includeAossHost ? '4x OpenSearch OCUs' : 'Excluding Vector DB'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Interactive Work Area */}
            <div className={styles['main-layout']}>
                {/* Configuration Panel (Left) */}
                <div className={styles['config-panel']}>
                    {/* Inner Tabs */}
                    <div className={styles['tab-bar']}>
                        <button 
                            className={activeTab === 'model' ? styles['active-tab'] : ''}
                            onClick={() => setActiveTab('model')}
                        >
                            <IconSettings size={16} />
                            <span>Model & Agent</span>
                        </button>
                        <button 
                            className={activeTab === 'kb' ? styles['active-tab'] : ''}
                            onClick={() => setActiveTab('kb')}
                        >
                            <IconDatabase size={16} />
                            <span>Knowledge Bases</span>
                        </button>
                        <button 
                            className={activeTab === 'chat' ? styles['active-tab'] : ''}
                            onClick={() => setActiveTab('chat')}
                        >
                            <IconMessage size={16} />
                            <span>Chat Profile</span>
                        </button>
                    </div>

                    {/* Tab Contents */}
                    <div className={styles['tab-content']}>
                        {activeTab === 'model' && (
                            <div className={styles['input-group']}>
                                <div className={styles['form-item']}>
                                    <label>Foundation Model</label>
                                    <select 
                                        value={selectedModel} 
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                        className={styles['styled-select']}
                                    >
                                        {Object.entries(PREDEFINED_MODELS).map(([key, value]) => (
                                            <option key={key} value={key}>{value.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {selectedModel === 'custom' ? (
                                    <div className={styles['flex-row']}>
                                        <div className={styles['form-item']}>
                                            <label>Input Cost / 1M Tokens ($)</label>
                                            <input 
                                                type="number" 
                                                value={customInputCost}
                                                onChange={(e) => setCustomInputCost(parseFloat(e.target.value) || 0)}
                                                className={styles['styled-input']}
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                        <div className={styles['form-item']}>
                                            <label>Output Cost / 1M Tokens ($)</label>
                                            <input 
                                                type="number" 
                                                value={customOutputCost}
                                                onChange={(e) => setCustomOutputCost(parseFloat(e.target.value) || 0)}
                                                className={styles['styled-input']}
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles['model-pricing-info']}>
                                        <div className={styles['pricing-chip']}>
                                            <span>Input (1M):</span>
                                            <strong>${modelPricing.input.toFixed(2)}</strong>
                                        </div>
                                        <div className={styles['pricing-chip']}>
                                            <span>Output (1M):</span>
                                            <strong>${modelPricing.output.toFixed(2)}</strong>
                                        </div>
                                    </div>
                                )}

                                <div className={styles['divider']}></div>

                                <div className={styles['form-item']}>
                                    <div className={styles['label-row']}>
                                        <label>Orchestration Architecture</label>
                                        <span className={styles['badge']}>
                                            {orchestrationMode === 'agent' ? 'Multi-Step ReAct' : 'Single Invocation'}
                                        </span>
                                    </div>
                                    <div className={styles['toggle-group']}>
                                        <button 
                                            className={orchestrationMode === 'agent' ? styles['active-toggle'] : ''}
                                            onClick={() => setOrchestrationMode('agent')}
                                        >
                                            Bedrock Agent Mode
                                        </button>
                                        <button 
                                            className={orchestrationMode === 'direct' ? styles['active-toggle'] : ''}
                                            onClick={() => setOrchestrationMode('direct')}
                                        >
                                            Direct RAG (Standard)
                                        </button>
                                    </div>
                                </div>

                                {orchestrationMode === 'agent' && (
                                    <>
                                        <div className={styles['form-item']}>
                                            <div className={styles['slider-header']}>
                                                <label>Agent Steps Per Message</label>
                                                <span className={styles['slider-val']}>{orchestrationSteps} steps</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="1" 
                                                max="5" 
                                                value={orchestrationSteps} 
                                                onChange={(e) => setOrchestrationSteps(parseInt(e.target.value))}
                                                className={styles['styled-slider']}
                                            />
                                            <span className={styles['field-desc']}>
                                                The number of internal LLM calls the agent makes before replying (e.g. step 1: retrieve planning, step 2: reply).
                                            </span>
                                        </div>

                                        <div className={styles['form-item']}>
                                            <div className={styles['slider-header']}>
                                                <label>Internal Agent Thought Size</label>
                                                <span className={styles['slider-val']}>
                                                    {thoughtTokensVal.toLocaleString()} {unitType}
                                                </span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min={unitType === 'tokens' ? 25 : 100} 
                                                max={unitType === 'tokens' ? 500 : 2000} 
                                                step={unitType === 'tokens' ? 25 : 100}
                                                value={thoughtTokensVal} 
                                                onChange={(e) => setThoughtTokensVal(parseInt(e.target.value))}
                                                className={styles['styled-slider']}
                                            />
                                            <span className={styles['field-desc']}>
                                                Estimated length of intermediate thought chains/actions generated per agent reasoning step.
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'kb' && (
                            <div className={styles['input-group']}>
                                <div className={styles['form-item']}>
                                    <label>Embedding Model (For Queries)</label>
                                    <select 
                                        value={selectedEmbedding} 
                                        onChange={(e) => setSelectedEmbedding(e.target.value)}
                                        className={styles['styled-select']}
                                    >
                                        {Object.entries(EMBEDDING_MODELS).map(([key, value]) => (
                                            <option key={key} value={key}>{value.name}</option>
                                        ))}
                                    </select>
                                    {selectedEmbedding !== 'none' && (
                                        <span className={styles['field-desc']} style={{ marginTop: '4px', display: 'block' }}>
                                            Query text is embedded at search time: <strong>${EMBEDDING_MODELS[selectedEmbedding].cost.toFixed(3)}/1M tokens</strong>.
                                        </span>
                                    )}
                                </div>

                                <div className={styles['divider']}></div>

                                <div className={styles['form-item']}>
                                    <div className={styles['slider-header']}>
                                        <label>Active Knowledge Bases</label>
                                        <span className={styles['slider-val']}>{numKbs} KBs</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="4" 
                                        value={numKbs} 
                                        onChange={(e) => setNumKbs(parseInt(e.target.value))}
                                        className={styles['styled-slider']}
                                    />
                                    <span className={styles['field-desc']}>
                                        Number of knowledge bases queried per retrieval step.
                                    </span>
                                </div>

                                <div className={styles['form-item']}>
                                    <div className={styles['slider-header']}>
                                        <label>Retrieved Chunks Per KB</label>
                                        <span className={styles['slider-val']}>{chunksPerKb} chunks</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="8" 
                                        value={chunksPerKb} 
                                        onChange={(e) => setChunksPerKb(parseInt(e.target.value))}
                                        className={styles['styled-slider']}
                                    />
                                    <span className={styles['field-desc']}>
                                        Number of top-matching vector documents returned from each KB.
                                    </span>
                                </div>

                                <div className={styles['form-item']}>
                                    <div className={styles['slider-header']}>
                                        <label>Individual Chunk Size</label>
                                        <span className={styles['slider-val']}>
                                            {chunkSizeVal.toLocaleString()} {unitType}
                                        </span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min={unitType === 'tokens' ? 100 : 400} 
                                        max={unitType === 'tokens' ? 5000 : 20000} 
                                        step={unitType === 'tokens' ? 50 : 200}
                                        value={chunkSizeVal} 
                                        onChange={(e) => setChunkSizeVal(parseInt(e.target.value))}
                                        className={styles['styled-slider']}
                                    />
                                </div>

                                <div className={styles['divider']}></div>

                                <div className={styles['checkbox-group']}>
                                    <label className={styles['styled-checkbox-container']}>
                                        <input 
                                            type="checkbox" 
                                            checked={enableReranking} 
                                            onChange={(e) => setEnableReranking(e.target.checked)}
                                        />
                                        <span className={styles['checkmark']}></span>
                                        <div>
                                            <strong>Enable Amazon Rerank</strong>
                                            <p>Adds $1.00 per 1,000 queries ($0.001/query) for ranking context.</p>
                                        </div>
                                    </label>

                                    <label className={styles['styled-checkbox-container']}>
                                        <input 
                                            type="checkbox" 
                                            checked={includeAossHost} 
                                            onChange={(e) => setIncludeAossHost(e.target.checked)}
                                        />
                                        <span className={styles['checkmark']}></span>
                                        <div>
                                            <strong>Include OpenSearch Serverless Hosting</strong>
                                            <p>Estimates the monthly minimum OCU cost (~$700) in infrastructure.</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {activeTab === 'chat' && (
                            <div className={styles['input-group']}>
                                <div className={styles['form-item']}>
                                    <div className={styles['slider-header']}>
                                        <label>Conversation Length (Turns)</label>
                                        <span className={styles['slider-val']}>{numTurns} message cycles</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="30" 
                                        value={numTurns} 
                                        onChange={(e) => setNumTurns(parseInt(e.target.value))}
                                        className={styles['styled-slider']}
                                    />
                                    <span className={styles['field-desc']}>
                                        Number of user-to-agent exchanges in a single dialogue.
                                    </span>
                                </div>

                                <div className={styles['form-item']}>
                                    <div className={styles['slider-header']}>
                                        <label>System Instructions Prompt Size</label>
                                        <span className={styles['slider-val']}>
                                            {systemPromptVal.toLocaleString()} {unitType}
                                        </span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min={unitType === 'tokens' ? 100 : 400} 
                                        max={unitType === 'tokens' ? 5000 : 20000} 
                                        step={unitType === 'tokens' ? 100 : 400}
                                        value={systemPromptVal} 
                                        onChange={(e) => setSystemPromptVal(parseInt(e.target.value))}
                                        className={styles['styled-slider']}
                                    />
                                    <span className={styles['field-desc']}>
                                        The base developer prompt / orchestrator definition given to the agent.
                                    </span>
                                </div>

                                <div className={styles['form-item']}>
                                    <div className={styles['slider-header']}>
                                        <label>Average User Message Size</label>
                                        <span className={styles['slider-val']}>
                                            {userMessageVal.toLocaleString()} {unitType}
                                        </span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min={unitType === 'tokens' ? 20 : 80} 
                                        max={unitType === 'tokens' ? 1000 : 4000} 
                                        step={unitType === 'tokens' ? 20 : 80}
                                        value={userMessageVal} 
                                        onChange={(e) => setUserMessageVal(parseInt(e.target.value))}
                                        className={styles['styled-slider']}
                                    />
                                </div>

                                <div className={styles['form-item']}>
                                    <div className={styles['slider-header']}>
                                        <label>Average Agent Response Size</label>
                                        <span className={styles['slider-val']}>
                                            {agentResponseVal.toLocaleString()} {unitType}
                                        </span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min={unitType === 'tokens' ? 50 : 200} 
                                        max={unitType === 'tokens' ? 2000 : 8000} 
                                        step={unitType === 'tokens' ? 50 : 200}
                                        value={agentResponseVal} 
                                        onChange={(e) => setAgentResponseVal(parseInt(e.target.value))}
                                        className={styles['styled-slider']}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Results & Visual Analytics Panel (Right) */}
                <div className={styles['results-panel']}>
                    {/* Toggle Visualization Option */}
                    <div className={styles['panel-header']}>
                        <h4>Cost Growth & Breakdown</h4>
                        <span className={styles['helper-text']}>
                            Comparing: {orchestrationMode === 'agent' ? 'Agent ReAct' : 'Direct RAG'} vs Direct RAG
                        </span>
                    </div>

                    {/* Chart Container */}
                    <div className={styles['chart-area']}>
                        {/* SVG Line Graph */}
                        <div className={styles['svg-container']}>
                            <svg 
                                width="100%" 
                                height={chartHeight} 
                                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                                className={styles['svg-chart']}
                            >
                                {/* Grid Lines */}
                                {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
                                    const yVal = chartPadding.top + r * (chartHeight - chartPadding.top - chartPadding.bottom);
                                    return (
                                        <line 
                                            key={idx}
                                            x1={chartPadding.left} 
                                            y1={yVal} 
                                            x2={chartWidth - chartPadding.right} 
                                            y2={yVal} 
                                            stroke="var(--border-color)" 
                                            strokeDasharray="4 4"
                                        />
                                    );
                                })}

                                {/* Left Y-Axis Labels */}
                                {[1, 0.75, 0.5, 0.25, 0].map((r, idx) => {
                                    const yVal = chartPadding.top + (1 - r) * (chartHeight - chartPadding.top - chartPadding.bottom);
                                    const labelVal = maxGraphCost * r;
                                    return (
                                        <text 
                                            key={idx}
                                            x={chartPadding.left - 10} 
                                            y={yVal + 4} 
                                            className={styles['chart-axis-text']}
                                            textAnchor="end"
                                        >
                                            ${labelVal.toFixed(3)}
                                        </text>
                                    );
                                })}

                                {/* X-Axis Labels (Turns) */}
                                {Array.from({ length: Math.min(6, numTurns) }).map((_, idx, arr) => {
                                    const turnNum = Math.max(1, Math.round(1 + (idx / Math.max(1, arr.length - 1)) * (numTurns - 1)));
                                    const { x } = getSvgCoords(turnNum, 0);
                                    return (
                                        <text 
                                            key={idx}
                                            x={x} 
                                            y={chartHeight - chartPadding.bottom + 20} 
                                            className={styles['chart-axis-text']}
                                            textAnchor="middle"
                                        >
                                            Turn {turnNum}
                                        </text>
                                    );
                                })}

                                {/* X-Axis label */}
                                <text 
                                    x={(chartWidth + chartPadding.left) / 2} 
                                    y={chartHeight - 8} 
                                    className={styles['chart-title-text']}
                                    textAnchor="middle"
                                >
                                    Conversation Progress (Turns)
                                </text>

                                {/* Direct RAG line (Cyan dashed) */}
                                {orchestrationMode === 'agent' && (
                                    <path 
                                        d={directLinePath} 
                                        fill="none" 
                                        stroke="var(--accent-cyan)" 
                                        strokeWidth="2" 
                                        strokeDasharray="4 4"
                                        opacity="0.6"
                                    />
                                )}

                                {/* Main Active Configuration Line (Solid Teal/Indigo) */}
                                <path 
                                    d={agentLinePath} 
                                    fill="none" 
                                    stroke={orchestrationMode === 'agent' ? 'var(--accent-indigo)' : 'var(--accent-teal)'} 
                                    strokeWidth="3.5" 
                                />

                                {/* Draw dots for turns */}
                                {calculations.turns.map((t, idx) => {
                                    const { x, y } = getSvgCoords(t.turn, t.cumulativeCost);
                                    // only draw dots for up to 15 turns to avoid clutter
                                    if (numTurns > 15 && t.turn % 2 !== 0 && t.turn !== numTurns) return null;
                                    return (
                                        <circle 
                                            key={idx}
                                            cx={x} 
                                            cy={y} 
                                            r="4" 
                                            fill={orchestrationMode === 'agent' ? 'var(--accent-indigo)' : 'var(--accent-teal)'} 
                                            stroke="var(--bg-secondary)"
                                            strokeWidth="1.5"
                                        />
                                    );
                                })}
                            </svg>
                        </div>

                        {/* Chart Legend */}
                        <div className={styles['chart-legend']}>
                            <div className={styles['legend-item']}>
                                <span 
                                    className={styles['legend-dot']} 
                                    style={{ backgroundColor: orchestrationMode === 'agent' ? 'var(--accent-indigo)' : 'var(--accent-teal)' }}
                                ></span>
                                <span>Active Config (${calculations.totals.totalCost.toFixed(4)})</span>
                            </div>
                            {orchestrationMode === 'agent' && (
                                <div className={styles['legend-item']}>
                                    <span 
                                        className={styles['legend-dot']} 
                                        style={{ backgroundColor: 'var(--accent-cyan)', border: '1px dashed currentColor' }}
                                    ></span>
                                    <span>Direct RAG Equivalent (${calculations.directTurns[numTurns - 1]?.cumulativeCost.toFixed(4)})</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cost Breakdown Details */}
                    <div className={styles['breakdown-section']}>
                        <h5>Cost Drivers & Breakdown</h5>
                        <div className={styles['bars-container']}>
                            {breakdownData.map((item, idx) => (
                                <div key={idx} className={styles['bar-row']}>
                                    <div className={styles['bar-label-group']}>
                                        <span>{item.label}</span>
                                        <span>${item.value.toFixed(4)} ({item.percentage.toFixed(1)}%)</span>
                                    </div>
                                    <div className={styles['bar-outer']}>
                                        <div 
                                            className={styles['bar-inner']} 
                                            style={{ 
                                                width: `${item.percentage}%`,
                                                backgroundColor: item.color 
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Insights & Warnings */}
                    <div className={styles['insights-section']}>
                        <h5>Architectural Insights</h5>
                        <div className={styles['insights-container']}>
                            {insights.map((insight, idx) => (
                                <div 
                                    key={idx} 
                                    className={`${styles['insight-card']} ${styles[`insight-${insight.type}`]}`}
                                >
                                    <IconAlertTriangle className={styles['insight-icon']} size={16} />
                                    <p>{insight.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
