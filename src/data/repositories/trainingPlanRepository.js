import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../infrastructure/db/connection';
import { runInTransaction } from '../../infrastructure/db/transactions';
import { nowIsoString } from '../../utils/dates';

const SYNCED = 'synced';
const PENDING_DELETE = 'pending_delete';

export const makeTrainingPlanRepository = () => ({
  listByUser: async (userId) => {
    const db = await getDb();
    return db.getAllAsync(
      'SELECT * FROM training_plans WHERE userId = ? AND deletedAt IS NULL ORDER BY updatedAt DESC',
      [userId],
    );
  },
  create: async ({ userId, name }) => {
    const id = uuidv4();
    const timestamp = nowIsoString();
    await runInTransaction(async (db) => {
      await db.runAsync(
        `
        INSERT INTO training_plans (id, remoteId, userId, name, createdAt, updatedAt, deletedAt, lastSyncedAt, syncStatus)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [id, null, userId, name, timestamp, timestamp, null, null, SYNCED],
      );
    });
    return { id, userId, name, createdAt: timestamp, updatedAt: timestamp, syncStatus: SYNCED };
  },
  remove: async (id) => {
    const timestamp = nowIsoString();
    await runInTransaction(async (db) => {
      await db.runAsync('UPDATE training_plans SET deletedAt = ?, syncStatus = ?, updatedAt = ? WHERE id = ?', [
        timestamp,
        PENDING_DELETE,
        timestamp,
        id,
      ]);
    });
  },
});
