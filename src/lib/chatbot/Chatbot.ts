import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { AIMessage, ToolMessage, type BaseMessage } from '@langchain/core/messages';
import { makeSupervisor } from './agents/supervisor';
import { makeCatFactAgent } from './agents/catFacts';
import { MemorySaver } from '@langchain/langgraph';
import { makeMarketingAdvisorAgent } from './agents/marketingAdvisor';
import type { RunnableConfig } from '@langchain/core/runnables';
import chalk from 'chalk';
import { createToolNode } from './utils/createToolNode';
import { delegateTool } from './tools/delegate';
import { makeMathsExpert } from './agents/mathsExpert';
import { createAgent } from './agents/shared';
import { makeSearcherAgent } from './agents/searcher';

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

		console.log(
			`Agent ${chalk.blue(params.name)} returned message: ${chalk.yellow(result.content)}`
		);

		return {
			messages: [result]
		};
	};
}

// If an agent calls delegate, switch to the delegate node
// Otherwise, stay in the same node
const handleDelegateCondition = (params: { next: string; toolsNodeName?: string }) => {
	return (state: GraphState) => {
		const { messages } = state;
		const lastMessage = messages.at(-1) as AIMessage;

		const toolCalls = lastMessage.tool_calls;

		// We do not allow parallel tool calls, so we can assume that there is only one tool call
		// If the agent called delegate, switch nodes
		const toolCall = toolCalls?.at(0);

		if (toolCall?.name === delegateTool.name) {
            console.log(chalk.gray('Agent called delegate, switching to delegate node'));
			return 'delegate';
		}

		if (params.toolsNodeName !== undefined && toolCall !== undefined) {
            console.log(chalk.gray(`Going to tools node: ${params.toolsNodeName}`));
			return params.toolsNodeName;
		}

        console.log(chalk.gray(`Next agent is ${params.next}`));
		return params.next;
	};
};

/**
 * Agents and tools used in the chatbot
 */
export const agentsAndTools = {
    supervisor: makeSupervisor(),
    mathsExpert: makeMathsExpert(),
    catFacts: makeCatFactAgent(),
    marketingAdvisor: makeMarketingAdvisorAgent(),
    searcher: makeSearcherAgent()
};

/**
 * Create the chatbot graph using LangGraph
 */
export const makeChatbotGraph = async () => {

	// Add agents to the graph. Update this to add more agents
	// (Would loop this but typescript doesn't like it)
	const workflow = new StateGraph(OverallGraphState)
		.addNode('supervisor', wrapAgent(agentsAndTools['supervisor']))
		.addNode('mathsExpert', wrapAgent(agentsAndTools['mathsExpert']))
		.addNode('catFacts', wrapAgent(agentsAndTools['catFacts']))
		.addNode('marketingAdvisor', wrapAgent(agentsAndTools['marketingAdvisor']))
		.addNode('searcher', wrapAgent(agentsAndTools['searcher']));

	// Add tool node for delegation
    // Delegation is a special tool that allows agents to pass the conversation to another agent
	workflow.addNode('delegate', createToolNode([delegateTool])).addConditionalEdges(
		'delegate',
		(state: GraphState) => {
			const { messages } = state;
			const lastMessage = messages.at(-1) as ToolMessage;
			const route = (lastMessage.content as string).split('\n')[0];

            console.log(`${chalk.gray("Delegating to:")} ${chalk.greenBright(route)}`);

			return route;
		},
        // Edges for the delegate node, add any new agents here (if you want them to be delegatable)
        // This is optional in theory, but not supplying it will mean that delegate could technically go to any node, which is not ideal
		{
			supervisor: 'supervisor',
			catFacts: 'catFacts',
			marketingAdvisor: 'marketingAdvisor',
			mathsExpert: 'mathsExpert',
            searcher: 'searcher'
		}
	);

	// Let the supervisor delegate to the sub agents OR end the conversation
    // We dont want other agents to end the conversation, so we only allow the supervisor to do this. (This is a design choice, feel free to change it)
	workflow.addConditionalEdges(
		'supervisor',
		handleDelegateCondition({
			next: END
		}),
		{
			delegate: 'delegate',
			__end__: END
		} as any
	);

	// Let sub agents delegate to eachother
	Object.keys(agentsAndTools)
		.filter((agentKey) => agentKey !== 'supervisor')
		.forEach((agent) => {
			const agentName = agent as keyof typeof agentsAndTools;

            // Create the edges this agent can take
            // Agents can delegate, do nothing which returns to the supervisor, or go to their tools node (if they have one)
			let edges = {
				delegate: 'delegate',
				supervisor: 'supervisor'
			} as any;

            // Does this agent need a tools node?
			if (agentsAndTools[agentName].toolsNode !== undefined) {
				// Add agent tools to the graph
				workflow.addNode(`${agentName}Tools`, agentsAndTools[agentName].toolsNode!);
				workflow.addEdge(`${agentName}Tools` as any, agentName);

				// Include in conditional edge
				edges[`${agentName}Tools`] = `${agentName}Tools`;
			}

            // Add the edges to the graph
			workflow.addConditionalEdges(
				agentName,
				handleDelegateCondition({
					next: 'supervisor',
					toolsNodeName:
						agentsAndTools[agentName].toolsNode !== undefined ? `${agentName}Tools` : undefined
				}),
				edges
			);
		});

	// Start at the supervisor agent
	workflow.addEdge(START, 'supervisor');
    
    // We're done! Add the chackpointer (memory saver) to the workflow and return it so it can be invoked
	return workflow.compile({
		checkpointer
	});
};
