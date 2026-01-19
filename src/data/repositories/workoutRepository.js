import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../infrastructure/db/connection';
import { runInTransaction } from '../../infrastructure/db/transactions';
import { nowIsoString } from '../../utils/dates';

const SYNCED = 'synced';

export const makeWorkoutRepository = () => ({
  start: async ({ userId, trainingPlanId }) => {
    const id = uuidv4();
    const timestamp = nowIsoString();
    await runInTransaction(async (db) => {
      await db.runAsync(
        `
        INSERT INTO workouts (id, remoteId, trainingPlanId, userId, startedAt, completedAt, createdAt, updatedAt, deletedAt, lastSyncedAt, syncStatus)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [id, null, trainingPlanId, userId, timestamp, null, timestamp, timestamp, null, null, SYNCED],
      );
    });
    return { id, startedAt: timestamp, trainingPlanId, userId };
  },

  logSet: async ({ workoutId, exerciseId, setNumber, reps, weight, trainingPlanId, userId }) => {
    const id = uuidv4();
    const timestamp = nowIsoString();
    await runInTransaction(async (db) => {
      await db.runAsync(
        `
        INSERT INTO exercise_sets (id, remoteId, workoutId, exerciseId, setNumber, reps, weight, createdAt, updatedAt, deletedAt, lastSyncedAt, syncStatus)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [id, null, workoutId, exerciseId, setNumber, reps || 0, weight || 0, timestamp, timestamp, null, null, SYNCED],
      );
      await db.runAsync('UPDATE workouts SET updatedAt = ? WHERE id = ?', [timestamp, workoutId]);
    });
    return { id, workoutId, exerciseId, trainingPlanId, userId, setNumber, reps, weight, createdAt: timestamp };
  },

  listHistory: async ({ userId, trainingPlanId }) => {
    const db = await getDb();
    const workouts = await db.getAllAsync(
      `
      SELECT w.*, tp.name as trainingPlanName
      FROM workouts w
      LEFT JOIN training_plans tp ON tp.id = w.trainingPlanId
      WHERE w.userId = ? AND w.trainingPlanId = ? AND w.deletedAt IS NULL
      ORDER BY w.startedAt DESC
    `,
      [userId, trainingPlanId],
    );

    const workoutList = [];
    for (const workout of workouts) {
      const sets = await db.getAllAsync(
        `
        SELECT es.*, ex.name as exerciseName
        FROM exercise_sets es
        LEFT JOIN exercises ex ON es.exerciseId = ex.id
        WHERE es.workoutId = ? AND es.deletedAt IS NULL
        ORDER BY es.exerciseId, es.setNumber ASC
      `,
        [workout.id],
      );

      const grouped = sets.reduce((acc, row) => {
        if (!acc[row.exerciseId]) {
          acc[row.exerciseId] = {
            exerciseId: row.exerciseId,
            exerciseName: row.exerciseName,
            exerciseSets: [],
          };
        }
        acc[row.exerciseId].exerciseSets.push({
          id: row.id,
          setNumber: row.setNumber,
          reps: row.reps,
          weight: row.weight,
        });
        return acc;
      }, {});

      workoutList.push({
        ...workout,
        trainingPlanName: workout.trainingPlanName,
        exercises: Object.values(grouped),
      });
    }

    return workoutList;
  },

  historyByExercise: async ({ exerciseId }) => {
    const db = await getDb();
    const rows = await db.getAllAsync(
      `
      SELECT es.setNumber, es.reps, es.weight, w.startedAt as date
      FROM exercise_sets es
      JOIN workouts w ON w.id = es.workoutId
      WHERE es.exerciseId = ? AND es.deletedAt IS NULL
      ORDER BY w.startedAt DESC, es.setNumber ASC
    `,
      [exerciseId],
    );

    const groupedByDate = rows.reduce((acc, row) => {
      if (!acc[row.date]) acc[row.date] = [];
      acc[row.date].push(row);
      return acc;
    }, {});

    return Object.entries(groupedByDate).map(([date, sets]) => {
      const average =
        sets.length === 0
          ? 0
          : Math.round((sets.reduce((sum, s) => sum + (Number(s.weight) || 0), 0) / sets.length) * 10) / 10;
      return {
        date,
        avg: average,
        sets: sets.map((set) => ({
          set: set.setNumber,
          reps: set.reps,
          weight: set.weight,
        })),
      };
    });
  },
});
