import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { NgrokBackendUrlTunnel } from '../constants';
import { StyleSheet } from 'react-native';

const TrainingPlanScreen = ({ route, navigation }) => {
  const { userId, trainingPlanId, trainingPlanName } = route.params;
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseSets, setNewExerciseSets] = useState('');
  const [showInputs, setShowInputs] = useState(false); // State to toggle inputs

  const exerciseNameInputRef = useRef(null);
  const exerciseSetsInputRef = useRef(null);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${NgrokBackendUrlTunnel}/api/UserExcercise/${userId}/${trainingPlanId}`);
      if (response.ok) {
        const data = await response.json();
        setExercises(data);
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

  useEffect(() => {
    fetchExercises();
  }, [userId, trainingPlanId]);

  const handleAddExercise = async () => {
    if (!newExerciseName.trim() || !newExerciseSets.trim()) {
      Alert.alert('Validation Error', 'Please fill in both fields.');
      return;
    }

    try {
      const response = await fetch(`${NgrokBackendUrlTunnel}/api/UserExcercise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          trainingPlanId,
          excercisename: newExerciseName,
          excercisesets: newExerciseSets,
        }),
      });

      if (response.ok) {
        await fetchExercises();
        setNewExerciseName('');
        setNewExerciseSets('');
        exerciseNameInputRef.current.focus();
      } else {
        const errorText = await response.text();
        Alert.alert('Error', 'Failed to add exercise: ' + errorText);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add exercise: ' + error.message);
    }
  };

  const handleDeleteExercise = async (exerciseId) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this exercise?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const response = await fetch(`${NgrokBackendUrlTunnel}/api/UserExcercise/${userId}/${exerciseId}/${trainingPlanId}`, {
                method: 'DELETE',
              });

              if (response.ok) {
                await fetchExercises();
              } else {
                const errorText = await response.text();
                Alert.alert('Error', 'Failed to delete exercise: ' + errorText);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete exercise: ' + error.message);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const navigateToWorkoutScreen = async () => {
    try {
      const response = await fetch(`${NgrokBackendUrlTunnel}/api/UserWorkout/AddStartedTraining`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainingPlanId: trainingPlanId,
          userId: userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start training');
      }

      const data = await response.json();
      const startedTrainingId = data.startedTrainingId;

      navigation.navigate('WorkoutScreen', {
        userId: userId,
        trainingPlanId: trainingPlanId,
        startedTrainingId: startedTrainingId,
      });
    } catch (error) {
      console.error('Error starting training:', error);
    }
  };

  const navigateToPastWorkoutScreen = () => {
    navigation.navigate('PastWorkoutScreen', { userId, trainingPlanId });
  };


  const renderItem = ({ item }) => (
    <View style={styles.exerciseItem}>
      <TouchableOpacity
      onPress={()=> navigation.navigate('PastExcercisesScreen',{
        userId: userId,
        excerciseid: item.excerciseid,
        excercisename: item.excercisename
      })}>
      <Text style={styles.exerciseName}>{item.excercisename} x {item.excercisesets}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteExercise(item.excerciseid)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 })}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.header}>{trainingPlanName}</Text>
        <TouchableOpacity style={styles.pastWorkoutButton} onPress={navigateToPastWorkoutScreen}>
          <Text style={styles.pastWorkoutButtonText}>View Past Workouts</Text>
        </TouchableOpacity>
      </View>

      {/* FlatList for displaying exercises */}
      {exercises.length === 0 && !error ? (
        <Text>No exercises added yet. You can add new exercises below.</Text>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.excerciseid.toString()}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* Input fields for adding exercises, only show when `showInputs` is true */}
      {showInputs && (
        <View style={styles.inputContainer}>
          <TextInput
            ref={exerciseNameInputRef}
            style={styles.input}
            placeholder="New Exercise Name"
            value={newExerciseName}
            onChangeText={setNewExerciseName}
          />
          <TextInput
            ref={exerciseSetsInputRef}
            style={styles.input}
            placeholder="Number of Sets"
            value={newExerciseSets}
            onChangeText={setNewExerciseSets}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddExercise}>
            <Text style={styles.buttonText}>Add Exercise</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Button to toggle input fields */}
      <TouchableOpacity style={showInputs ? styles.cancelButton : styles.toggleButton} onPress={() => setShowInputs(prev => !prev)}>
        <Text style={styles.buttonText}>{showInputs ? 'Cancel' : 'Add New Exercise'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.startWorkoutButton}
        onPress={navigateToWorkoutScreen}
      >
        <Text style={styles.buttonText}>Start Workout</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

// Define your styles here
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'blue',
  },
  pastWorkoutButton: {
    backgroundColor: '#32CD32',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastWorkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleButton: {
    marginTop: 10,
    marginBottom: 20,
    paddingVertical: 10,
    backgroundColor: '#1E90FF',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    marginTop: 10,
    marginBottom: 20,
    paddingVertical: 10,
    backgroundColor: 'red', // Red background for cancel button
    borderRadius: 8,
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderRadius: 10,
  },
  exerciseItem: {
    padding: 10,
    marginVertical: 8,
    marginHorizontal: 16,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF6347',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  startWorkoutButton: {
    marginTop: 20,
    paddingVertical: 10,
    backgroundColor: '#1E90FF',
    borderRadius: 8,
    alignItems: 'center',
  },
  addButton: {
    marginVertical: 10,
    paddingVertical: 10,
    backgroundColor: '#1E90FF',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default TrainingPlanScreen;
