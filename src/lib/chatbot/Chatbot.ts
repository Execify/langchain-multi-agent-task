import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { AIMessage, ToolMessage, type BaseMessage } from '@langchain/core/messages';
import { makeSupervisor } from './agents/supervisor';
import { makeCatFactAgent } from './agents/catFacts';
import { MemorySaver } from '@langchain/langgraph';
import { makeMarketingAdvisorAgent } from './agents/marketingAdvisor';
import type { Runnable, RunnableConfig } from '@langchain/core/runnables';
import chalk from 'chalk';
import { agents } from './agents/shared';
import { createToolNode } from './utils/createToolNode';
import { delegateTool } from './tools/delegate';

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
function wrapAgent(agent: Runnable<GraphState>, agentName: string) {
	return async (state: GraphState, config?: RunnableConfig) => {
		console.log(`Invoking agent ${chalk.blue(agentName)}...`);

		const result = await agent.invoke(state, config);

		console.log(`Agent ${chalk.blue(agentName)} returned message: ${chalk.yellow(result.content)}`);

		return {
			messages: [result]
		};
	};
}

// If an agent calls delegate, switch to the delegate node
// Otherwise, stay in the same node
const handleDelegateCondition = (gotoEnd: boolean) => {
	return (state: GraphState) => {
		const { messages } = state;
		const lastMessage = messages.at(-1) as AIMessage;

		const toolCalls = lastMessage.tool_calls;

		// We do not allow parallel tool calls, so we can assume that there is only one tool call
		// If the agent called delegate, switch nodes
		if (toolCalls?.at(0)?.name === delegateTool.name) {
			return 'delegate';
		} else {
			return !gotoEnd ? 'supervisor' : END;
		}
	};
};

export const makeChatbotGraph = async () => {
	const supervisor = await makeSupervisor();
	const catFacts = makeCatFactAgent();
	const marketingAdvisor = makeMarketingAdvisorAgent();

	const workflow = new StateGraph(OverallGraphState)
		// Add agents
		.addNode('supervisor', wrapAgent(supervisor, 'Supervisor'))
		.addNode('catFacts', wrapAgent(catFacts, 'CatFacts'))
		.addNode('marketingAdvisor', wrapAgent(marketingAdvisor, 'MarketingAdvisor'));

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
			marketingAdvisor: 'marketingAdvisor'
		}
	);

	// Let the supervisor delegate to the sub agents OR end the conversation
	workflow.addConditionalEdges('supervisor', handleDelegateCondition(true), {
		delegate: 'delegate',
		__end__: END
	} as any);

	// Set sub agents delegate to eachother
	agents.forEach((agentName) => {
		workflow.addConditionalEdges(
			agentName as (typeof agents)[number],
			handleDelegateCondition(false),
			{
				delegate: 'delegate',
				supervisor: 'supervisor'
			} as any
		);
	});

	// Start at the supervisor agent
	workflow.addEdge(START, 'supervisor');

	return workflow.compile({
		checkpointer
	});
};
