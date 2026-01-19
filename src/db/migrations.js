import { v4 as uuidv4 } from 'uuid';
import { nowIsoString } from '../utils/dates';

export const migrations = [
  {
    version: 1,
    name: 'create-core-tables',
    up: async (db) => {
      await db.execAsync(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS metadata (
          key TEXT PRIMARY KEY,
          value TEXT
        );
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY NOT NULL,
          remoteId TEXT,
          name TEXT,
          mail TEXT,
          password TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          deletedAt TEXT,
          lastSyncedAt TEXT,
          syncStatus TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_users_mail ON users(mail);
        CREATE TABLE IF NOT EXISTS training_plans (
          id TEXT PRIMARY KEY NOT NULL,
          remoteId TEXT,
          userId TEXT NOT NULL,
          name TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          deletedAt TEXT,
          lastSyncedAt TEXT,
          syncStatus TEXT NOT NULL,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_training_plans_user ON training_plans(userId);
        CREATE INDEX IF NOT EXISTS idx_training_plans_sync ON training_plans(syncStatus);
        CREATE TABLE IF NOT EXISTS exercises (
          id TEXT PRIMARY KEY NOT NULL,
          remoteId TEXT,
          trainingPlanId TEXT NOT NULL,
          userId TEXT NOT NULL,
          name TEXT NOT NULL,
          sets INTEGER DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          deletedAt TEXT,
          lastSyncedAt TEXT,
          syncStatus TEXT NOT NULL,
          FOREIGN KEY (trainingPlanId) REFERENCES training_plans(id) ON DELETE CASCADE,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_exercises_training_plan ON exercises(trainingPlanId);
        CREATE INDEX IF NOT EXISTS idx_exercises_sync ON exercises(syncStatus);
        CREATE TABLE IF NOT EXISTS workouts (
          id TEXT PRIMARY KEY NOT NULL,
          remoteId TEXT,
          trainingPlanId TEXT NOT NULL,
          userId TEXT NOT NULL,
          startedAt TEXT NOT NULL,
          completedAt TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          deletedAt TEXT,
          lastSyncedAt TEXT,
          syncStatus TEXT NOT NULL,
          FOREIGN KEY (trainingPlanId) REFERENCES training_plans(id) ON DELETE CASCADE,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_workouts_user_plan ON workouts(userId, trainingPlanId);
        CREATE INDEX IF NOT EXISTS idx_workouts_sync ON workouts(syncStatus);
        CREATE TABLE IF NOT EXISTS exercise_sets (
          id TEXT PRIMARY KEY NOT NULL,
          remoteId TEXT,
          workoutId TEXT NOT NULL,
          exerciseId TEXT NOT NULL,
          setNumber INTEGER NOT NULL,
          reps INTEGER DEFAULT 0,
          weight REAL DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          deletedAt TEXT,
          lastSyncedAt TEXT,
          syncStatus TEXT NOT NULL,
          FOREIGN KEY (workoutId) REFERENCES workouts(id) ON DELETE CASCADE,
          FOREIGN KEY (exerciseId) REFERENCES exercises(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_sets_workout ON exercise_sets(workoutId);
        CREATE INDEX IF NOT EXISTS idx_sets_exercise ON exercise_sets(exerciseId);
        CREATE INDEX IF NOT EXISTS idx_sets_sync ON exercise_sets(syncStatus);
        CREATE TABLE IF NOT EXISTS outbox (
          id TEXT PRIMARY KEY NOT NULL,
          entityType TEXT NOT NULL,
          entityId TEXT NOT NULL,
          operation TEXT NOT NULL,
          payload TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          status TEXT NOT NULL,
          error TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox(status);
        CREATE TABLE IF NOT EXISTS sync_state (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT
        );
      `);

      await db.runAsync(
        'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
        ['db_version', String(1)],
      );
      await db.runAsync(
        'INSERT OR REPLACE INTO sync_state (key, value) VALUES (?, ?)',
        ['lastSyncedAt', null],
      );
      await db.runAsync(
        'INSERT OR REPLACE INTO sync_state (key, value) VALUES (?, ?)',
        ['migratedAt', nowIsoString()],
      );
    },
  },
  {
    version: 2,
    name: 'add-training-plan-exercise-mapping',
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS training_plan_exercises (
          id TEXT PRIMARY KEY NOT NULL,
          trainingPlanId TEXT NOT NULL,
          exerciseId TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          UNIQUE(trainingPlanId, exerciseId),
          FOREIGN KEY (trainingPlanId) REFERENCES training_plans(id) ON DELETE CASCADE,
          FOREIGN KEY (exerciseId) REFERENCES exercises(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_tpe_training_plan ON training_plan_exercises(trainingPlanId);
        CREATE INDEX IF NOT EXISTS idx_tpe_exercise ON training_plan_exercises(exerciseId);
      `);

      // Backfill existing exercises to mapping table so current data keeps working.
      const existingExercises = await db.getAllAsync('SELECT id, trainingPlanId, createdAt FROM exercises');
      for (const exercise of existingExercises) {
        if (exercise.trainingPlanId) {
          await db.runAsync(
            'INSERT OR IGNORE INTO training_plan_exercises (id, trainingPlanId, exerciseId, createdAt) VALUES (?, ?, ?, ?)',
            [uuidv4(), exercise.trainingPlanId, exercise.id, exercise.createdAt || nowIsoString()],
          );
        }
      }
    },
  },
];

export const runMigrations = async (db) => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
  const currentVersionRow = await db.getFirstAsync(
    'SELECT value FROM metadata WHERE key = ?',
    ['db_version'],
  );
  let currentVersion = currentVersionRow ? Number(currentVersionRow.value) : 0;

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      await migration.up(db);
      currentVersion = migration.version;
      await db.runAsync(
        'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
        ['db_version', String(currentVersion)],
      );
    }
  }
};
