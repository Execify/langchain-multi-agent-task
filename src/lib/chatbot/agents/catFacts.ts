import { buildStandardPrompt, createAgent } from './shared';

export const makeCatFactAgent = () => {
	const prompt = buildStandardPrompt({
		agentName: 'Cat Facts',
		agentPurpose: 'Provide cat facts to users',
		guidePrompt:
			"The primary agent will provide you with the user's question. You should respond with a cat fact that is relevant to the user's question."
	});

	return createAgent({
		tools: [],
		prompt
	});
};
