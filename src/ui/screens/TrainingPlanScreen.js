import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import EmptyState from '../components/EmptyState';
import SkeletonList from '../components/SkeletonList';
import { palette, spacing, radius, typography } from '../theme';
import { useServices } from '../../app/useServices';

const TrainingPlanScreen = ({ route, navigation }) => {
  const { userId, trainingplanid, trainingplanname } = route.params;
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseSets, setNewExerciseSets] = useState('');
  const [showInputs, setShowInputs] = useState(false);
  const [availableExercises, setAvailableExercises] = useState([]);
  const [availableFilter, setAvailableFilter] = useState('');
  const services = useServices();

  const exerciseNameInputRef = useRef(null);
  const exerciseSetsInputRef = useRef(null);

  const fetchExercises = async () => {
    if (!services) return;
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const data = await services.exercises.listForPlan.execute({ userId, trainingPlanId: trainingplanid });
      setExercises(data);
      const available = await services.exercises.listAvailable.execute({ userId, trainingPlanId: trainingplanid });
      setAvailableExercises(available);
    } catch (err) {
      setError(err.message || 'Übungen konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (services) {
      fetchExercises();
    }
  }, [userId, trainingplanid, services]);

  useFocusEffect(
    useCallback(() => {
      fetchExercises();
    }, [userId, trainingplanid, services]),
  );

  if (!services) {
    return (
      <View style={styles.container}>
        <SkeletonList rows={4} height={64} />
      </View>
    );
  }

  const handleAddExercise = async () => {
    if (!newExerciseName.trim() || !newExerciseSets.trim()) {
      Alert.alert('Hinweis', 'Bitte Name und Anzahl der Sets angeben.');
      return;
    }

    try {
      await services.exercises.create.execute({
        userId,
        trainingPlanId: trainingplanid,
        name: newExerciseName.trim(),
        sets: parseInt(newExerciseSets, 10),
      });
      await fetchExercises();
      setNewExerciseName('');
      setNewExerciseSets('');
      exerciseNameInputRef.current?.focus();
      setStatus('Übung gespeichert. Du kannst sofort loslegen.');
    } catch (createErr) {
      Alert.alert('Fehler', createErr.message || 'Übung konnte nicht angelegt werden.');
    }
  };

  const handleAddExistingExercise = async (exerciseId) => {
    try {
      await services.exercises.addExisting.execute({ exerciseId, trainingPlanId: trainingplanid });
      await fetchExercises();
      setStatus('Übung hinzugefügt. Keine Duplikate erstellt.');
    } catch (err) {
      Alert.alert('Fehler', err.message || 'Konnte Übung nicht hinzufügen.');
    }
  };

  const handleDeleteExercise = async (exerciseId) => {
    Alert.alert(
      'Übung entfernen',
      'Diese Übung wird aus diesem Training entfernt. Sie bleibt in anderen Trainings erhalten.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Entfernen',
          style: 'destructive',
          onPress: async () => {
            try {
              await services.exercises.softDelete.execute(exerciseId);
              await fetchExercises();
              setStatus('Übung entfernt.');
            } catch (deleteErr) {
              Alert.alert('Fehler', deleteErr.message || 'Löschen nicht möglich.');
            }
          },
        },
      ],
      { cancelable: false },
    );
  };

  const navigateToWorkoutScreen = async () => {
    try {
      const workout = await services.workouts.start.execute({ userId, trainingPlanId: trainingplanid });
      navigation.navigate('WorkoutScreen', {
        userId,
        trainingplanid,
        startedTrainingId: workout.id,
      });
    } catch (err) {
      Alert.alert('Fehler', err.message || 'Workout konnte nicht gestartet werden.');
    }
  };

  const navigateToPastWorkoutScreen = () => {
    navigation.navigate('PastWorkoutScreen', { userId, trainingPlanId: trainingplanid });
  };

  const renderItem = ({ item }) => (
    <View style={styles.exerciseItem}>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('PastExcercisesScreen', {
            userId,
            excerciseid: item.id,
            excercisename: item.name,
          })
        }
        style={{ flex: 1 }}
      >
        <Text style={styles.exerciseName}>
          {item.name} · {item.sets} Sets
        </Text>
        <Text style={styles.exerciseSub}>Tippen für Verlauf</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteExercise(item.id)}>
        <Text style={styles.deleteButtonText}>Entfernen</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAvailable = () => {
    const filtered = availableExercises.filter((ex) =>
      ex.name.toLowerCase().includes(availableFilter.trim().toLowerCase()),
    );

    if (availableExercises.length === 0) {
      return (
        <View style={styles.availableBox}>
          <Text style={styles.sectionTitle}>Bestehende Übungen hinzufügen</Text>
          <Text style={styles.muted}>Keine weiteren Übungen verfügbar. Lege neue Übungen an.</Text>
        </View>
      );
    }
    return (
      <View style={styles.availableBox}>
        <Text style={styles.sectionTitle}>Bestehende Übungen hinzufügen</Text>
        <TextInput
          style={styles.input}
          placeholder="Übungen durchsuchen"
          value={availableFilter}
          onChangeText={setAvailableFilter}
        />
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.availableItem}>
              <Text style={styles.availableName}>
                {item.name} · {item.sets} Sets
              </Text>
              <TouchableOpacity style={styles.addExistingButton} onPress={() => handleAddExistingExercise(item.id)}>
                <Text style={styles.addExistingText}>Hinzufügen</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.muted}>Keine Treffer. Andere Begriffe probieren.</Text>}
        />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 })}
    >
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.header}>{trainingplanname}</Text>
          <Text style={styles.subheader}>Offline · Sofort startklar</Text>
        </View>
        <TouchableOpacity style={styles.pastWorkoutButton} onPress={navigateToPastWorkoutScreen}>
          <Text style={styles.pastWorkoutButtonText}>Verläufe</Text>
        </TouchableOpacity>
      </View>

      {status && <Text style={styles.statusText}>{status}</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {loading ? (
        <SkeletonList rows={4} height={64} />
      ) : exercises.length === 0 ? (
        <EmptyState
          title="Noch keine Übungen"
          description="Füge neue oder bestehende Übungen hinzu, um dein Training zu starten."
          actionLabel="Übung anlegen"
          onAction={() => setShowInputs(true)}
        />
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: spacing.lg }}
        />
      )}

      {availableExercises.length > 0 && (
        <View style={styles.chipRow}>
          <Text style={styles.sectionTitle}>Schnell hinzufügen</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {availableExercises.slice(0, 8).map((ex) => (
              <TouchableOpacity key={ex.id} style={styles.chip} onPress={() => handleAddExistingExercise(ex.id)}>
                <Text style={styles.chipText}>{ex.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {renderAvailable()}

      {showInputs && (
        <View style={styles.inputContainer}>
          <Text style={styles.sectionTitle}>Neue Übung</Text>
          <TextInput
            ref={exerciseNameInputRef}
            style={styles.input}
            placeholder="Name"
            value={newExerciseName}
            onChangeText={setNewExerciseName}
          />
          <TextInput
            ref={exerciseSetsInputRef}
            style={styles.input}
            placeholder="Anzahl Sets"
            value={newExerciseSets}
            onChangeText={setNewExerciseSets}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddExercise}>
            <Text style={styles.buttonText}>Übung speichern</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={showInputs ? styles.cancelButton : styles.toggleButton}
        onPress={() => setShowInputs((prev) => !prev)}
      >
        <Text style={styles.buttonText}>{showInputs ? 'Eingabe schließen' : 'Neue Übung'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.startWorkoutButton} onPress={navigateToWorkoutScreen}>
        <Text style={styles.buttonText}>Workout starten</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: palette.background,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  header: {
    fontSize: 26,
    fontWeight: '800',
    color: palette.text,
  },
  subheader: {
    ...typography.muted,
  },
  pastWorkoutButton: {
    backgroundColor: '#e0f2fe',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastWorkoutButtonText: {
    color: '#0369a1',
    fontSize: 14,
    fontWeight: '700',
  },
  toggleButton: {
    marginTop: 10,
    marginBottom: 20,
    paddingVertical: spacing.md,
    backgroundColor: palette.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  cancelButton: {
    marginTop: 10,
    marginBottom: 20,
    paddingVertical: spacing.md,
    backgroundColor: palette.danger,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 20,
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
  },
  input: {
    height: 50,
    borderColor: palette.border,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: '#fff',
  },
  exerciseItem: {
    padding: spacing.md,
    marginVertical: 8,
    backgroundColor: palette.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '700',
  },
  exerciseSub: {
    ...typography.muted,
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: palette.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  startWorkoutButton: {
    paddingVertical: spacing.md,
    backgroundColor: palette.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  addButton: {
    marginVertical: 10,
    paddingVertical: spacing.md,
    backgroundColor: palette.primary,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusText: {
    color: palette.success,
    marginBottom: spacing.sm,
  },
  errorText: {
    color: palette.danger,
    marginBottom: spacing.sm,
  },
  availableBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: '#eef5ff',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.sm,
  },
  availableItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  availableName: {
    fontSize: 16,
  },
  addExistingButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  addExistingText: {
    color: '#fff',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  muted: {
    ...typography.muted,
  },
  chipRow: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  chip: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
  },
  chipText: {
    fontWeight: '600',
    color: palette.text,
  },
});

export default TrainingPlanScreen;
