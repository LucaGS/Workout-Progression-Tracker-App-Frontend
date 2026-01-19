import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import ExerciseItem from '../components/ExerciseItem';
import 'react-native-gesture-handler';
import SkeletonList from '../components/SkeletonList';
import { palette, spacing, radius, typography } from '../theme';
import { useServices } from '../../app/useServices';

const WorkoutScreen = ({ route }) => {
  const { userId, trainingplanid, startedTrainingId } = route.params;
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const services = useServices();

  useEffect(() => {
    const fetchExercises = async () => {
      if (!services) return;
      setLoading(true);
      setError(null);
      try {
        const data = await services.exercises.listForPlan.execute({ userId, trainingPlanId: trainingplanid });
        setExercises(createExerciseList(data));
      } catch (err) {
        setError(err.message || 'Übungen konnten nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [userId, trainingplanid, services]);

  const createExerciseList = (list) => {
    return list.flatMap((exercise) =>
      Array.from({ length: Math.min(exercise.sets || 0, 10) }, (_, index) => ({
        ...exercise,
        setNumber: index + 1,
        weight: '',
        reps: '',
      })),
    );
  };

  const handleLogged = () => {
    setStatus('Satz gespeichert. Weiter so!');
  };

  if (!services) {
    return (
      <View style={styles.container}>
        <SkeletonList rows={5} height={64} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Workout · Plan {trainingplanid}</Text>
        <Text style={styles.subText}>Training-ID: {startedTrainingId}</Text>
      </View>
      {status && <Text style={styles.status}>{status}</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}
      {loading ? (
        <SkeletonList rows={5} height={64} />
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => `${item.id}-${item.setNumber}`}
          renderItem={({ item }) => (
            <ExerciseItem
              item={item}
              userid={userId}
              excerciseid={item.id}
              trainingplanid={trainingplanid}
              startedtrainingid={startedTrainingId}
              onLogged={handleLogged}
            />
          )}
          contentContainerStyle={{ paddingBottom: spacing.lg }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Keine Übungen in diesem Plan. Füge welche hinzu und starte dann das Workout.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: palette.background,
  },
  headerRow: {
    marginBottom: spacing.md,
  },
  header: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
    color: palette.text,
  },
  subText: {
    ...typography.muted,
  },
  status: {
    color: palette.success,
    marginBottom: spacing.sm,
  },
  errorText: {
    color: palette.danger,
    marginBottom: spacing.sm,
  },
  empty: {
    padding: spacing.md,
    backgroundColor: palette.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  emptyText: {
    ...typography.body,
  },
});

export default WorkoutScreen;
