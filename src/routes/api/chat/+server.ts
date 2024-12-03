import { makeChatbotGraph } from '$lib/chatbot/Chatbot';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { z } from 'zod';

const messagesSchema = z.object({
	messages: z
		.array(
			z
				.object({
					type: z.enum(['human', 'ai']),
					content: z.string()
				})
				.transform((message) => {
					if (message.type === 'human') {
						return new HumanMessage({
							content: message.content
						});
					} else {
						return new AIMessage({
							content: message.content
						});
					}
				})
		)
		.refine((messages) => {
			// Check if there are any messages
			if (messages.length === 0) {
				return false;
			}

			// Check if the last message is a human message
			if (messages.at(-1) instanceof HumanMessage) {
				return true;
			}
		})
});

export const POST = async ({ request }) => {
	const data = await request.json();

	// Validate the request body
	const { messages } = messagesSchema.parse(data);

	// Compile chatbot graph
	const graph = await makeChatbotGraph();

	// Generate a random thread id
	const threadId = Math.random().toString(36).substring(7);

	// Run chatbot
	// TODO: update this to stream events, allow token streaming + send markdown table event
	const result = await graph.invoke(
		{
			messages
		},
		{
			configurable: {
				thread_id: threadId
			},
            recursionLimit: 20
		}
	);

	// Return with final message
	return new Response(
		JSON.stringify({
			result: result.messages.at(-1).content
		})
	);
};
