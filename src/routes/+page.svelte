<script lang="ts">
	import ChatbotInput from './ChatbotInput.svelte';
	import ChatbotMessages from './ChatbotMessages.svelte';
	import { type BaseMessage, AIMessage, HumanMessage } from '@langchain/core/messages';

	// The messages in the chatbot
	// We start with a welcome message
	let chatbotMessages: BaseMessage[] = [
		new AIMessage('Hello! I am the Super Chatbot 9000! How can I help you today?')
	];

	// Are we waiting for a response from the chatbot?
	let isWaitingForResponse = false;

	// Send a message to the chatbot
	const sendMessage = async (event: CustomEvent) => {
		const message = event.detail;

		chatbotMessages = [...chatbotMessages, new HumanMessage(message)];

		// Get ready to post the messages to the server
		const serializedMessages = chatbotMessages.map((message) => {
			return {
				content: message.content,
				type: message instanceof HumanMessage ? 'human' : 'ai'
			};
		});

		isWaitingForResponse = true;

		// Make a fetch request to the server which will invoke the chatbot
		const req = await fetch('/api/chat', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				messages: serializedMessages
			})
		});

		try {
			const res = await req.json();

			chatbotMessages = [...chatbotMessages, new AIMessage(res.result)];
		} catch (e) {
			console.error(e);
			chatbotMessages = [
				...chatbotMessages,
				new AIMessage('There was an error! Check the console for more information.')
			];
		}

        // We are no longer waiting for a response
		isWaitingForResponse = false;
	};
</script>

<svelte:head>
	<title>Super Chatbot 9000</title>
</svelte:head>

<h1 class="text-2xl text-center font-bold pb-2">🤖 Super Chatbot 9000! 🤖</h1>

<div class="p-2 bg-slate-50 rounded-md shadow-md">
	<h2 class="text-lg font-bold">Welcome to the Super Chatbot 9000!</h2>
	<p>This is a multi agent langchain chatbot that can help you with your questions!</p>

	<h2 class="text-lg font-bold pt-2">How to use</h2>
	<p>To use the chatbot, simply type your question in the input field below and press enter.</p>

	<p>The chatbot will then respond with an answer to your question.</p>
</div>

<!-- Main chat interface -->
<div class="pt-4">
	<h2 class="text-lg">Chat Log:</h2>

	<ChatbotMessages bind:chatbotMessages bind:isWaitingForResponse />

	<ChatbotInput on:sendMessage={sendMessage} bind:isWaitingForResponse />
</div>

<!-- Generated diagram of the chatbot. This will update as you make changes to the graph structure -->
<div class="bg-slate-50 p-4 mt-4 rounded-md">
	<h2 class="text-lg">Generated Chatbot Graph Layout:</h2>
	<img src="/graph.png" alt="Chatbot Graph" class="max-w-full mx-auto" />
</div>
