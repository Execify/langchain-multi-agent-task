import { makeChatbotGraph } from '$lib/chatbot/Chatbot';

export const GET = async () => {
	const representation = (await makeChatbotGraph()).getGraph();
	const image = await representation.drawMermaidPng();
	const arrayBuffer = await image.arrayBuffer();

	return new Response(arrayBuffer, {
        headers: {
            'Content-Type': 'image/png'
        }
    });
};
