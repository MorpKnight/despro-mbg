import * as SQLite from 'expo-sqlite';

const DB_NAME = 'mbg_offline.db';
const OFFLINE_QUEUE_TABLE = `
  CREATE TABLE IF NOT EXISTS offline_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    body TEXT,
    headers TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at INTEGER NOT NULL
  );
`;

const OFFLINE_QUEUE_STATUS_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_offline_queue_status
  ON offline_queue(status, created_at);
`;

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function initializeDatabase(db: SQLite.SQLiteDatabase) {
  await db.execAsync(OFFLINE_QUEUE_TABLE);
  await db.execAsync(OFFLINE_QUEUE_STATUS_INDEX);
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await initializeDatabase(db);
      return db;
    })();
  }
  return databasePromise;
}

export type OfflineQueueRow = {
  id: number;
  endpoint: string;
  method: string;
  body: string | null;
  headers: string | null;
  status: 'PENDING' | 'FAILED';
  created_at: number;
};
