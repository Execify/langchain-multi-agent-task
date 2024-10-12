import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { AIMessage, ToolMessage, type BaseMessage } from '@langchain/core/messages';
import { makeSupervisor } from './agents/supervisor';
import { makeCatFactAgent } from './agents/catFacts';
import { MemorySaver } from '@langchain/langgraph';
import { makeMarketingAdvisorAgent } from './agents/marketingAdvisor';
import type { RunnableConfig } from '@langchain/core/runnables';
import chalk from 'chalk';
import { agents } from './agents/shared';
import { createToolNode } from './utils/createToolNode';
import { delegateTool } from './tools/delegate';
import { makeMathsExpert } from './agents/mathsExpert';
import { createAgent } from './agents/shared';

const checkpointer = new MemorySaver();

export type GraphState = {
	messages: BaseMessage[];
	nextAgent: string;
};

const OverallGraphState = Annotation.Root({
	messages: Annotation<BaseMessage[]>({
		reducer: (x, y) => x.concat(y),
		default: () => []
	}),
	nextAgent: Annotation<string>({
		reducer: (x?: string, y?: string) => y ?? '',
		default: () => ''
	})
});

// Wrap the agent to return the last message
function wrapAgent(params: ReturnType<typeof createAgent>) {
	return async (state: GraphState, config?: RunnableConfig) => {
		console.log(`Invoking agent ${chalk.blue(params.name)}...`);

		const result = await params.agent.invoke(state, config);

		console.log(`Agent ${chalk.blue(params.name)} returned message: ${chalk.yellow(result.content)}`);

		return {
			messages: [result]
		};
	};
}

// If an agent calls delegate, switch to the delegate node
// Otherwise, stay in the same node
const handleDelegateCondition = (params: {
    next: string;
    toolsNodeName?: string;
}) => {
	return (state: GraphState) => {
		const { messages } = state;
		const lastMessage = messages.at(-1) as AIMessage;

		const toolCalls = lastMessage.tool_calls;

		// We do not allow parallel tool calls, so we can assume that there is only one tool call
		// If the agent called delegate, switch nodes
        const toolCall = toolCalls?.at(0);

        if (toolCall?.name === delegateTool.name) {
            return 'delegate';
        }

        if(params.toolsNodeName !== undefined && toolCall !== undefined) {
            return params.toolsNodeName;
        }

        return params.next;
	};
};

export const makeChatbotGraph = async () => {
	const agentsAndTools = {
		supervisor: makeSupervisor(),
		mathsExpert: makeMathsExpert(),
		catFacts: makeCatFactAgent(),
		marketingAdvisor: makeMarketingAdvisorAgent()
	};

    // Add agents to the graph
    // (Would loop this but typescript doesn't like it)
	const workflow = new StateGraph(OverallGraphState)
		.addNode(
			'supervisor',
			wrapAgent(agentsAndTools['supervisor'])
		)
		.addNode(
			'mathsExpert',
			wrapAgent(agentsAndTools['mathsExpert'])
		)
		.addNode(
			'catFacts',
			wrapAgent(agentsAndTools['catFacts'])
		)
		.addNode(
			'marketingAdvisor',
			wrapAgent(agentsAndTools['marketingAdvisor'])
		);
    
    // Add agent tools to the graph
    workflow.addNode("mathsExpertTools", agentsAndTools['mathsExpert'].toolsNode!);

	// Add tool node for delegation
	workflow.addNode('delegate', createToolNode([delegateTool])).addConditionalEdges(
		'delegate',
		(state: GraphState) => {
			const { messages } = state;
			const lastMessage = messages.at(-1) as ToolMessage;
			const route = (lastMessage.content as string).split('\n')[0];
			return route;
		},
		{
			supervisor: 'supervisor',
			catFacts: 'catFacts',
			marketingAdvisor: 'marketingAdvisor',
			mathsExpert: 'mathsExpert'
		}
	);

	// Let the supervisor delegate to the sub agents OR end the conversation
	workflow.addConditionalEdges('supervisor', handleDelegateCondition({
        next: END
    }), {
		delegate: 'delegate',
		__end__: END
	} as any);

	// Set sub agents delegate to eachother
	["catFacts", "marketingAdvisor", "mathsExpert"].forEach((agent) => {
        const agentName = agent as (typeof agents)[number];

        let edges = {
            delegate: 'delegate',
            supervisor: 'supervisor'
        } as any;

        let hasTools = agentsAndTools[agentName].toolsNode !== undefined;

        if(hasTools) {
            edges[`${agentName}Tools`] = `${agentName}Tools`;
        }

		workflow.addConditionalEdges(
			agentName as (typeof agents)[number],
			handleDelegateCondition({
                next: 'supervisor'
            }),
			edges
		);
	});

	// Start at the supervisor agent
	workflow.addEdge(START, 'supervisor');

	return workflow.compile({
		checkpointer
	});
};
