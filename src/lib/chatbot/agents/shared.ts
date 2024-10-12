import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import type { DynamicStructuredTool } from 'langchain/tools';

/*
 * Agents available in the chatbot
 * This is used to generate the context and graph for the chatbot
 * 
 * If you add a new agent, make sure to add it here also!
 */
export const agents = ["catFacts", "marketingAdvisor"] as const;

/*
 * Build an agent prompt with some standard formatting.
 * This is optional but can be useful to provide context to the agent.
*/
export const buildStandardPrompt = (params: {
	agentName: string;
	agentPurpose: string;
	guidePrompt: string;
	toolGuidance?: string;
}) =>
	`<CONTEXT>
    You are the ${params.agentName} agent.
    You are part of a multi agent chatbot called 'Super Chatbot 9000!'.
    You must work together with the other agents to provide the best possible response to the user.

    <OTHER_AGENTS>${agents
			.map(
				(agent) =>
					`<AGENT><AGENT_ID>${agent}</AGENT_ID><DESCRIPTION>${agents[agent as keyof typeof agents]}</DESCRIPTION></AGENT>`
			)
			.join('\n')}</OTHER_AGENTS>
</CONTEXT>

<PURPOSE>
    ${params.agentPurpose}
</PURPOSE>

<GUIDE>
    ${params.guidePrompt}
</GUIDE>

${params.toolGuidance ? `<TOOL_GUIDANCE>\n${params.toolGuidance}\n</TOOL_GUIDANCE>` : ''}
`;

/*
 * Create a new instance of the ChatOpenAI class and share it with all agents.
 * If an agent needs to use its own llm, create it in the agent file.
 */
const llm = new ChatOpenAI({
	model: 'gpt-4o-mini',
	temperature: 0
});

/*
 * Create an agent with a prompt and a set of tools.
 * This function is used to create all agents in the chatbot.
 */
export const createAgent = (params: { tools: DynamicStructuredTool<any>[]; prompt: string }) => {
	const modelwithtools = llm.bindTools(params.tools, {
		parallel_tool_calls: params.tools.length > 0 ? false : undefined
	});

	const agentPrompt = ChatPromptTemplate.fromMessages([
		['system', params.prompt],
		new MessagesPlaceholder('messages')
	]);

	const model = agentPrompt.pipe(modelwithtools);

	return model;
};
