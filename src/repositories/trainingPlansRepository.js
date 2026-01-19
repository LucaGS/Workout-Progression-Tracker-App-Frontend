import { v4 as uuidv4 } from 'uuid';
import { getDb, runInTransaction } from '../db';
import { nowIsoString } from '../utils/dates';
import { enqueueOutbox, clearOutboxForEntity } from './outboxRepository';
import { SYNC_STATUS } from './status';

export const getTrainingPlans = async (userId) => {
  const db = await getDb();
  return db.getAllAsync(
    'SELECT * FROM training_plans WHERE userId = ? AND deletedAt IS NULL ORDER BY updatedAt DESC',
    [userId],
  );
};

export const createTrainingPlan = async ({ userId, name }) => {
  const id = uuidv4();
  const timestamp = nowIsoString();
  await runInTransaction(async (db) => {
    await db.runAsync(
      `
      INSERT INTO training_plans (id, remoteId, userId, name, createdAt, updatedAt, deletedAt, lastSyncedAt, syncStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [id, null, userId, name, timestamp, timestamp, null, null, SYNC_STATUS.PENDING_CREATE],
    );
    await enqueueOutbox(
      {
        entityType: 'training_plan',
        entityId: id,
        operation: 'create',
        payload: { id, userId, name, createdAt: timestamp, updatedAt: timestamp },
      },
      db,
    );
  });
  return { id, userId, name, createdAt: timestamp, updatedAt: timestamp, syncStatus: SYNC_STATUS.PENDING_CREATE };
};

export const updateTrainingPlan = async ({ id, name }) => {
  const db = await getDb();
  const timestamp = nowIsoString();
  await runInTransaction(async (txDb) => {
    await txDb.runAsync('UPDATE training_plans SET name = ?, updatedAt = ?, syncStatus = ? WHERE id = ?', [
      name,
      timestamp,
      SYNC_STATUS.PENDING_UPDATE,
      id,
    ]);
    await enqueueOutbox(
      { entityType: 'training_plan', entityId: id, operation: 'update', payload: { id, name, updatedAt: timestamp } },
      txDb,
    );
  });
};

export const softDeleteTrainingPlan = async (id) => {
  const timestamp = nowIsoString();
  await runInTransaction(async (db) => {
    await db.runAsync(
      'UPDATE training_plans SET deletedAt = ?, syncStatus = ?, updatedAt = ? WHERE id = ?',
      [timestamp, SYNC_STATUS.PENDING_DELETE, timestamp, id],
    );
    await enqueueOutbox(
      { entityType: 'training_plan', entityId: id, operation: 'delete', payload: { id, deletedAt: timestamp } },
      db,
    );
  });
};

export const upsertTrainingPlanFromRemote = async (plan) => {
  const db = await getDb();
  const now = nowIsoString();
  const existing = await db.getFirstAsync('SELECT id, updatedAt FROM training_plans WHERE remoteId = ?', [plan.remoteId]);

  if (!existing) {
    const localId = uuidv4();
    await db.runAsync(
      `
      INSERT INTO training_plans (id, remoteId, userId, name, createdAt, updatedAt, deletedAt, lastSyncedAt, syncStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        localId,
        plan.remoteId,
        plan.userId,
        plan.name,
        plan.createdAt || now,
        plan.updatedAt || now,
        plan.deletedAt || null,
        now,
        SYNC_STATUS.SYNCED,
      ],
    );
    return localId;
  }

  if (new Date(plan.updatedAt || now) > new Date(existing.updatedAt)) {
    await db.runAsync(
      `
      UPDATE training_plans
      SET name = ?, updatedAt = ?, deletedAt = ?, lastSyncedAt = ?, syncStatus = ?
      WHERE remoteId = ?
    `,
      [plan.name, plan.updatedAt || now, plan.deletedAt || null, now, SYNC_STATUS.SYNCED, plan.remoteId],
    );
  }
  await clearOutboxForEntity(existing.id, 'training_plan', db);
  return existing.id;
};
