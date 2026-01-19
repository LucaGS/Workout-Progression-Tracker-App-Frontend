import { getDb } from './connection';

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
