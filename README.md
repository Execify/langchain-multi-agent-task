# Example Langchain Chatbot

This is an example chatbot written in Typescript using Langchain / LangGraph.
Use this as base for completing the task below.

## Agent Architecture

<img src="./assets/architecture.png" width="80%">

## Demo

<video width="80%" controls>
  <source src="./assets/execify_interview_demo.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

## Guide

1. Ensure you have the correct environment variables set, you can use the `.env.example` file as a template.

2. Load the vector store from the Cat.pdf file into the chroma db
   
   ```bash
   make load_vectorstore
   ```

3. Run the chatbot

   ```bash
   make start
   ```

4. Chat with the bot!
   ```bash
   http://localhost:5173
   ```

## Todo

- [x] Add a **taskHandler** agent that can manage tasks in an SQLite database with the following functionality:
  - Add a new task (addTask: Add a task with a description)
  - List all tasks (listTasks: Retrieve all tasks with their IDs, descriptions, completion status, and notes)
  - Remove a task (removeTask: Delete a task by ID)
  - Add notes to tasks (addNote: Add a note to a specific task by ID)
  - Update a task description (updateTaskDescription: Update the description of a specific task by ID)
  - Complete a task (completeTask: Mark a task as completed by ID)
- [x] Represent that task table as a markdown table in the chatbot ui
  - Only display the task list when the user asks for it
  - Update the graph invocation to stream events, allow token streaming + send markdown table event
  - Another option would be to add a tasks field to the agent state
  - could also render the task table where the graph png is and have it update as the agent updates the table
- [x] fix the taskHandler agent so that it sends the task list event when something changes and only when its done with its response
- [x] Implement a vector store for the cat facts agent
  - Perhaps a file backed knowledge store (Such as PDFs)
- [ ] Add context sharing between agents as "memories" rather than messages, this may help with improved reliability.
  - Use the vector store to store memories when an agent makes a meaningful observation
  - query the vector store to retrieve relevant memories to embed in prompts
- [ ] Add semantic caching (of responses? so similar questions return the same answer and dont go to the agent how would this work with tasks?)




