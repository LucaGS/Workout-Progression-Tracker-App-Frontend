import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../infrastructure/db/connection';
import { runInTransaction } from '../infrastructure/db/transactions';
import { nowIsoString } from '../utils/dates';

const CURRENT_USER_KEY = 'userId';
const DEFAULT_LOCAL_NAME = 'Offline User';

export const getCurrentUserId = async () => AsyncStorage.getItem(CURRENT_USER_KEY);
export const setCurrentUserId = async (userId) => AsyncStorage.setItem(CURRENT_USER_KEY, userId);
export const clearCurrentUser = async () => AsyncStorage.removeItem(CURRENT_USER_KEY);

const createLocalUserIfMissing = async () => {
  const db = await getDb();
  const existing = await db.getFirstAsync('SELECT id FROM users LIMIT 1');
  if (existing) {
    await setCurrentUserId(existing.id);
    return existing.id;
  }

  const id = uuidv4();
  const timestamp = nowIsoString();
  await db.runAsync(
    `
    INSERT INTO users (id, remoteId, name, mail, password, createdAt, updatedAt, deletedAt, lastSyncedAt, syncStatus)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [id, null, DEFAULT_LOCAL_NAME, '', '', timestamp, timestamp, null, null, 'synced'],
  );
  await setCurrentUserId(id);
  return id;
};

export const getOrCreateLocalUser = async () => {
  const userId = await getCurrentUserId();
  if (userId) return userId;
  return createLocalUserIfMissing();
};

export const signup = async ({ name, mail, password }) => {
  const id = uuidv4();
  const timestamp = nowIsoString();
  await runInTransaction(async (db) => {
    await db.runAsync(
      `
      INSERT INTO users (id, remoteId, name, mail, password, createdAt, updatedAt, deletedAt, lastSyncedAt, syncStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [id, null, name, mail, password, timestamp, timestamp, null, null, 'synced'],
    );
  });
  await setCurrentUserId(id);
  return { id, name, mail };
};

export const login = async ({ mail, password }) => {
  const db = await getDb();
  const user = await db.getFirstAsync(
    'SELECT * FROM users WHERE mail = ? AND password = ? AND deletedAt IS NULL',
    [mail, password],
  );
  if (!user) {
    throw new Error('Nutzer nicht gefunden. Registriere dich offline oder synchronisiere vorhandene Daten.');
  }
  await setCurrentUserId(user.id);
  return user;
};

export const ensureUserExists = async (userId) => {
  const db = await getDb();
  const existing = await db.getFirstAsync('SELECT id FROM users WHERE id = ? AND deletedAt IS NULL', [userId]);
  return Boolean(existing);
};

export const getUserById = async (userId) => {
  const db = await getDb();
  return db.getFirstAsync('SELECT * FROM users WHERE id = ?', [userId]);
};

export const updateUserCredentialsForSync = async ({ userId, name, mail, password }) => {
  const db = await getDb();
  const existing = await db.getFirstAsync('SELECT * FROM users WHERE id = ?', [userId]);
  if (!existing) {
    throw new Error('Nutzer nicht gefunden');
  }
  const timestamp = nowIsoString();

  await runInTransaction(async (txDb) => {
    await txDb.runAsync(
      `
      UPDATE users
      SET name = ?, mail = ?, password = ?, updatedAt = ?, syncStatus = ?
      WHERE id = ?
    `,
      [name || existing.name, mail || existing.mail, password || existing.password, timestamp, 'synced', userId],
    );
  });
};
