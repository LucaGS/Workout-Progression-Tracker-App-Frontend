import { getDb } from '../infrastructure/db/connection';
import { makeTrainingPlanRepository } from '../data/repositories/trainingPlanRepository';
import { makeExerciseRepository } from '../data/repositories/exerciseRepository';
import { makeWorkoutRepository } from '../data/repositories/workoutRepository';
import {
  makeListTrainingPlans,
  makeCreateTrainingPlan,
  makeRemoveTrainingPlan,
} from '../domain/usecases/trainingPlans';
import {
  makeListExercisesForPlan,
  makeCreateExercise,
  makeSoftDeleteExercise,
  makeListAvailableExercises,
  makeAddExistingExerciseToPlan,
} from '../domain/usecases/exercises';
import {
  makeStartWorkout,
  makeLogExerciseSet,
  makeListPastWorkouts,
  makeGetExerciseHistory,
} from '../domain/usecases/workouts';
import { getOrCreateLocalUser } from '../repositories/usersRepository';

let containerPromise = null;

const buildContainer = async () => {
  await getDb();

  const trainingPlanRepo = makeTrainingPlanRepository();
  const exerciseRepo = makeExerciseRepository();
  const workoutRepo = makeWorkoutRepository();

  const usecases = {
    trainingPlans: {
      list: makeListTrainingPlans(trainingPlanRepo),
      create: makeCreateTrainingPlan(trainingPlanRepo),
      remove: makeRemoveTrainingPlan(trainingPlanRepo),
    },
    exercises: {
      listForPlan: makeListExercisesForPlan(exerciseRepo),
      create: makeCreateExercise(exerciseRepo),
      softDelete: makeSoftDeleteExercise(exerciseRepo),
      listAvailable: makeListAvailableExercises(exerciseRepo),
      addExisting: makeAddExistingExerciseToPlan(exerciseRepo),
    },
    workouts: {
      start: makeStartWorkout(workoutRepo),
      logSet: makeLogExerciseSet(workoutRepo),
      listPast: makeListPastWorkouts(workoutRepo),
      historyByExercise: makeGetExerciseHistory(workoutRepo),
    },
    users: {
      getOrCreateLocalUser,
    },
  };

  return { usecases };
};

export const getContainer = async () => {
  if (!containerPromise) {
    containerPromise = buildContainer();
  }
  return containerPromise;
};
