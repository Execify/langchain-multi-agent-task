import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { END } from '@langchain/langgraph';
import { members } from '../agents/shared';
import chalk from 'chalk';

export const delegate = new DynamicStructuredTool({
    name: 'delegate',
    description: 'A tool to delegate control of the dialog to another assistant',
    schema: z.object({
        assistant: z
            .enum([END, ...(Object.keys(members) as (keyof typeof members)[])])
            .describe('The assistant to delegate to'),
    }),
    func: async ({ assistant }) => {

        console.log(`Delegating to ${chalk.blue(assistant)}...`);

        const string = [
            `${assistant}`,
            `The active agent is now the ${assistant} assistant.`,
            `If user's request is unsatisfied. Use the provided tools to assist the user. Remember, you are the ${assistant} assistant`,
            `and the request is not complete until after you have successfully invoked the appropriate tool.`,
        ].join('\n');

        return string;
    },
});
