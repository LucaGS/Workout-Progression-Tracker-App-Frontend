import { v4 as uuidv4 } from 'uuid';
import { getDb, runInTransaction } from '../db';
import { nowIsoString } from '../utils/dates';
import { enqueueOutbox, clearOutboxForEntity } from './outboxRepository';
import { SYNC_STATUS } from './status';

export const getExercisesForPlan = async ({ userId, trainingPlanId }) => {
  const db = await getDb();
  return db.getAllAsync(
    `
    SELECT ex.*
    FROM exercises ex
    JOIN training_plan_exercises map ON map.exerciseId = ex.id
    WHERE ex.userId = ? AND map.trainingPlanId = ? AND ex.deletedAt IS NULL
    ORDER BY ex.updatedAt DESC
  `,
    [userId, trainingPlanId],
  );
};

export const createExercise = async ({ userId, trainingPlanId, name, sets }) => {
  const id = uuidv4();
  const timestamp = nowIsoString();
  await runInTransaction(async (db) => {
    await db.runAsync(
      `
      INSERT INTO exercises (id, remoteId, trainingPlanId, userId, name, sets, createdAt, updatedAt, deletedAt, lastSyncedAt, syncStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        id,
        null,
        trainingPlanId,
        userId,
        name,
        Number(sets) || 0,
        timestamp,
        timestamp,
        null,
        null,
        SYNC_STATUS.PENDING_CREATE,
      ],
    );
    await enqueueOutbox(
      {
        entityType: 'exercise',
        entityId: id,
        operation: 'create',
        payload: { id, trainingPlanId, userId, name, sets, createdAt: timestamp, updatedAt: timestamp },
      },
      db,
    );
    await db.runAsync(
      `
      INSERT OR IGNORE INTO training_plan_exercises (id, trainingPlanId, exerciseId, createdAt)
      VALUES (?, ?, ?, ?)
    `,
      [uuidv4(), trainingPlanId, id, timestamp],
    );
  });
  return { id, trainingPlanId, userId, name, sets: Number(sets) || 0 };
};

export const softDeleteExercise = async (id) => {
  const timestamp = nowIsoString();
  await runInTransaction(async (db) => {
    await db.runAsync(
      'UPDATE exercises SET deletedAt = ?, syncStatus = ?, updatedAt = ? WHERE id = ?',
      [timestamp, SYNC_STATUS.PENDING_DELETE, timestamp, id],
    );
    await enqueueOutbox({ entityType: 'exercise', entityId: id, operation: 'delete', payload: { id, deletedAt: timestamp } }, db);
  });
};

export const upsertExerciseFromRemote = async (exercise) => {
  const db = await getDb();
  const now = nowIsoString();
  const existing = await db.getFirstAsync('SELECT id, updatedAt FROM exercises WHERE remoteId = ?', [exercise.remoteId]);

  if (!existing) {
    const localId = uuidv4();
    await db.runAsync(
      `
      INSERT INTO exercises (id, remoteId, trainingPlanId, userId, name, sets, createdAt, updatedAt, deletedAt, lastSyncedAt, syncStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        localId,
        exercise.remoteId,
        exercise.trainingPlanId,
        exercise.userId,
        exercise.name,
        exercise.sets,
        exercise.createdAt || now,
        exercise.updatedAt || now,
        exercise.deletedAt || null,
        now,
        SYNC_STATUS.SYNCED,
      ],
    );
    return localId;
  }

  if (new Date(exercise.updatedAt || now) > new Date(existing.updatedAt)) {
    await db.runAsync(
      `
      UPDATE exercises
      SET name = ?, sets = ?, updatedAt = ?, deletedAt = ?, lastSyncedAt = ?, syncStatus = ?
      WHERE remoteId = ?
    `,
      [
        exercise.name,
        exercise.sets,
        exercise.updatedAt || now,
        exercise.deletedAt || null,
        now,
        SYNC_STATUS.SYNCED,
        exercise.remoteId,
      ],
    );
  }

  await clearOutboxForEntity(existing.id, 'exercise', db);
  return existing.id;
};

export const getAvailableExercisesForPlan = async ({ userId, trainingPlanId }) => {
  const db = await getDb();
  return db.getAllAsync(
    `
    SELECT ex.*
    FROM exercises ex
    WHERE ex.userId = ?
      AND ex.deletedAt IS NULL
      AND ex.id NOT IN (
        SELECT exerciseId FROM training_plan_exercises WHERE trainingPlanId = ?
      )
    ORDER BY ex.name ASC
  `,
    [userId, trainingPlanId],
  );
};

export const addExistingExerciseToPlan = async ({ exerciseId, trainingPlanId }) => {
  const db = await getDb();
  const timestamp = nowIsoString();
  await db.runAsync(
    `
    INSERT OR IGNORE INTO training_plan_exercises (id, trainingPlanId, exerciseId, createdAt)
    VALUES (?, ?, ?, ?)
  `,
    [uuidv4(), trainingPlanId, exerciseId, timestamp],
  );
};
