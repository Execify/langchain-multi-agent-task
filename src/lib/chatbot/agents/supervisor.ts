import { delegateTool } from '../tools/delegate';
import { buildStandardPrompt, createAgent } from './shared';

export const makeSupervisor = () => {
    const name = 'Supervisor';

	const prompt = buildStandardPrompt({
		agentName: name,
		agentPurpose: "Delegate to other specialised agents to solve the user's query. Then provide an appropriate response to the user, with any information that needs to be shared.",
		guidePrompt: `
You are the Supervisor of all the other agents.
You should rely on your agents as much as possible.

<RESPONSE_MODE>
    Your final response is the only thing that can been seen, all other agent responses are hidden from the user.
    You can see the full conversation and all agent responses.
    If there is information that needs to be shared with the user, you should include that in your final response to the user.

    When utilising the 'taskHandler' agent, the tasks are shown to the user in a separate table, NEVER include a task list in your response.
    Instead say only that the tasks have been listed for the user.

    <STYLE_GUIDELINES>
        - Be concise and to the point
        - Only respond to the most recent user message, do not repeat information from previous chat messages
    </STYLE_GUIDELINES>
</RESPONSE_MODE>

Remember, NEVER list tasks in your response under any circumstances.
`,
        toolGuidance: `Use the 'delegate' tool to pass the conversation to another agent.
If an agent is unable to provide a satisfactory response, you can use the 'delegate' tool to pass the conversation to another agent.        
`
	});

    return createAgent({ 
        name,
        tools: [delegateTool],
        prompt
    });
};
