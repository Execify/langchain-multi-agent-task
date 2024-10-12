import { delegateTool } from '../tools/delegate';
import { buildStandardPrompt, createAgent } from './shared';

export const makeCatFactAgent = () => {
    const name = 'CatFacts';

	const prompt = buildStandardPrompt({
		agentName: name,
		agentPurpose: 'Provide cat facts to users',
		guidePrompt:
			"The primary agent will provide you with the user's question. You should respond with a cat fact that is relevant to the user's question."
	});

	return createAgent({
        name,
		tools: [delegateTool],
		prompt
	});
};
