import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../infrastructure/db/connection';
import { runInTransaction } from '../../infrastructure/db/transactions';
import { nowIsoString } from '../../utils/dates';

const SYNCED = 'synced';
const PENDING_DELETE = 'pending_delete';

export const makeExerciseRepository = () => ({
  listForPlan: async ({ userId, trainingPlanId }) => {
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
  },

  create: async ({ userId, trainingPlanId, name, sets }) => {
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
          SYNCED,
        ],
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
  },

  addExistingToPlan: async ({ trainingPlanId, exerciseId }) => {
    const db = await getDb();
    const timestamp = nowIsoString();
    await db.runAsync(
      `
      INSERT OR IGNORE INTO training_plan_exercises (id, trainingPlanId, exerciseId, createdAt)
      VALUES (?, ?, ?, ?)
    `,
      [uuidv4(), trainingPlanId, exerciseId, timestamp],
    );
  },

  softDelete: async (id) => {
    const timestamp = nowIsoString();
    await runInTransaction(async (db) => {
      await db.runAsync('UPDATE exercises SET deletedAt = ?, syncStatus = ?, updatedAt = ? WHERE id = ?', [
        timestamp,
        PENDING_DELETE,
        timestamp,
        id,
      ]);
    });
  },

  listAvailableForPlan: async ({ userId, trainingPlanId }) => {
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
  },
});
