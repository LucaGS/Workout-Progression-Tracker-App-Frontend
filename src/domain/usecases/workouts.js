export const makeStartWorkout = (workoutRepo) => ({
  execute: async (params) => workoutRepo.start(params),
});

export const makeLogExerciseSet = (workoutRepo) => ({
  execute: async (params) => workoutRepo.logSet(params),
});

export const makeListPastWorkouts = (workoutRepo) => ({
  execute: async (params) => workoutRepo.listHistory(params),
});

export const makeGetExerciseHistory = (workoutRepo) => ({
  execute: async (params) => workoutRepo.historyByExercise(params),
});
