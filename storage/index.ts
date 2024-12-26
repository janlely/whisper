import { MessageData } from '@/types';
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | undefined;
async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('databaseName');
    await migrateDbIfNeeded(db)
  }
  return db!
}

export async function saveMessage(message: MessageData) {
  
}

async function migrateDbIfNeeded(db: SQLite.SQLiteDatabase) {
  const DATABASE_VERSION = 1;
  let currentDbVersion  = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  if (currentDbVersion!.user_version >= DATABASE_VERSION) {
    return;
  }
  if (currentDbVersion!.user_version === 0) {
    await db.execAsync(`
      CREATE TABLE messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL,
          room_id TEXT NOT NULL,
          message_type INT NOT NULL,
          message_data TEXT NOT NULL,
          message_id TEXT NOT NULL,
          uuid TEXT NOT NULL
      );

      CREATE UNIQUE INDEX 'uniq_ru' ON messages (room_id, uuid);
    `);
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  }
}