import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export const db = await open({
    filename: 'tasks.db',
    driver: sqlite3.Database,
    mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
});

await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task TEXT NOT NULL,
        notes TEXT DEFAULT '[]'
    )
`);
