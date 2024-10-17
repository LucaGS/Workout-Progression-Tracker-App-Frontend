import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, Button, Alert } from 'react-native';
import LogoutButton from './LogoutButton';
import { NgrokBackendUrlTunnel } from '../constants'; // Ensure you have Ngrok URL configured

const WorkoutScreen = ({ route }) => {
  const { userId, trainingPlanId, startedTrainingId } = route.params;
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await fetch(`${NgrokBackendUrlTunnel}/api/UserExcercise/${userId}/${trainingPlanId}`);
        if (response.ok) {
          const data = await response.json();
          setExercises(createExerciseList(data)); // Set exercises data with set creation
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
  }, [userId, trainingPlanId]);

  // Create a new array of exercises based on the number of sets (max 10)
  const createExerciseList = (exercises) => {
    return exercises.flatMap((exercise) =>
      Array.from({ length: Math.min(exercise.excercisesets, 10) }, (_, index) => ({
        ...exercise,
        setNumber: index + 1, // Adding set number for display if needed
        weight: '', // Initialize weight input
        reps: '', // Initialize reps input
      }))
    );
  };

  const handleInputChange = (excerciseid, setNumber, field, value) => {
    setExercises((prevExercises) =>
      prevExercises.map((exercise) => {
        // Check if the current exercise matches the exercise ID and set number
        if (exercise.excerciseid === excerciseid && exercise.setNumber === setNumber) {
          return { ...exercise, [field]: value }; // Update weight or reps based on field
        }
        return exercise;
      })
    );
  };

  const handleSubmit = async (item) => {
    const { excerciseid, setNumber, weight } = item; // Destructure item for API call

    // Construct the payload for the API call
    const payload = {
      startedtrainingid: startedTrainingId, // Use the provided started training ID
      userid: userId, // Use the provided user ID
      trainingplanid: trainingPlanId, // Use the provided training plan ID
      set: setNumber, // Set number
      weight: parseFloat(weight) || 0, // Parse weight to number or default to 0
    };

    try {
      const response = await fetch(`${NgrokBackendUrlTunnel}/api/UserWorkout/AddStartedExcerciseSet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        Alert.alert('Error', 'Failed to submit exercise set: ' + errorText);
        return;
      }

      // Remove the submitted exercise set from the list
      setExercises((prevExercises) => 
        prevExercises.filter((exercise) => exercise.setNumber !== item.setNumber || exercise.excerciseid !== item.excerciseid)
      );

      // Remove the success message
      // Alert.alert('Success', 'Exercise set submitted successfully!'); // This line is removed
    } catch (error) {
      Alert.alert('Error', 'Failed to submit exercise set: ' + error.message);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.exerciseItem}>
      <Text style={styles.exerciseName}>
        {item.excercisename} (Set {item.setNumber})
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Weight (kg)"
        keyboardType="numeric"
        value={item.weight} // Controlled input
        onChangeText={(value) => handleInputChange(item.excerciseid, item.setNumber, 'weight', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Reps"
        keyboardType="numeric"
        value={item.reps} // Controlled input
        onChangeText={(value) => handleInputChange(item.excerciseid, item.setNumber, 'reps', value)}
      />
      <Button title="Submit" onPress={() => handleSubmit(item)} />
    </View>
  );

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
      <LogoutButton />
      <Text style={styles.header}>Workout for Training Plan ID: {trainingPlanId}</Text>
      <Text>Your training ID for this workout is {startedTrainingId}</Text>
      <FlatList
        data={exercises}
        keyExtractor={(item) => `${item.excerciseid}-${item.setNumber}`} // Unique key for each set
        renderItem={renderItem}
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
  exerciseItem: {
    padding: 10,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginTop: 8,
  },
  errorText: {
    color: 'red',
  },
});

export default WorkoutScreen;
