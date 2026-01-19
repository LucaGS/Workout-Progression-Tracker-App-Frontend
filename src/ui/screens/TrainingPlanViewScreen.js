import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import EmptyState from '../components/EmptyState';
import SkeletonList from '../components/SkeletonList';
import { palette, spacing, radius, typography } from '../theme';
import { useServices } from '../../app/useServices';

const TrainingPlanViewScreen = ({ route, navigation }) => {
  const { userId: routeUserId } = route.params || {};
  const [userId, setUserId] = useState(routeUserId || null);
  const [trainingPlans, setTrainingPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [newPlanName, setNewPlanName] = useState('');
  const [showInput, setShowInput] = useState(false);
  const nav = useNavigation();
  const services = useServices();

  const loadUserId = async () => {
    const storedUserId = await services?.users?.getOrCreateLocalUser();
    setUserId(storedUserId);
    return storedUserId;
  };

  const fetchTrainingPlans = async () => {
    if (!services) return;
    const id = userId || (await loadUserId());
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const plans = await services.trainingPlans.list.execute(id);
      setTrainingPlans(plans);
    } catch (loadError) {
      setError(loadError.message || 'Konnte Trainingspläne nicht laden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (services) {
      fetchTrainingPlans();
    }
  }, [userId, services]);

  useFocusEffect(
    useCallback(() => {
      fetchTrainingPlans();
    }, [userId, services]),
  );

  const handleTrainingPlanPress = (trainingPlan) => {
    navigation.navigate('TrainingPlanScreen', {
      trainingplanid: trainingPlan.id,
      trainingplanname: trainingPlan.name,
      userId: userId,
    });
  };

  const addTrainingPlan = async () => {
    if (!newPlanName.trim()) {
      Alert.alert('Hinweis', 'Bitte gib deinem Training einen Namen.');
      return;
    }

    try {
      const ensuredUserId = userId || (await loadUserId());
      if (!ensuredUserId) {
        Alert.alert('Fehler', 'Kein Nutzer angelegt. Bitte App neu starten.');
        return;
      }
      await services.trainingPlans.create.execute({ userId: ensuredUserId, name: newPlanName.trim() });
      await fetchTrainingPlans();
      setNewPlanName('');
      setShowInput(false);
      setStatus('Training gespeichert. Alles bleibt offline.');
    } catch (createError) {
      Alert.alert('Fehler', createError.message || 'Training konnte nicht angelegt werden.');
    }
  };

  const deleteTrainingPlan = async (trainingPlanId) => {
    Alert.alert(
      'Training entfernen',
      'Soll dieses Training gelöscht werden? Daten bleiben lokal bis du sie entfernst.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Entfernen',
          style: 'destructive',
          onPress: async () => {
            try {
              await services.trainingPlans.remove.execute(trainingPlanId);
              await fetchTrainingPlans();
              setStatus('Training entfernt. Daten bleiben lokal archiviert.');
            } catch (deleteError) {
              Alert.alert('Fehler', deleteError.message || 'Löschen nicht möglich.');
            }
          },
        },
      ],
      { cancelable: false },
    );
  };

  if (!services) {
    return (
      <View style={styles.container}>
        <SkeletonList rows={4} height={54} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Deine Trainings</Text>
          <Text style={styles.subTitle}>Offline gespeichert · Sofort verfügbar</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton} onPress={() => nav.navigate('Settings')}>
          <Text style={styles.settingsText}>Einstellungen</Text>
        </TouchableOpacity>
      </View>

      {status && <Text style={styles.statusText}>{status}</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {loading ? (
        <SkeletonList rows={4} height={54} />
      ) : trainingPlans.length === 0 ? (
        <EmptyState
          title="Noch keine Trainingspläne"
          description="Lege deinen ersten Plan an, um Übungen zu bündeln und Workouts zu starten."
          actionLabel="Training anlegen"
          onAction={() => setShowInput(true)}
        />
      ) : (
        <FlatList
          data={trainingPlans}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <TouchableOpacity onPress={() => handleTrainingPlanPress(item)} style={styles.itemContent}>
                <Text style={styles.itemText}>{item.name}</Text>
                <Text style={styles.itemSub}>Sofort offline verfügbar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteTrainingPlan(item.id)} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>Entfernen</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: spacing.lg }}
        />
      )}

      {showInput && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Name des Trainings"
            value={newPlanName}
            onChangeText={setNewPlanName}
            placeholderTextColor="#9ca3af"
          />
          <TouchableOpacity style={styles.addButton} onPress={addTrainingPlan}>
            <Text style={styles.buttonText}>Training speichern</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={styles.addButton} onPress={() => setShowInput(!showInput)}>
        <Text style={styles.buttonText}>{showInput ? 'Abbrechen' : 'Training anlegen'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: palette.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  subTitle: {
    ...typography.muted,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.text,
  },
  settingsButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: palette.primarySoft,
    borderRadius: radius.md,
  },
  settingsText: {
    color: palette.primary,
    fontWeight: '600',
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
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    marginVertical: 6,
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
  },
  itemContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  itemText: {
    fontSize: 18,
    fontWeight: '700',
  },
  itemSub: {
    ...typography.muted,
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    alignSelf: 'center',
  },
  deleteButtonText: {
    color: palette.danger,
    fontWeight: '700',
  },
  errorText: {
    color: palette.danger,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  statusText: {
    color: palette.success,
    marginBottom: spacing.sm,
  },
  addButton: {
    marginVertical: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: palette.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default TrainingPlanViewScreen;
