export const makeListTrainingPlans = (trainingPlanRepo) => ({
  execute: async (userId) => trainingPlanRepo.listByUser(userId),
});

export const makeCreateTrainingPlan = (trainingPlanRepo) => ({
  execute: async (input) => trainingPlanRepo.create(input),
});

export const makeRemoveTrainingPlan = (trainingPlanRepo) => ({
  execute: async (id) => trainingPlanRepo.remove(id),
});
