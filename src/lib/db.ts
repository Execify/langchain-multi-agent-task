import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export const db = await open({
    filename: 'tasks.db',
    driver: sqlite3.Database
});

// Create the tasks table if it doesn't exist
await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        notes TEXT DEFAULT '[]'
    )
`);
