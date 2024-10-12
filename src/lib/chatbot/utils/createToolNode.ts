import { AIMessage, ToolMessage } from '@langchain/core/messages';
import { RunnableLambda } from '@langchain/core/runnables';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import type { StructuredTool } from 'langchain/tools';
import type { GraphState } from '../Chatbot';

export function createToolNode(tools: StructuredTool[]) {
	const node = new ToolNode(tools);

	return node.withFallbacks({
		fallbacks: [
			new RunnableLambda({
				func: async (state: GraphState) => {
					const { messages } = state;
					const lastMessage = messages[messages.length - 1] as AIMessage;
					const toolCall = lastMessage.tool_calls?.at(-1);

					if (toolCall === undefined) {
						console.error('Chatbot somehow called a tool node in a way we didnt expect.');

						return {
							messages: [
								new ToolMessage({
									content: 'This is not a valid tool.',
									tool_call_id: 'invalid-tool-call-huh'
								})
							]
						};
					}

					console.error(
						{
							toolCall
						},
						`Tool call failed`
					);

					return {
						messages: [
							new ToolMessage({
								content: 'This is not a valid tool. Try something else.',
								tool_call_id: toolCall.id || 'never'
							})
						]
					};
				}
			})
		]
	});
}
