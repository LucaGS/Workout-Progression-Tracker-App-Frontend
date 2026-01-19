import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import 'react-native-gesture-handler';
import { formatDate } from '../../utils/dates';
import { useServices } from '../../app/useServices';
import EmptyState from '../components/EmptyState';
import { palette, spacing, radius, typography } from '../theme';

const PastExcercisesScreen = ({ route }) => {
  const { excerciseid, excercisename } = route.params;
  const [pastExercises, setPastExercises] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const services = useServices();

  useEffect(() => {
    const fetchPastExercises = async () => {
      if (!services) return;
      const history = await services.workouts.historyByExercise.execute({ exerciseId: excerciseid });
      setPastExercises(history);
    };

    fetchPastExercises();
  }, [excerciseid, services]);

  if (!services) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Lade lokale Daten…</Text>
      </View>
    );
  }

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={styles.tableHeaderText}>Datum</Text>
      <Text style={styles.tableHeaderText}>Ø Gewicht</Text>
    </View>
  );

  const toggleSets = (index) => {
    setSelectedIndex(selectedIndex === index ? null : index);
  };

  const renderSets = (sets) => (
    <View style={styles.setsContainer}>
      {sets.map((set, idx) => (
        <View key={idx} style={styles.setRow}>
          <Text style={styles.setText}>{set.set}.</Text>
          <View style={styles.setDetails}>
            <Text style={styles.setWeight}>
              {set.reps} x {set.weight} kg
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>{excercisename}</Text>
      {renderTableHeader()}
      {pastExercises.length === 0 ? (
        <EmptyState
          title="Noch kein Verlauf"
          description="Sobald du Sätze protokollierst, erscheint der Verlauf hier."
          actionLabel="Zurück"
          onAction={() => {}}
        />
      ) : (
        <FlatList
          data={pastExercises}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View>
              <TouchableOpacity
                onPress={() => toggleSets(index)}
                style={[styles.tableRow, selectedIndex === index && styles.selectedRow]}
              >
                <Text style={styles.tableCell}>{formatDate(item.date)}</Text>
                <Text style={styles.tableCell}>{item.avg}</Text>
              </TouchableOpacity>
              {selectedIndex === index && renderSets(item.sets)}
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#e8f0fe',
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#3b3b3b',
    marginBottom: 20,
    textAlign: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#bbb',
    paddingVertical: 10,
    backgroundColor: '#cce7ff',
    borderRadius: 8,
    marginBottom: 10,
  },
  tableHeaderText: {
    flex: 1,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    fontSize: 18,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedRow: {
    backgroundColor: '#d4edda',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    color: '#3c3c3c',
    fontSize: 16,
  },
  setsContainer: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  setText: {
    fontSize: 16,
    color: '#555',
    marginRight: 10,
  },
  setDetails: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  setWeight: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 5,
  },
  muted: {
    ...typography.muted,
  },
});

export default PastExcercisesScreen;
