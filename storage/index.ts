import { Message } from '@/types';
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | undefined;
async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('whisper');
    await migrateDbIfNeeded(db)
  }
  return db!
}

export async function saveMessage(message: Message, roomId: string) {
  const db = await getDB();
  await db.runAsync(`
    INSERT INTO messages (username, room_id, type, content, msg_id, uuid, state, is_sender)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      message.senderId,
      roomId,
      message.type as number,
      JSON.stringify(message.content),
      message.msgId,
      message.uuid,
      message.state as number,
      message.isSender ? 1 : 0
    ])
  console.log("save message success")
}


export async function getMessages(roomId: string, direction: "before" | "after", limit: number, uuid?: string): Promise<Message[]> {
  const db = await getDB();
  let rows: {
    username: string,
    room_id: string,
    type: number,
    content: string,
    msg_id: string,
    uuid: string,
    state: number,
    is_sender: number
  }[]
  if (uuid && direction === "before") {
    rows = await db.getAllAsync(`
    SELECT * FROM messages
    WHERE room_id = ?
    AND uuid < ?
    ORDER BY uuid
    LIMIT ?
    `, [roomId, uuid, limit])
  } else if (uuid && direction === "after") {
    rows = await db.getAllAsync(`
    SELECT * FROM messages
    WHERE room_id = ?
    AND uuid > ?
    ORDER BY uuid
    LIMIT ?
    `, [roomId, uuid, limit])
  } else {
    rows = await db.getAllAsync(`
    SELECT * FROM messages
    WHERE room_id = ?
    ORDER BY uuid
    LIMIT ?
    `, [roomId, limit])
  }

  return rows.map(row => ({
    msgId: row.msg_id,
    senderId: row.username,
    uuid: row.uuid,
    roomId: row.room_id,
    type: row.type,
    state: row.state,
    content: JSON.parse(row.content),
    isSender: row.is_sender === 1
  }))
}


export async function getImagesMessages(roomId: string): Promise<Message[]> {
  const db = await getDB();
  const rows: {
    username: string,
    room_id: string,
    type: number,
    content: string,
    msg_id: string,
    uuid: string,
    state: number,
    is_sender: number
  }[] = await db.getAllAsync(`
    SELECT * FROM messages
    WHERE room_id = ?
    AND type = 1
    `, [roomId])

  return rows.map(row => ({
    msgId: row.msg_id,
    senderId: row.username,
    uuid: row.uuid,
    roomId: row.room_id,
    type: row.type,
    state: row.state,
    content: JSON.parse(row.content),
    isSender: row.is_sender === 1
  }))
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
          type INT NOT NULL,
          content TEXT NOT NULL,
          msg_id TEXT NOT NULL,
          uuid TEXT NOT NULL,
          state INT NOT NULL,
          is_sender INT NOT NULL
      );

      CREATE UNIQUE INDEX 'uniq_ru' ON messages (room_id, uuid);
    `);
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  }
}