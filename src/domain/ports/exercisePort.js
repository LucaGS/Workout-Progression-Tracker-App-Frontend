/**
 * @typedef {Object} ExercisePort
 * @property {(params: { userId: string, trainingPlanId: string }) => Promise<any[]>} listForPlan
 * @property {(params: { userId: string, trainingPlanId: string, name: string, sets: number }) => Promise<any>} create
 * @property {(id: string) => Promise<void>} softDelete
 * @property {(params: { userId: string, trainingPlanId: string }) => Promise<any[]>} listAvailableForPlan
 * @property {(params: { trainingPlanId: string, exerciseId: string }) => Promise<void>} addExistingToPlan
 */

export const ExercisePort = {};
