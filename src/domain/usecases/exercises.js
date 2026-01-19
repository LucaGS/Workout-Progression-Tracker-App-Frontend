export const makeListExercisesForPlan = (exerciseRepo) => ({
  execute: async (params) => exerciseRepo.listForPlan(params),
});

export const makeCreateExercise = (exerciseRepo) => ({
  execute: async (params) => exerciseRepo.create(params),
});

export const makeSoftDeleteExercise = (exerciseRepo) => ({
  execute: async (id) => exerciseRepo.softDelete(id),
});

export const makeListAvailableExercises = (exerciseRepo) => ({
  execute: async (params) => exerciseRepo.listAvailableForPlan(params),
});

export const makeAddExistingExerciseToPlan = (exerciseRepo) => ({
  execute: async (params) => exerciseRepo.addExistingToPlan(params),
});
