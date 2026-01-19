import { v4 as uuidv4 } from 'uuid';
import { getDb, runInTransaction } from '../db';
import { nowIsoString } from '../utils/dates';
import { enqueueOutbox, clearOutboxForEntity } from './outboxRepository';
import { SYNC_STATUS } from './status';

export const startWorkout = async ({ userId, trainingPlanId }) => {
  const id = uuidv4();
  const timestamp = nowIsoString();
  await runInTransaction(async (db) => {
    await db.runAsync(
      `
      INSERT INTO workouts (id, remoteId, trainingPlanId, userId, startedAt, completedAt, createdAt, updatedAt, deletedAt, lastSyncedAt, syncStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [id, null, trainingPlanId, userId, timestamp, null, timestamp, timestamp, null, null, SYNC_STATUS.PENDING_CREATE],
    );
    await enqueueOutbox(
      {
        entityType: 'workout',
        entityId: id,
        operation: 'create',
        payload: { id, trainingPlanId, userId, startedAt: timestamp, createdAt: timestamp, updatedAt: timestamp },
      },
      db,
    );
  });

  return { id, startedAt: timestamp, trainingPlanId, userId };
};

export const completeWorkout = async (workoutId) => {
  const timestamp = nowIsoString();
  await runInTransaction(async (db) => {
    await db.runAsync(
      'UPDATE workouts SET completedAt = ?, updatedAt = ?, syncStatus = ? WHERE id = ?',
      [timestamp, timestamp, SYNC_STATUS.PENDING_UPDATE, workoutId],
    );
    await enqueueOutbox(
      { entityType: 'workout', entityId: workoutId, operation: 'update', payload: { id: workoutId, completedAt: timestamp } },
      db,
    );
  });
};

export const logExerciseSet = async ({ workoutId, exerciseId, setNumber, reps, weight, trainingPlanId, userId }) => {
  const id = uuidv4();
  const timestamp = nowIsoString();
  await runInTransaction(async (db) => {
    await db.runAsync(
      `
      INSERT INTO exercise_sets (id, remoteId, workoutId, exerciseId, setNumber, reps, weight, createdAt, updatedAt, deletedAt, lastSyncedAt, syncStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [id, null, workoutId, exerciseId, setNumber, reps || 0, weight || 0, timestamp, timestamp, null, null, SYNC_STATUS.PENDING_CREATE],
    );
    await enqueueOutbox(
      {
        entityType: 'exercise_set',
        entityId: id,
        operation: 'create',
        payload: {
          id,
          workoutId,
          exerciseId,
          trainingPlanId,
          userId,
          setNumber,
          reps,
          weight,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      },
      db,
    );
    await db.runAsync('UPDATE workouts SET updatedAt = ? WHERE id = ?', [timestamp, workoutId]);
  });
  return { id, workoutId, exerciseId, setNumber, reps, weight, createdAt: timestamp };
};

export const listPastWorkouts = async ({ userId, trainingPlanId }) => {
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
};

export const getExerciseHistory = async ({ exerciseId }) => {
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
};

export const upsertWorkoutFromRemote = async (workout) => {
  const db = await getDb();
  const now = nowIsoString();
  const existing = await db.getFirstAsync('SELECT id, updatedAt FROM workouts WHERE remoteId = ?', [workout.remoteId]);

  if (!existing) {
    const localId = uuidv4();
    await db.runAsync(
      `
      INSERT INTO workouts (id, remoteId, trainingPlanId, userId, startedAt, completedAt, createdAt, updatedAt, deletedAt, lastSyncedAt, syncStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        localId,
        workout.remoteId,
        workout.trainingPlanId,
        workout.userId,
        workout.startedAt || now,
        workout.completedAt || null,
        workout.createdAt || now,
        workout.updatedAt || now,
        workout.deletedAt || null,
        now,
        SYNC_STATUS.SYNCED,
      ],
    );
    return localId;
  }

  if (new Date(workout.updatedAt || now) > new Date(existing.updatedAt)) {
    await db.runAsync(
      `
      UPDATE workouts
      SET startedAt = ?, completedAt = ?, updatedAt = ?, deletedAt = ?, lastSyncedAt = ?, syncStatus = ?
      WHERE remoteId = ?
    `,
      [
        workout.startedAt || now,
        workout.completedAt || null,
        workout.updatedAt || now,
        workout.deletedAt || null,
        now,
        SYNC_STATUS.SYNCED,
        workout.remoteId,
      ],
    );
  }

  await clearOutboxForEntity(existing.id, 'workout', db);
  return existing.id;
};

export const upsertExerciseSetFromRemote = async (exerciseSet) => {
  const db = await getDb();
  const now = nowIsoString();
  const existing = await db.getFirstAsync('SELECT id, updatedAt FROM exercise_sets WHERE remoteId = ?', [
    exerciseSet.remoteId,
  ]);

  if (!existing) {
    const localId = uuidv4();
    await db.runAsync(
      `
      INSERT INTO exercise_sets (id, remoteId, workoutId, exerciseId, setNumber, reps, weight, createdAt, updatedAt, deletedAt, lastSyncedAt, syncStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        localId,
        exerciseSet.remoteId,
        exerciseSet.workoutId,
        exerciseSet.exerciseId,
        exerciseSet.setNumber,
        exerciseSet.reps,
        exerciseSet.weight,
        exerciseSet.createdAt || now,
        exerciseSet.updatedAt || now,
        exerciseSet.deletedAt || null,
        now,
        SYNC_STATUS.SYNCED,
      ],
    );
    return localId;
  }

  if (new Date(exerciseSet.updatedAt || now) > new Date(existing.updatedAt)) {
    await db.runAsync(
      `
      UPDATE exercise_sets
      SET setNumber = ?, reps = ?, weight = ?, updatedAt = ?, deletedAt = ?, lastSyncedAt = ?, syncStatus = ?
      WHERE remoteId = ?
    `,
      [
        exerciseSet.setNumber,
        exerciseSet.reps,
        exerciseSet.weight,
        exerciseSet.updatedAt || now,
        exerciseSet.deletedAt || null,
        now,
        SYNC_STATUS.SYNCED,
        exerciseSet.remoteId,
      ],
    );
  }

  await clearOutboxForEntity(existing.id, 'exercise_set', db);
  return existing.id;
};
