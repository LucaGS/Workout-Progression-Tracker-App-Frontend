import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import 'react-native-gesture-handler';
import EmptyState from '../components/EmptyState';
import { palette, spacing, radius, typography } from '../theme';
import { useServices } from '../../app/useServices';

const PastWorkoutScreen = ({ route }) => {
  const { userId, trainingPlanId } = route.params;
  const [pastWorkouts, setPastWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const services = useServices();
  if (!services) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Lade lokale Daten…</Text>
      </View>
    );
  }

  const fetchPastWorkouts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await services.workouts.listPast.execute({ userId, trainingPlanId });
      setPastWorkouts(data);
    } catch (err) {
      setError(err.message || 'Verlauf konnte nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPastWorkouts();
  }, [userId, trainingPlanId, services]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Ohne Datum';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderItem = ({ item }) => (
    <View style={styles.workoutContainer}>
      <Text style={styles.workoutTitle}>
        {item.trainingPlanName || 'Workout'} · {formatDate(item.startedAt)}
      </Text>

      {item.exercises.length > 0 ? (
        <FlatList
          data={item.exercises}
          keyExtractor={(exercise) => exercise.exerciseId.toString()}
          renderItem={({ item: exercise }) => (
            <View style={styles.exerciseContainer}>
              <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
              <FlatList
                data={exercise.exerciseSets}
                keyExtractor={(set) => set.id.toString()}
                renderItem={({ item: set }) => (
                  <View style={styles.setContainer}>
                    <Text>
                      {set.reps} x {set.weight} kg
                    </Text>
                  </View>
                )}
              />
            </View>
          )}
        />
      ) : (
        <Text style={styles.muted}>Keine Sätze erfasst.</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={styles.muted}>Verlauf wird geladen (lokal)…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return pastWorkouts.length === 0 ? (
    <View style={styles.container}>
      <EmptyState
        title="Noch keine Workouts"
        description="Starte ein Workout und erfasse Sätze, um hier deinen Verlauf zu sehen."
        actionLabel="Zurück"
        onAction={() => {}}
      />
    </View>
  ) : (
    <FlatList
      data={pastWorkouts}
      keyExtractor={(workout) => workout.id?.toString() || workout.startedTrainingId?.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: palette.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    color: palette.danger,
    fontSize: 16,
  },
  listContent: {
    padding: spacing.lg,
    backgroundColor: palette.background,
  },
  workoutContainer: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  exerciseContainer: {
    marginBottom: 10,
    paddingLeft: spacing.sm,
  },
  exerciseName: {
    fontWeight: '700',
    marginBottom: 4,
  },
  setContainer: {
    paddingLeft: spacing.md,
    paddingVertical: 4,
  },
  muted: {
    ...typography.muted,
  },
});

export default PastWorkoutScreen;
