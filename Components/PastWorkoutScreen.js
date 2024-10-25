import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { NgrokBackendUrlTunnel } from '../constants';

const PastWorkoutScreen = ({ route }) => {
  const { userId, trainingPlanId } = route.params;
  const [pastWorkouts, setPastWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch past workout data
  const fetchPastWorkouts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${NgrokBackendUrlTunnel}/api/StartedTraining/StartedTraining/${userId}/${trainingPlanId}`);
      if (response.ok) {
        const data = await response.json();
        setPastWorkouts(data);
      } else {
        const errorText = await response.text();
        setError('Error fetching past workouts: ' + errorText);
      }
    } catch (error) {
      setError('Error fetching past workouts: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPastWorkouts();
  }, [userId, trainingPlanId]);

  const formatDate = (dateString) => {
    if (dateString === "0001-01-01T00:00:00") {
      return "No time available";
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const renderItem = ({ item }) => (
    <View style={styles.workoutContainer}>
      <Text style={styles.workoutTitle}>
        {item.trainingPlaName}: {formatDate(item.excercisetime)}
      </Text>

      {item.excercises.length > 0 ? (
        <FlatList
          data={item.excercises}
          keyExtractor={(exercise) => exercise.excerciseid.toString()}
          renderItem={({ item: exercise }) => (
            <View style={styles.exerciseContainer}>
              <Text>{exercise.excercisename}</Text>
              <FlatList
                data={exercise.excerciseSets}
                keyExtractor={(set) => set.startedexcercisesetid.toString()}
                renderItem={({ item: set }) => (
                  <View style={styles.setContainer}>
                    <Text> {set.reps} x  {set.weight} kg</Text>
                  </View>
                )}
              />
            </View>
          )}
        />
      ) : (
        <Text>No exercises recorded for this workout.</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
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

  return (
    <FlatList
      data={pastWorkouts}
      keyExtractor={(workout) => workout.startedTrainingId.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
    />
  );
};

// Define styles
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  listContent: {
    padding: 20,
  },
  workoutContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  exerciseContainer: {
    marginBottom: 10,
    paddingLeft: 20,
  },
  setContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 40,
    paddingTop: 5,
  },
});

export default PastWorkoutScreen;
