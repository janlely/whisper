import { AudioMessage, ImageMessage, Message, MessageState, MessageType, TextMessage, VideoMessage } from '@/types';
import * as SQLite from 'expo-sqlite';
import * as Net from '@/net';
import { Alert } from 'react-native';

let db: SQLite.SQLiteDatabase | undefined;
const avatarMap = new Map<string, string>();

const SELECT_STRING = `
    SELECT username as senderId, room_id as roomId, type, content, msg_id as msgId, uuid, state, is_sender as isSender, quote
    FROM messages
`
async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('whisperDB');
    await migrateDbIfNeeded(db)
  }
  return db!
}

export async function getValue(key: string): Promise<string | null> {
  const db = await getDB();
  const row: {value: string} | null = await db.getFirstAsync(`SELECT value FROM kv WHERE key = ?`, [key])
  if (!row) { 
    console.log(`no key: ${key}`)
  }
  return row!.value
}

export async function setValue(key: string, value: string) {
  const db = await getDB();
  await db.runAsync(`INSERT OR REPLACE INTO kv (key, value) VALUES(?, ?)`, [key, value])
}

export async function saveMessages(messages: Message[]) {
  return Promise.all(messages.map(msg => {
    saveMessage(msg)
  }))
}

export async function recallMessgae(uuid: number): Promise<boolean> {
  const db = await getDB();
  return db.getAllAsync(`UPDATE messages SET state = 3 WHERE uuid = ?`, [uuid]).then(() => true).catch((e) => {
    console.log('recall message error: ', e)
    return false
  })
}

export async function getMessageByUUID(uuid: number): Promise<Message | null> {
  const db = await getDB();
  return db.getAllAsync(`
    ${SELECT_STRING}
    WHERE uuid = ?
    `, [uuid]).then(rows => {
      let msg = rows.length > 0 ? rows[0] as Message : null
      return msg ? { ...msg, content: JSON.parse(msg?.content as string) } : null
    }).catch(e => {
      return null
    })
}

export async function delMessgae(uuid: number): Promise<boolean> {
  const db = await getDB();
  return db.runAsync(`DELETE FROM messages WHERE uuid = ?`, [uuid]).then(() => true).catch((e) => {
    console.log('delete message error: ', e)
    return false
  })
}

export async function saveMessage(message: Message): Promise<number> {
  console.log('message to save: ', message)
  const db = await getDB();
  await db.runAsync(`
    INSERT INTO messages (username, room_id, type, content, msg_id, uuid, state, is_sender, quote)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT DO NOTHING`,
    [
      message.senderId,
      message.roomId,
      message.type as number,
      JSON.stringify(message.content),
      message.msgId,
      message.uuid,
      message.state as number,
      message.isSender ? 1 : 0,
      message.quote ? message.quote.uuid : 0
    ])
  console.log("save message success")
  const row: {id:number} | null = await db.getFirstAsync(`SELECT last_insert_rowid() as id`)
  return row!.id
}


export async function failed(roomId: string, msgId: number) {
  const db = await getDB();
  await db.runAsync(`
    UPDATE messages
    SET state = 2
    WHERE room_id = ?
    AND msg_id = ?
    AND is_sender = 1
    `, [roomId, msgId])
}

export async function updateContent(roomId: string, uuid: number, content: { img: string; thumbnail: string; }) {
  console.log(`to be updated, uuid: ${uuid}`)
  const db = await getDB();
  await db.runAsync(`
    UPDATE messages
    SET content = ?
    WHERE room_id = ?
    AND uuid= ?
    `, [JSON.stringify(content), roomId, uuid])
}

export async function updateUUID(id: number, uuid: number) {
  console.log(`to be updated id: ${id}, uuid: ${uuid}`)
  const db = await getDB();
  await db.runAsync(`
    UPDATE messages
    SET uuid = ? , state = 1
    WHERE id = ?
    `, [uuid, id])
}

export async function getLastReceivedMessageUUID(roomId: string): Promise<number> {
  const db = await getDB();
  let uuids: { uuid: number }[] 
  uuids = await db.getAllAsync(`
    SELECT uuid FROM messages
    WHERE room_id = ?
    AND is_sender = 0
    ORDER BY uuid DESC
    LIMIT 1
    `, [roomId])
  return uuids.length > 0 ? uuids[0].uuid : 0
}

export async function getMessages(roomId: string, direction: "before" | "after", limit: number, uuid?: number): Promise<Message[]> {
  
  const db = await getDB();
  let rows: {
    msgId: number,
    senderId: string,
    content: string
    uuid: number,
    type: MessageType,
    state: MessageState,
    roomId: string,
    isSender: boolean,
    quote: number
    avatar?: string,
  }[]
  if (uuid && direction === "before") {
    rows = await db.getAllAsync(`
    ${SELECT_STRING}
    WHERE room_id = ?
    AND uuid < ?
    ORDER BY uuid DESC
    LIMIT ?
    `, [roomId, uuid, limit])
    console.log('rows1: ', rows)
  } else if (uuid && direction === "after") {
    rows = await db.getAllAsync(`
    ${SELECT_STRING}
    WHERE room_id = ?
    AND uuid > ?
    ORDER BY uuid
    LIMIT ?
    `, [roomId, uuid, limit])
    console.log('rows2: ', rows)
  } else {
    rows = await db.getAllAsync(`
    ${SELECT_STRING}
    WHERE room_id = ?
    ORDER BY uuid DESC
    LIMIT ?
    `, [roomId, limit])
    console.log('rows3: ', rows)
  }

  return Promise.all(rows.map(async row => {
    const msg = JSON.parse(row.content)
    try {
      const avatar = await getAvatar(row.senderId)
      return { ...row, content: msg, avatar: avatar, quote: await getMessageByUUID(row.quote) }
    } catch (error) {
      // Alert.alert('[storate.getMessages]',`获取头像失败: ${JSON.stringify(error)}`)
      console.log('error get avatar for: ', row.senderId, error)
      throw error
    }
  }))
}


export async function getImagesMessages(roomId: string): Promise<Message[]> {
  const db = await getDB();
  const rows: Message[] = await db.getAllAsync(`
    ${SELECT_STRING}
    WHERE room_id = ?
    AND type = 1
    `, [roomId])

  return rows.map(row => {
    const msg = JSON.parse(row.content as string)
    return {...row, content: msg}
  })
}



async function migrateDbIfNeeded(db: SQLite.SQLiteDatabase) {
  const DATABASE_VERSION = 2;
  let currentDbVersion  = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  let user_version = currentDbVersion!.user_version
  console.log('user_version: ', user_version)
  if (user_version >= DATABASE_VERSION) {
    return;
  }
  if (user_version === 0) {
    console.log('migrating db...')
    await db.execAsync(`
      DROP TABLE IF EXISTS kv;
      CREATE TABLE kv (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT NOT NULL,
          value TEXT NOT NULL
      );
      DROP TABLE IF EXISTS messages;
      CREATE TABLE messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL,
          room_id TEXT NOT NULL,
          type INT NOT NULL,
          content TEXT NOT NULL,
          msg_id INT NOT NULL,
          uuid UNSIGNED INT NOT NULL,
          state INT NOT NULL,
          is_sender INT NOT NULL
      );
      CREATE UNIQUE INDEX 'uniq_rum' ON messages (room_id, username, msg_id);
      CREATE INDEX 'idx_ru' ON messages (room_id, uuid);
      CREATE UNIQUE INDEX 'idx_k' ON kv (key);
    `);
    user_version += 1
  }
  if (user_version === 1) {
    console.log('add quote column...')
    await db.execAsync('alter table messages add column quote UNSIGNED INT NOT NULL DEFAULT 0;')
    user_version += 1
  }
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}


export async function setAvatar(username: string, avatar: string): Promise<string> {
  if (avatar.startsWith('http')) {
    const avatarUrl = await Net.downloadFile(avatar, "avatar", "avatar")
    await setValue(`avatar_${username}`, avatarUrl)
    avatarMap.set(username, avatarUrl)
    return avatarUrl
  }
  return avatar
}


export async function getAvatar(username: string): Promise<string> {
  if (avatarMap.has(username)) {
    return avatarMap.get(username)!
  }
  const avatar = await getValue(`avatar_${username}`)
  if (!avatar) {
    return ''
  }
  avatarMap.set(username, avatar)
  return avatar
}