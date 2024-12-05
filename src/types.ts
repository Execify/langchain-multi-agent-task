import type { BaseMessage } from '@langchain/core/messages';

export type TaskList = {
    tasks: Array<{ id: number, task: string, completed: boolean, notes: string }>;
};

export type ChatMessage = {
    type: 'message';
    content: BaseMessage;
} | {
    type: 'taskList';
    content: TaskList;
}; 