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

export async function saveMessage(message: MessageData, roomId: string) {
  const db = await getDB();
  await db.runAsync(`
    INSERT INTO messages (username, room_id, message_type, message_data, message_id, uuid, state)
    VALUES(?, ?, ?, ?, ?, ?, ?)`,
    [
      message.msg.senderId,
      roomId,
      message.msg.type,
      JSON.stringify(message.msg.content),
      message.msg.msgId,
      message.msg.uuid,
      0
    ])
  console.log("save message success")
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
      DROP TABLE IF EXISTS messages;
      CREATE TABLE messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL,
          room_id TEXT NOT NULL,
          message_type INT NOT NULL,
          message_data TEXT NOT NULL,
          message_id TEXT NOT NULL,
          uuid TEXT NOT NULL,
          state INT NOT NULL
      );

      CREATE UNIQUE INDEX 'uniq_ru' ON messages (room_id, uuid);
    `);
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  }
}