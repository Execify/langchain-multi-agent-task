import { DynamicStructuredTool } from 'langchain/tools';
import { delegateTool } from '../tools/delegate';
import { buildStandardPrompt, createAgent } from './shared';
import { z } from 'zod';
import chalk from 'chalk';
import { db } from '../../db';
import { dispatchCustomEvent } from "@langchain/core/callbacks/dispatch";

const listTasksTool = new DynamicStructuredTool({
	name: 'listTasks',
	description: 'List all tasks in the task list. Only send to the user once you have completed your task.',
	schema: z.object({
		sendToUser: z.boolean().default(false).describe('Set to true to send the task list to the user, false for internal retrieval')
	}),
	func: async ({ sendToUser }) => {
		console.log(chalk.gray(`Listing all tasks...`));
		const tasks = await db.all('SELECT * FROM tasks');
		
		if (sendToUser && tasks.length > 0) await dispatchCustomEvent("taskList", { tasks });
		return `Tasks listed successfully: ${JSON.stringify(tasks)}`;
	}
});

const addTaskTool = new DynamicStructuredTool({
	name: 'addTask',
	description: 'Add a task to the task list',
	schema: z.object({
		task: z.string().describe('The task to add to the task list')
	}),
	func: async ({ task }) => {
		console.log(chalk.gray(`Adding task ${task} to the task list...`));
		const result = await db.run(
			'INSERT INTO tasks (task, notes) VALUES (?, ?)',
			[task, JSON.stringify([])]
		);
		return `Task "${task}" added successfully with ID ${result.lastID}`;
	}
});


const removeTaskTool = new DynamicStructuredTool({
	name: 'removeTask',
	description: 'Remove a task from the task list',
	schema: z.object({
		taskId: z.string().describe('The ID of the task to remove')
	}),
	func: async ({ taskId }) => {
		console.log(chalk.gray(`Removing task ${taskId} from the task list...`));
		const result = await db.run(
			'DELETE FROM tasks WHERE id = ?',
			[taskId]
		);
		if (result.changes === 0) return `No task found with ID ${taskId}`;
		return `Task with ID ${taskId} removed successfully`;
	}
});

const addTaskNoteTool = new DynamicStructuredTool({
	name: 'addTaskNote',
	description: 'Add a note to an existing task',
	schema: z.object({
		taskId: z.string().describe('The ID of the task to add the note to'),
		note: z.string().describe('The note to add to the task')
	}),
	func: async ({ taskId, note }) => {
		console.log(chalk.gray(`Adding note ${note} to task ${taskId}...`));
		const task = await db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
		if (!task) return 'Task not found';
		
		const notes = JSON.parse(task.notes);
		notes.push(note);
		
		await db.run(
			'UPDATE tasks SET notes = ? WHERE id = ?',
			[JSON.stringify(notes), taskId]
		);
		return `Note added to task ${taskId}`;
	}
});


const updateTaskDescriptionTool = new DynamicStructuredTool({
	name: 'updateTaskDescription',
	description: 'Update a task description',
	schema: z.object({
		taskId: z.string().describe('The ID of the task to update'),
		updatedDescription: z.string().describe('The updated task description')
	}),
	func: async ({ taskId, updatedDescription }) => {
		console.log(chalk.gray(`Updating task ${taskId} description...`));
		const result = await db.run(
			'UPDATE tasks SET task = ? WHERE id = ?',
			[updatedDescription, taskId]
		);
		if (result.changes === 0) return `No task found with ID ${taskId}`;
		return `Task ${taskId} description updated successfully`;
	}
});

export const makeTaskHandlerAgent = () => {
	const name = 'TaskHandler';

	const prompt = buildStandardPrompt({
		agentName: name,
		agentPurpose: 'Manage the User\'s task list in a SQLite database.',
		guidePrompt: `You are responsible for managing the User's task list in a SQLite database.
You can add, remove and list tasks, as well as add notes to tasks.
The SQLite database has the following schema:

<TASK_TABLE_SCHEMA>
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task TEXT NOT NULL,
    notes TEXT DEFAULT '[]'
)
</TASK_TABLE_SCHEMA>

If a user has referenced a task in their message, first check the existing task list using the 'listTasks' tool with \`sendToUser\` set to false.
If there is an existing task that matches the user's request, modify that task, do not create repeating tasks.
If a user has completed a task, remove that task from the task list using the 'removeTask' tool.
Ensure that you display the task list to the user using the 'listTasks' tool with \`sendToUser\` set to true after you have completed your task.
Always state all the task information in your response.
`
	});

	return createAgent({
		name,
		tools: [
			delegateTool,
			listTasksTool,
			addTaskTool,
			removeTaskTool,
			addTaskNoteTool,
			updateTaskDescriptionTool
		],
		prompt
	});
};
