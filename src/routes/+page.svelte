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

	let streamingMessage = '';

	async function handleMessage(event) {
		const message = event.detail;
		isWaitingForResponse = true;
		streamingMessage = '';

		// Add user message immediately
		chatbotMessages = [...chatbotMessages, new HumanMessage({ content: message })];

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: chatbotMessages.map(msg => ({
						type: msg._getType(),
						content: msg.content
					}))
				})
			});

			const reader = response.body.getReader();
			let fullMessage = '';
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				
				// Decode the chunk and add to buffer
				buffer += new TextDecoder().decode(value);
				
				// Try to extract complete JSON objects
				let startIndex = 0;
				let endIndex = buffer.indexOf('}', startIndex);
				
				while (endIndex !== -1) {
					try {
						const jsonString = buffer.substring(startIndex, endIndex + 1);
						const data = JSON.parse(jsonString);
						if (data.type === 'token' && data.data) {
							fullMessage += data.data;
							streamingMessage = fullMessage;
						}
						startIndex = endIndex + 1;
						endIndex = buffer.indexOf('}', startIndex);
					} catch (e) {
						// If parsing fails, try the next closing brace
						endIndex = buffer.indexOf('}', endIndex + 1);
					}
				}
				
				// Keep any remaining incomplete JSON in the buffer
				buffer = buffer.substring(startIndex);
			}

			// After streaming is complete, add the full message to chat history
			chatbotMessages = [...chatbotMessages, new AIMessage(fullMessage)];
			streamingMessage = '';

		} catch (error) {
			console.error('Error:', error);
			chatbotMessages = [...chatbotMessages, new AIMessage('There was an error! Check the console for more information.')];
		} finally {
			isWaitingForResponse = false;
		}
	}
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

	<ChatbotMessages bind:chatbotMessages bind:isWaitingForResponse bind:streamingMessage />

	<ChatbotInput on:sendMessage={handleMessage} bind:isWaitingForResponse />
</div>

<!-- Generated diagram of the chatbot. This will update as you make changes to the graph structure -->
<div class="bg-slate-50 p-4 mt-4 rounded-md">
	<h2 class="text-lg">Generated Chatbot Graph Layout:</h2>
	<img src="/graph.png" alt="Chatbot Graph" class="max-w-full mx-auto" />
</div>
