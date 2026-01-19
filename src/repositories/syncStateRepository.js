import { getDb } from '../db';
import { nowIsoString } from '../utils/dates';

export const getSyncValue = async (key) => {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT value FROM sync_state WHERE key = ?', [key]);
  return row ? row.value : null;
};

export const setSyncValue = async (key, value) => {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO sync_state (key, value) VALUES (?, ?)', [key, value]);
};

export const getLastSyncedAt = async () => getSyncValue('lastSyncedAt');
export const setLastSyncedAt = async (value = nowIsoString()) => setSyncValue('lastSyncedAt', value);
export const setLastSyncError = async (message) => setSyncValue('lastSyncError', message);
export const clearLastSyncError = async () => setSyncValue('lastSyncError', null);
