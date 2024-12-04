import { DynamicStructuredTool } from 'langchain/tools';
import { delegateTool } from '../tools/delegate';
import { buildStandardPrompt, createAgent } from './shared';
import { TavilySearchResults } from '@langchain/community/tools/tavily_search';
import { DuckDuckGoSearch } from '@langchain/community/tools/duckduckgo_search';
import { z } from 'zod';
import chalk from 'chalk';

const getSearchTool = () => {
	const tavilyApiKey = process.env.TAVILY_API_KEY;
	return tavilyApiKey
		? new TavilySearchResults({ maxResults: 1 })
		: new DuckDuckGoSearch({ maxResults: 1 });
};

const search = getSearchTool();

const searchTool = new DynamicStructuredTool({
	name: 'search',
	description: 'Search the internet for information',
	schema: z.object({
		query: z.string().describe('The query to search for')
	}),
	func: async ({ query }) => {
		console.log(chalk.gray(`Searching for ${query}...`)); 

		const result = await search.invoke(query);
		console.log(chalk.yellow(`Search result: ${result}`));
		return result;
	}
});

export const makeSearcherAgent = () => {
	const name = 'Searcher';

	const prompt = buildStandardPrompt({
		agentName: name,
		agentPurpose: 'Access the internet to search for things',
		guidePrompt: `You are the only agent with the ability to search the internet. 
Use this power to answer any questions that require information from the web.
Keep your answers purely factual, don't add any personal opinions, anecdotes or offers of help.
`
	});

	return createAgent({
		name,
		tools: [delegateTool, searchTool],
		prompt
	});
};
