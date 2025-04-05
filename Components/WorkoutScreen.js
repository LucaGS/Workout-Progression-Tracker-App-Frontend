import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import LogoutButton from './LogoutButton';
import ExerciseItem from './ExerciseItem';
import { backendUrl} from '../constants'; // Ensure you have Ngrok URL configured
import 'react-native-gesture-handler'; // Add this import
const WorkoutScreen = ({ route }) => {
  const { userId, trainingplanid, startedTrainingId } = route.params;
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
         const response = await fetch(`${backendUrl}/api/excercise/${userId}/${trainingplanid}`);
        if (response.ok) {
          const data = await response.json();
          setExercises(createExerciseList(data));
        } else {
          const errorText = await response.text();
          setError('Error fetching exercises: ' + errorText);
        }
      } catch (error) {
        setError('Error fetching exercises: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [userId, trainingplanid]);

  // Create an array of exercises based on the number of sets (max 10)
  const createExerciseList = (exercises) => {
    return exercises.flatMap((exercise) =>
      Array.from({ length: Math.min(exercise.sets, 10) }, (_, index) => ({
        ...exercise,
        setNumber: index + 1,
        weight: '',
        reps: '',
      }))
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading exercises...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Workout for Training Plan ID: {trainingplanid}</Text>
      <Text>Your training ID for this workout is {startedTrainingId}</Text>
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
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  errorText: {
    color: 'red',
  },
});

export default WorkoutScreen;
