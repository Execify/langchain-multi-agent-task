import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { AIMessage, ToolMessage, type BaseMessage } from '@langchain/core/messages';
import { makeSupervisor } from './agents/primary';
import { makeCatFactAgent } from './agents/catFacts';
import { MemorySaver } from '@langchain/langgraph';
import { makeMarketingAdvisorAgent } from './agents/marketingAdvisor';
import type { Runnable, RunnableConfig } from '@langchain/core/runnables';
import { toolsCondition } from '@langchain/langgraph/prebuilt';
import chalk from 'chalk';
import { members } from './agents/shared';
import { delegate } from './tools/delegate';
import { createToolNode } from './utils/createToolNode';

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
function wrapAgent(
	agent: Runnable<GraphState>,
	agentName: string
) {
	return async (state: GraphState, config?: RunnableConfig) => {
		console.log(`Invoking agent ${chalk.blue(agentName)}...`);

		const result = await agent.invoke(state, config);

		console.log(`Agent ${chalk.blue(agentName)} returned message: ${chalk.yellow(result.content)}`);

		return {
            messages: [result],
        };
	};
}

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
	workflow
		.addNode('delegate', createToolNode([delegate]))
		.addConditionalEdges(
			'supervisor',
			(state: GraphState) => {
				const { messages } = state;
                
				const route = toolsCondition(state.messages);
				const lastMessage = messages.at(-1) as AIMessage;

				if (route === END) {
                    console.log("Supervisor has ended the conversation");
					return END;
				}

				if (!lastMessage.tool_calls?.length || !lastMessage.tool_calls) {

                    console.log("Supervisor did not call any tools so presumed to be the end of the conversation");
					return END;
				} else {

					if (lastMessage.tool_calls![0].name === delegate.name) {
                        console.log("Supervisor has delegated the conversation to another agent");
						return 'delegate';
					}

                    console.error("The supervisor has tried to call a tool that is not the delegate tool. This is not allowed.");
					return END;
				}
			},
			{
				delegate: 'delegate',
				__end__: END
			}
		)
		.addConditionalEdges('delegate', (state: GraphState) => {
			const { messages } = state;
			const lastMessage = messages.at(-1) as ToolMessage;
			const route = (lastMessage.content as string).split('\n')[0];
			return route;
		});

	// Add edges to the primary agent from sub agents
	Object.keys(members).forEach((member) => {
		// @ts-expect-error - here typescript doesnt know that member is a valid node.
		workflow.addEdge(member, 'supervisor');
	});

	// Start at the primary agent
	workflow.addEdge(START, 'supervisor');

	return workflow.compile({
		checkpointer
	});
};
