import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';

let dbInstance = null;
let initPromise = null;

const openDatabase = async () => {
  const db = await SQLite.openDatabaseAsync('workout-offline.db');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await runMigrations(db);
  return db;
};

export const getDb = async () => {
  if (dbInstance) return dbInstance;
  if (!initPromise) {
    initPromise = openDatabase();
  }
  dbInstance = await initPromise;
  return dbInstance;
};

export const runInTransaction = async (callback) => {
  const db = await getDb();
  await db.execAsync('BEGIN IMMEDIATE;');
  try {
    const result = await callback(db);
    await db.execAsync('COMMIT;');
    return result;
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
};
