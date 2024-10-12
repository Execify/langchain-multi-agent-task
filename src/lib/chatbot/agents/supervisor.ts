import { delegateTool } from '../tools/delegate';
import { buildStandardPrompt, createAgent } from './shared';

export const makeSupervisor = async () => {
    
	const prompt = buildStandardPrompt({
		agentName: 'Supervisor',
		agentPurpose: "Delegate to other specialised agents to solve the user's query.",
		guidePrompt: `
You are the Supervisor of all the other agents.
You should rely on your agents as much as possible.
When you have all the information you need, you can provide the final response to the user.

Remember! The user can only see the final response from YOU (the Supervisor), so summarize anything from your sub agents into a final response before finishing.
`,
        toolGuidance: "Use the 'delegate' tool to pass the conversation to another agent."
	});

    return createAgent({ 
        tools: [delegateTool],
        prompt
    });
};
