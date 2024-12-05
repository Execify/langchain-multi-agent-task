import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import type { DynamicStructuredTool } from 'langchain/tools';
import { createToolNode } from '../utils/createToolNode';
import { delegateTool } from '../tools/delegate';

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

    <OTHER_AGENTS>
        <AGENT>
            <AGENT_ID>supervisor</AGENT_ID>
            <AGENT_DESCRIPTION>The supervisor agent is the main agent that manages the conversation flow. They can also summarize anything needed.</AGENT_DESCRIPTION>
        </AGENT>
        <AGENT>
            <AGENT_ID>mathsExpert</AGENT_ID>
            <AGENT_DESCRIPTION>The maths expert can help with any complex calculations that are needed. Dont attempt maths without their help!</AGENT_DESCRIPTION>
        </AGENT>
        <AGENT>
            <AGENT_ID>catFacts</AGENT_ID>
            <AGENT_DESCRIPTION>The cat facts agent can provide interesting facts about cats. Useful for lightening the mood.</AGENT_DESCRIPTION>
        </AGENT>
        <AGENT>
            <AGENT_ID>marketingAdvisor</AGENT_ID>
            <AGENT_DESCRIPTION>The marketing advisor can provide advice on marketing strategies and tactics. Useful for business related questions.</AGENT_DESCRIPTION>
        </AGENT>
        <AGENT>
            <AGENT_ID>searcher</AGENT_ID>
            <AGENT_DESCRIPTION>The searcher agent can search the internet for information. Useful for finding information that is not known by the other agents.</AGENT_DESCRIPTION>
        </AGENT>
        <AGENT>
            <AGENT_ID>taskHandler</AGENT_ID>
            <AGENT_DESCRIPTION>Delegate to this Agent if the user mentions anything that they have done or need to do. The task handler agent can manage the user's task list. Useful for adding, removing and listing tasks.</AGENT_DESCRIPTION>
        </AGENT>
    </OTHER_AGENTS>
    
    <DELEGATION>
        If you need help from another agent, you can use the 'delegate' tool to pass the conversation to another agent.
        Remember you are part of a team and should work together to provide the best possible response to the user.
        <DELEGATION_TOOL>
            To delegate to another agent call the "${delegateTool.name}" tool and provide the AGENT_ID of the agent you want to delegate to.
            You dont need to go back to the supervisor to delegate to another agent.
        </DELEGATION_TOOL>
    </DELEGATION>

    <METADATA>
        <CURRENT_DATETIME>${new Date().toISOString()}</CURRENT_DATETIME>
    </METADATA>
</CONTEXT>

<YOUR_PURPOSE>
    ${params.agentPurpose}
</YOUR_PURPOSE>

<JOB_GUIDE>
    ${params.guidePrompt}
</JOB_GUIDE>

${params.toolGuidance ? `<TOOL_GUIDANCE>\n${params.toolGuidance}\n</TOOL_GUIDANCE>` : ''}
`;

/*
 * Create a new instance of the ChatOpenAI class and share it with all agents.
 * If an agent needs to use its own llm, create it in the agent file.
 */
const llm = new ChatOpenAI({
	model: 'gpt-4o-mini',
	temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY
});

/*
 * Create an agent with a prompt and a set of tools.
 * This function is used to create all agents in the chatbot.
 */
export const createAgent = (params: { name: string, tools: DynamicStructuredTool<any>[]; prompt: string }) => {
	const modelwithtools = llm.bindTools(params.tools, {
		parallel_tool_calls: params.tools.length > 0 ? false : undefined,
	}).withConfig({ tags: [params.name] });

	const agentPrompt = ChatPromptTemplate.fromMessages([
		['system', params.prompt],
		new MessagesPlaceholder('messages')
	]);

	const model = agentPrompt.pipe(modelwithtools);

	return {
        agent: model,
        name: params.name,
        // If there is more than just the delegate tool, create a tool node for this agent
        toolsNode: params.tools.filter((tool) => tool.name !== delegateTool.name).length > 0 ? createToolNode(params.tools) : undefined
    };
};
