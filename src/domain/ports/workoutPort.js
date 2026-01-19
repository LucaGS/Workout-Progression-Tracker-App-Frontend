/**
 * @typedef {Object} WorkoutPort
 * @property {(params: { userId: string, trainingPlanId: string }) => Promise<any>} start
 * @property {(params: { userId: string, trainingPlanId: string }) => Promise<any[]>} listHistory
 * @property {(params: { exerciseId: string }) => Promise<any[]>} historyByExercise
 * @property {(params: { workoutId: string, exerciseId: string, setNumber: number, reps: number, weight: number, trainingPlanId: string, userId: string }) => Promise<any>} logSet
 */

export const WorkoutPort = {};
