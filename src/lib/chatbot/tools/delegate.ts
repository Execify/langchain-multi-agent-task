import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

export const delegateTool = new DynamicStructuredTool({
    name: "delegate",
    description: 'A tool to delegate control of the dialog to another agent',
    schema: z.object({
        // Get list of agents from the shared agents object. Split into an array like this so typescript can infer the type
        agent: z.string().describe("The agent to delegate to. Use any valid AGENT_ID."),
    }),
    func: async ({ agent }) => {
        const string = [
            `${agent}`, // The first line is the agent name which is later parsed by the chatbot
            `The active agent is now the ${agent} agent.`,
            `If user's request is unsatisfied. Use the provided tools to assist the user. Remember, you are the ${agent} agent`,
            `and the request is not complete until after you have successfully invoked the appropriate tool.`
        ].join('\n');

        return string;
    }
});