import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Button, Alert } from 'react-native';
import { NgrokBackendUrlTunnel } from '../constants';
import LogoutButton from './LogoutButton';
const TrainingPlanScreen = ({ route, navigation }) => {
    const { userId, trainingPlanId, trainingPlanName } = route.params;
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newExerciseName, setNewExerciseName] = useState('');
    const [newExerciseSets, setNewExerciseSets] = useState('');

    // Fetch exercises function
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
                await fetchExercises(); // Refresh the exercises list
                setNewExerciseName(''); // Clear input field
                setNewExerciseSets(''); // Clear input field
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
                                await fetchExercises(); // Refresh the exercises list
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

    const renderItem = ({ item }) => (
        <View style={styles.exerciseItem}>
            <Text style={styles.exerciseName}>{item.excercisename}</Text>
            <Text>Sets: {item.excercisesets}</Text>
            <View style={styles.buttonContainer}>
                <Button title="Delete" onPress={() => handleDeleteExercise(item.excerciseid)} color="red" />
            </View>
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
        <View style={styles.container}>
            <LogoutButton></LogoutButton>
            <Text style={styles.header}>Welcome to your {trainingPlanName} Plan</Text>
            {exercises.length === 0 && !error ? ( // Check if there are no exercises and no error
                <Text>No exercises added yet. You can add new exercises below.</Text>
            ) : (
                <FlatList
                    data={exercises}
                    keyExtractor={(item) => item.excerciseid.toString()}
                    renderItem={renderItem}
                />
            )}

            <TextInput
                style={styles.input}
                placeholder="New Exercise Name"
                value={newExerciseName}
                onChangeText={setNewExerciseName}
            />
            <TextInput
                style={styles.input}
                placeholder="Number of Sets"
                value={newExerciseSets}
                onChangeText={setNewExerciseSets}
                keyboardType="numeric" // Assuming sets are numeric
            />
            <Button title="Add Exercise" onPress={handleAddExercise} />
        </View>
    );
};

// Define your styles here
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
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        paddingHorizontal: 10,
        marginBottom: 10,
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
        flexDirection: 'row', // Align items in a row
        justifyContent: 'space-between', // Space between text and button
        alignItems: 'center', // Center items vertically
    },
    exerciseName: {
        fontSize: 18,
        fontWeight: '500',
        flex: 1, // Allow the exercise name to take up available space
    },
    buttonContainer: {
        marginLeft: 10, // Space between text and button
        width: 70, // Adjust width for button
    },
    errorText: {
        color: 'red',
    },
});

export default TrainingPlanScreen;
