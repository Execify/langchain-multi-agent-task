import { delegateTool } from '../tools/delegate';
import { buildStandardPrompt, createAgent } from './shared';
import { DynamicStructuredTool } from 'langchain/tools';
import { ChromaClient } from "chromadb";
import { OpenAIEmbeddings } from "@langchain/openai";
import { z } from 'zod';

const embeddings = new OpenAIEmbeddings();
const chroma = new ChromaClient({ path: "http://localhost:8000" });

const embeddingFunction = {
    generate: async (texts: string[]) => {
        return await embeddings.embedDocuments(texts);
    }
};

const collection = await chroma.getCollection({ 
    name: "cat_facts",
    embeddingFunction
});


const searchCatVectorStoreTool = new DynamicStructuredTool({
	name: 'searchCatVectorStore',
	description: 'Search for facts in a vector database of Cat information',
	schema: z.object({
		query: z.string().describe('A question semantically similar to the question you want to ask about cats, e.g. "How good is a cats eyesight?"')
	}),
	func: async ({ query }) => {
		const queryEmbedding = await embeddings.embedQuery(query);
		
		const results = await collection.query({
			queryEmbeddings: [queryEmbedding],
			nResults: 5
		});

		if (results.documents && results.documents[0]) {
			return `Here is some extracted information that may be relevant to your query: ${query}\n\n${results.documents[0].join("\n\n")}`;
		}
		return "Sorry, I couldn't find any relevant information.";
	}
});



export const makeCatFactAgent = () => {
    const name = 'CatFacts';

	const prompt = buildStandardPrompt({
		agentName: name,
		agentPurpose: 'Provide cat facts to users',
		guidePrompt:
			`Use the Search Cat Vector Store tool to find an interesting fact about cats based on the user's question.
			Use the query tool to ask a specific question about cats, e.g. "How good is a cats eyesight?", "What is the lifespan of a cat?" etc.
			Then provide a natural response using that information.`
	});

	return createAgent({
        name,
		tools: [
            delegateTool,
            searchCatVectorStoreTool
        ],
		prompt
	});
};
