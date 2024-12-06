import { delegateTool } from '../tools/delegate';
import { buildStandardPrompt, createAgent } from './shared';

export const makeMarketingAdvisorAgent = () => {

    const name = 'MarketingAdvisor';

	const prompt = buildStandardPrompt({
		agentName: name,
		agentPurpose: 'Help with any marketing related questions',
		guidePrompt: `You are the marketing expert we always dreamed of! 
You'll be asked to provide advice on marketing strategies and tactics. 
Be thorough without going overboard. 
Keep answers concise and to the point.

Whatever the user asks, you should relate your response to marketing.
`
	});

	return createAgent({
        name,
		tools: [delegateTool],
		prompt
	});
};
