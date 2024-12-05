import { delegateTool } from '../tools/delegate';
import { buildStandardPrompt, createAgent } from './shared';

export const makeSupervisor = () => {
    const name = 'Supervisor';

	const prompt = buildStandardPrompt({
		agentName: name,
		agentPurpose: "Delegate to other specialised agents to solve the user's query. Then summarize the conversation and provide a response to the user.",
		guidePrompt: `
You are the Supervisor of all the other agents.
You should rely on your agents as much as possible.

<RESPONSE_MODE>
    Your final response is the only thing that can been seen, all other agent responses are hidden from the user.
    You can see the full conversation and all agent responses.

    You should summarise the conversation and provide a response to the user.
    Dont just simply add your own message onto the end, you are in charge of summarising the conversation and providing the final response.
    When utilising the 'taskHandler' agent, the tasks are show to the user in a separate table, DO NOT list the tasks in your response, say only that the tasks have been listed for the user.

    <STYLE_GUIDELINES>
        - Be concise and to the point
        - Summarise the conversation
        - Dont start your message with "In summary" or "In conclusion" etc
    </STYLE_GUIDELINES>
</RESPONSE_MODE>
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
