jest.mock('../src/infrastructure/db/connection', () => {
  const mockDb = {
    runAsync: jest.fn(async () => {}),
    getAllAsync: jest.fn(async () => []),
    getFirstAsync: jest.fn(async () => null),
  };
  return {
    getDb: jest.fn(async () => mockDb),
    __mockDb: mockDb,
  };
});

jest.mock('../src/infrastructure/db/transactions', () => ({
  runInTransaction: async (cb) => {
    const { __mockDb } = require('../src/infrastructure/db/connection');
    return cb(__mockDb);
  },
}));

const { __mockDb } = require('../src/infrastructure/db/connection');
const { makeTrainingPlanRepository } = require('../src/data/repositories/trainingPlanRepository');
const { makeExerciseRepository } = require('../src/data/repositories/exerciseRepository');
const { makeWorkoutRepository } = require('../src/data/repositories/workoutRepository');

describe('Repository CRUD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a training plan locally', async () => {
    const repo = makeTrainingPlanRepository();
    await repo.create({ userId: 'user-1', name: 'Plan A' });

    expect(__mockDb.runAsync).toHaveBeenCalled();
  });

  it('creates exercise and reads exercises for a plan', async () => {
    const repo = makeExerciseRepository();
    __mockDb.getAllAsync.mockResolvedValueOnce([{ id: 'ex-1', name: 'Squat', sets: 3 }]);
    await repo.create({ userId: 'user-1', trainingPlanId: 'plan-1', name: 'Squat', sets: 3 });

    const result = await repo.listForPlan({ userId: 'user-1', trainingPlanId: 'plan-1' });
    expect(result).toEqual([{ id: 'ex-1', name: 'Squat', sets: 3 }]);
  });

  it('logs an exercise set and marks workout as updated', async () => {
    const repo = makeWorkoutRepository();
    await repo.logSet({
      workoutId: 'wo-1',
      exerciseId: 'ex-1',
      trainingPlanId: 'plan-1',
      userId: 'user-1',
      setNumber: 1,
      reps: 8,
      weight: 100,
    });

    expect(__mockDb.runAsync).toHaveBeenCalled();
  });
});
