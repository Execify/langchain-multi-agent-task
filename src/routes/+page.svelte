<script lang="ts">
	import ChatbotInput from './ChatbotInput.svelte';
	import ChatbotMessages from './ChatbotMessages.svelte';
	import { type BaseMessage, AIMessage, HumanMessage } from '@langchain/core/messages';
	import { twMerge } from "tailwind-merge";
	import { onMount } from 'svelte';
	import type { ChatMessage } from '$lib/types';

	// The messages in the chatbot
	// We start with a welcome message
	let chatMessages: ChatMessage[] = [
		{ 
			type: 'message', 
			content: new AIMessage('Hello! I am the Super Chatbot 9000! How can I help you today?')
		}
	];

	// Are we waiting for a response from the chatbot?
	let isWaitingForResponse = false;

	// Send a message to the chatbot
	const sendMessage = async (event: CustomEvent) => {
		const message = event.detail;

		chatMessages = [...chatMessages, { 
			type: 'message', 
			content: new HumanMessage(message)
		}];

		// Get ready to post the messages to the server
		const serializedMessages = chatMessages.map((message) => {
			return {
				content: message.content.content,
				type: message.content instanceof HumanMessage ? 'human' : 'ai'
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

			chatMessages = [...chatMessages, { 
				type: 'message', 
				content: new AIMessage(res.result)
			}];
		} catch (e) {
			console.error(e);
			chatMessages = [...chatMessages, { 
				type: 'message', 
				content: new AIMessage('There was an error! Check the console for more information.')
			}];
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
		chatMessages = [...chatMessages, { 
			type: 'message', 
			content: new HumanMessage({ content: message })
		}];

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: chatMessages
						.filter(msg => msg.type === 'message')
						.map(msg => ({
							type: msg.content._getType(),
							content: msg.content.content
						}))
				})
			});

			const reader = response.body.getReader();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				
				buffer += new TextDecoder().decode(value);
				
				let startIndex = 0;
				let endIndex = buffer.indexOf('}', startIndex);
				
				while (endIndex !== -1) {
					try {
						const jsonString = buffer.substring(startIndex, endIndex + 1);
						const data = JSON.parse(jsonString);

						if (data.type === 'token' && data.data) {
							streamingMessage += data.data;
						} else if (data.type === 'taskList' && data.data) {
							chatMessages = [...chatMessages, { 
								type: 'taskList', 
								content: { tasks: data.data.tasks }
							}];
						}

						startIndex = endIndex + 1;
						endIndex = buffer.indexOf('}', startIndex);
					} catch (e) {
						endIndex = buffer.indexOf('}', endIndex + 1);
					}
				}
				
				buffer = buffer.substring(startIndex);
			}

			if (streamingMessage) {
				chatMessages = [...chatMessages, { 
					type: 'message', 
					content: new AIMessage(streamingMessage)
				}];
				streamingMessage = '';
			}

		} catch (error) {
			console.error('Error:', error);
			chatMessages = [...chatMessages, { 
				type: 'message', 
				content: new AIMessage('There was an error! Check the console for more information.')
			}];
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

	<ChatbotMessages bind:chatMessages bind:isWaitingForResponse bind:streamingMessage />

	<ChatbotInput on:sendMessage={handleMessage} bind:isWaitingForResponse />
</div>

<!-- Generated diagram of the chatbot. This will update as you make changes to the graph structure -->
<div class="bg-slate-50 p-4 mt-4 rounded-md">
	<h2 class="text-lg">Generated Chatbot Graph Layout:</h2>
	<img src="/graph.png" alt="Chatbot Graph" class="max-w-full mx-auto" />
</div>
