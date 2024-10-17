import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NgrokBackendUrlTunnel } from '../constants';
const TrainingPlanViewScreen = ({ route, navigation }) => {
    const { userId: routeUserId } = route.params; 
    const [userId, setUserId] = useState(routeUserId || null);
    const [trainingPlans, setTrainingPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newPlanName, setNewPlanName] = useState('');

    // Fetch userId from AsyncStorage if not provided
    useEffect(() => {
        const fetchUserId = async () => {
            if (!userId) {
                try {
                    const storedUserId = await AsyncStorage.getItem('userId');
                    if (storedUserId) {
                        setUserId(storedUserId);
                    } else {
                        Alert.alert('Error', 'User ID not found.');
                    }
                } catch (error) {
                    Alert.alert('Error', 'Failed to retrieve user ID: ' + error.message);
                }
            }
        };

        fetchUserId();
    }, [userId]);

    // Fetch training plans function
    const fetchTrainingPlans = async () => {
        if (!userId) return; // Ensure userId is available
        setLoading(true);
        try {
            const response = await fetch(`${NgrokBackendUrlTunnel}/api/UserTrainingPlan/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setTrainingPlans(data);
            } else {
                const errorText = await response.text();
                setError('Error fetching training plans: ' + errorText);
            }
        } catch (error) {
            setError('Error fetching training plans: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrainingPlans();
    }, [userId]); // Fetch plans when userId changes

    const handleTrainingPlanPress = (trainingPlan) => {
        navigation.navigate('TrainingPlanScreen', {
            trainingPlanId: trainingPlan.trainingPlanId,
            trainingPlanName: trainingPlan.trainingPlanName,
            userId: userId,
        });
    };

    const addTrainingPlan = async () => {
        if (!newPlanName.trim()) {
            Alert.alert('Validation Error', 'Training plan name cannot be empty.');
            return;
        }

        try {
            const response = await fetch(`${NgrokBackendUrlTunnel}/api/UserTrainingPlan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, trainingPlanName: newPlanName }),
            });

            if (response.ok) {
                await fetchTrainingPlans();
                setNewPlanName('');
            } else {
                const errorText = await response.text();
                Alert.alert('Error', 'Failed to add training plan: ' + errorText);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to add training plan: ' + error.message);
        }
    };

    const deleteTrainingPlan = async (trainingPlanId) => {
        Alert.alert(
            'Confirm Deletion',
            'Are you sure you want to delete this training plan?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    onPress: async () => {
                        try {
                            const response = await fetch(`${NgrokBackendUrlTunnel}/api/UserTrainingPlan/${userId}/${trainingPlanId}`, {
                                method: 'DELETE',
                            });

                            if (response.ok) {
                                await fetchTrainingPlans(); // Refresh the list
                            } else {
                                const errorText = await response.text();
                                Alert.alert('Error', 'Failed to delete training plan: ' + errorText);
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete training plan: ' + error.message);
                        }
                    },
                },
            ],
            { cancelable: false }
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
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
            <FlatList
                data={trainingPlans}
                keyExtractor={(item) => item.trainingPlanId.toString()}
                renderItem={({ item }) => (
                    <View style={styles.item}>
                        <TouchableOpacity onPress={() => handleTrainingPlanPress(item)} style={styles.itemContent}>
                            <Text style={styles.itemText}>ID: {item.trainingPlanId}</Text>
                            <Text style={styles.itemText}>Name: {item.trainingPlanName}</Text>
                        </TouchableOpacity>
                        <Button title="Delete" onPress={() => deleteTrainingPlan(item.trainingPlanId)} color="red" />
                    </View>
                )}
            />

            <TextInput
                style={styles.input}
                placeholder="New Training Plan Name"
                value={newPlanName}
                onChangeText={setNewPlanName}
            />
            <Button title="Add Training Plan" onPress={addTrainingPlan} />
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
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        marginVertical: 5,
        backgroundColor: '#fff',
    },
    itemContent: {
        flex: 1,
    },
    itemText: {
        fontSize: 16,
    },
    errorText: {
        color: 'red',
    },
});

export default TrainingPlanViewScreen;
