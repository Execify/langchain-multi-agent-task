import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { agents } from '../agents/shared';
import chalk from 'chalk';

export const delegateTool = new DynamicStructuredTool({
    name: "delegate",
    description: 'A tool to delegate control of the dialog to another agent',
    schema: z.object({
        agent: z.enum(agents).describe('The agent to delegate to')
    }),
    func: async ({ agent }) => {
        console.log(`Delegating to ${chalk.blue(agent)}...`);

        const string = [
            `${agent}`,
            `The active agent is now the ${agent} agent.`,
            `If user's request is unsatisfied. Use the provided tools to assist the user. Remember, you are the ${agent} agent`,
            `and the request is not complete until after you have successfully invoked the appropriate tool.`
        ].join('\n');

        return string;
    }
});