import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import { nowIsoString } from '../utils/dates';

const serializePayload = (payload) => JSON.stringify(payload ?? {});

export const enqueueOutbox = async (entry, providedDb) => {
  const db = providedDb || (await getDb());
  const id = uuidv4();
  const timestamp = nowIsoString();
  await db.runAsync(
    `
    INSERT INTO outbox (id, entityType, entityId, operation, payload, createdAt, updatedAt, status, error)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      id,
      entry.entityType,
      entry.entityId,
      entry.operation,
      serializePayload(entry.payload),
      timestamp,
      timestamp,
      entry.status || 'pending',
      null,
    ],
  );
  return id;
};

export const getPendingOutbox = async () => {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM outbox WHERE status = ? ORDER BY createdAt ASC', ['pending']);
};

export const markOutboxStatus = async (id, status, errorMessage = null) => {
  const db = await getDb();
  await db.runAsync(
    'UPDATE outbox SET status = ?, error = ?, updatedAt = ? WHERE id = ?',
    [status, errorMessage, nowIsoString(), id],
  );
};

export const clearOutboxForEntity = async (entityId, entityType, providedDb) => {
  const db = providedDb || (await getDb());
  await db.runAsync('DELETE FROM outbox WHERE entityId = ? AND entityType = ?', [entityId, entityType]);
};
