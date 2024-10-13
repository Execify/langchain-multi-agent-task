import { DynamicStructuredTool } from 'langchain/tools';
import { delegateTool } from '../tools/delegate';
import { buildStandardPrompt, createAgent } from './shared';
import { z } from 'zod';
import chalk from 'chalk';

export const additionTool = new DynamicStructuredTool({
    name: "add",
    description: 'Add a set of numbers together',
    schema: z.object({
        numbers: z.array(z.number()).min(2).describe('The numbers to add together')
    }),
    func: async ({numbers}) => {
        console.log(chalk.gray(`Adding ${numbers.join(', ')}...`));

        const sum = numbers.reduce((acc, val) => acc + val, 0);
        return `The sum of ${numbers.join(' + ')} is ${sum}`;
    }
});

export const multiplyTool = new DynamicStructuredTool({
    name: "multiply",
    description: 'Multiply a set of numbers together',
    schema: z.object({
        numbers: z.array(z.number()).min(2).describe('The numbers to multiply together')
    }),
    func: async ({numbers}) => {
        console.log(chalk.gray(`Multiplying ${numbers.join(', ')}...`));

        const product = numbers.reduce((acc, val) => acc * val, 1);
        return `The product of ${numbers.join(' * ')} is ${product}`;
    }
});

export const subtractTool = new DynamicStructuredTool({
    name: "subtract",
    description: 'Subtract a set of numbers together',
    schema: z.object({
        numbers: z.array(z.number()).min(2).describe('The numbers to subtract from')
    }),
    func: async ({numbers}) => {
        console.log(chalk.gray(`Subtracting ${numbers.join(', ')}...`));

        const difference = numbers.reduce((acc, val) => acc - val);
        return `The difference of ${numbers.join(' - ')} is ${difference}`;
    }
});

export const divideTool = new DynamicStructuredTool({
    name: "divide",
    description: 'Divide a set of numbers together',
    schema: z.object({
        numbers: z.array(z.number()).min(2).describe('The numbers to divide')
    }),
    func: async ({numbers}) => {
        console.log(chalk.gray(`Dividing ${numbers.join(', ')}...`));
        
        const quotient = numbers.reduce((acc, val) => acc / val);
        return `The quotient of ${numbers.join(' / ')} is ${quotient}`;
    }
});

export const makeMathsExpert = () => {
    const name = 'MathsExpert';

	const prompt = buildStandardPrompt({
		agentName: name,
		agentPurpose: 'Do complex calculations *using tools* for the user and other agents',
		guidePrompt:
			"Never make a mistake! You are the maths expert. You'll be asked to provide answers to complex mathematical questions. Be sure to show your working and explain your answers. Keep answers concise and to the point.",
        toolGuidance: "Use the 'add', 'multiply', 'subtract', and 'divide' tools to perform calculations."
	});

	return createAgent({
        name,
		tools: [delegateTool, additionTool, multiplyTool, subtractTool, divideTool],
		prompt
	});
};
