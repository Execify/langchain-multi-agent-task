import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import type { DynamicStructuredTool } from 'langchain/tools';

export const members = {
	catFacts: 'Provides some cool cat facts!',
	marketingAdvisor: 'Can give amazing marketing advice!'
};

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

    <OTHER_AGENTS>${Object.keys(members)
			.map(
				(agent) =>
					`<AGENT><AGENT_ID>${agent}</AGENT_ID><DESCRIPTION>${members[agent as keyof typeof members]}</DESCRIPTION></AGENT>`
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

const llm = new ChatOpenAI({
	model: 'gpt-4o-mini',
	temperature: 0
});

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
