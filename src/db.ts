import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const verboseSqlite = sqlite3.verbose();

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Point to a persistent file on disk in your project root
const dbPath = path.join(__dirname, '../database.sqlite');

export const db = new verboseSqlite.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log(`Connected to SQLite database at: ${dbPath}`);
  }
});

export const initDb = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_name TEXT NOT NULL,
        file_reference TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        history_reference TEXT,
        importance_flag INTEGER NOT NULL,
        archive_flag INTEGER NOT NULL,
        access_flag INTEGER NOT NULL
      )
    `;

    db.run(createTableSql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};