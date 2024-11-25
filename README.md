# Example Langchain Chatbot

This is an example chatbot written in Typescript using Langchain / LangGraph.
Use this as base for completing the task below.

## Your Task

The "Super Chatbot 9000" needs task management functionality (Think todo lists or agendas). 

Add a new agent(s) and update/reprompt existing ones in order to make the chatbot a functional tasking tool.

Some example prompts:
- "Add a todo to walk my dog"
- "How many open tasks do I have?"
- "Add a note saying 'Book a room!' to my 'Board Meeting Planning' task"

### Guide

- Tasks should be retrievable between invocations of the chatbot
  - Store the tasks however you wish, either in a database or on file.
- Feel free to change any part of the application / code where required
- Build the best prompts you can
- Make chatbot as reliable as possible
- You will likely need to change existing agents / nodes / edges. You can change any part of this project so if you think something can be done better, change it!
- The existing prompts are very minimal, expand on them as much as possible.

## Getting Started

1. Clone this repository
2. Install dependencies with `npm install`
3. Export your OPENAI_API_KEY environment variable. (You must supply your own OpenAI API key)
4. Run the chatbot with `npm run dev`
5. Open your browser to `http://localhost:5173/`

## Usage

This chatbot has multiple agents and you can see the layout of the agents in the "Generated Chatbot Graph Layout" section.

Simply enter your prompt in the text box and press enter to send the message to the chatbot.

![image](https://github.com/user-attachments/assets/8eb31554-c67f-47b6-8379-1dccd88167cf)

## Adding Agents

You can add your own agents by creating a new agent file in the `src/lib/chatbot/agents` directory. The agent file should export a function for creating the chatbot agent. 

In this project we have a helper function for creating agents called `createAgent`. You do not have to use this function if you are buildign something more complex, but it is a good starting point.

### Adding a new agent to the graph

Once you have created your agent, you can add it to the graph by updating the `makeChatbotGraph` function in the `src/lib/chatbot/Chatbot.ts` file. This file contains the graph layout for the chatbot.
Add a node for your agent and update the delegate node if you want to delegate to your agent.

You should also update the `buildStandardPrompt` function in `src/lib/chatbot/shared.ts` to include the new agent so that other agents can delegate to it if required.

If you are stuck trying to add a new agent, try copying the mathsExpert agent and searching through the code for "mathsExpert" to see where it is referenced.

## Extra Credits

Nothing in this section is required, your time is limited and we understand that!

However, we want you to prove as strongly as possible that you are a skilled AI expert.
Feel free to expand on this project as much as possible. 
Here are some things you could attempt (if it makes sense to) if you want to go the extra mile:

- Implement a vector store
  - Perhaps a file backed knowledge store (Such as PDFs)
- Add context sharing between agents as "memories" rather than messages, this may help with improved reliability.
- Add semantic caching


## Debugging

A lot of the debugging information is printed to the console. You can also sign up for Langsmith and view executions in the dashboard. (Free accounts available)
