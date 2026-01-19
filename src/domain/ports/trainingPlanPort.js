/**
 * @typedef {Object} TrainingPlanPort
 * @property {(userId: string) => Promise<any[]>} listByUser
 * @property {(input: { userId: string, name: string }) => Promise<any>} create
 * @property {(id: string) => Promise<void>} remove
 */

export const TrainingPlanPort = {};
