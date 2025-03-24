import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { backendUrl } from '../constants';
import LogoutButton from './LogoutButton';
import 'react-native-gesture-handler'; // Add this import
const TrainingPlanViewScreen = ({ route, navigation }) => {
    const { userId: routeUserId } = route.params; 
    const [userId, setUserId] = useState(routeUserId || null);
    const [trainingPlans, setTrainingPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newPlanName, setNewPlanName] = useState('');
    const [showInput, setShowInput] = useState(false);

    useEffect(() => {
        const fetchUserId = async () => {
            if (!routeUserId) { // Überprüfe nur, ob routeUserId gesetzt ist
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
    }, [routeUserId]); // Trigger nur bei Änderung von routeUserId
    

    const fetchTrainingPlans = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const response = await fetch(`${backendUrl}/api/trainingplan/user/${userId}`);
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
    }, [userId]);

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
            const response = await fetch(`${backendUrl}/api/UserTrainingPlan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, trainingPlanName: newPlanName }),
            });

            if (response.ok) {
                await fetchTrainingPlans();
                setNewPlanName('');
                setShowInput(false);
            } else {
                const errorText = await response.text();
                console.log(response);
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
                            const response = await fetch(`${backendUrl}/api/UserTrainingPlan/${userId}/${trainingPlanId}`, {
                                method: 'DELETE',
                            });

                            if (response.ok) {
                                await fetchTrainingPlans();
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
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <LogoutButton />
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Training Plans</Text>
                <LogoutButton />
            </View>

            <FlatList
                data={trainingPlans}
                keyExtractor={(item) => item.trainingPlanId.toString()}
                renderItem={({ item }) => (
                    <View style={styles.item}>
                        <TouchableOpacity onPress={() => handleTrainingPlanPress(item)} style={styles.itemContent}>
                            <Text style={styles.itemText}>{item.trainingPlanName}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteTrainingPlan(item.trainingPlanId)}>
                            <Text style={styles.deleteButton}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 20 }}
            />

            {showInput && (
                <>
                    <TextInput
                        style={styles.input}
                        placeholder="New Training Plan Name"
                        value={newPlanName}
                        onChangeText={setNewPlanName}
                        placeholderTextColor="#B0B0B0"
                    />
                    <TouchableOpacity style={styles.addButton} onPress={addTrainingPlan}>
                        <Text style={styles.buttonText}>Add Training Plan</Text>
                    </TouchableOpacity>
                </>
            )}

            <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowInput(!showInput)}
            >
                <Text style={styles.buttonText}>{showInput ? 'Cancel' : 'Add Training Plan'}</Text>
            </TouchableOpacity>
        </View>
    );
};

// Updated styles to match TrainingPlanScreen
    const styles = StyleSheet.create({
        container: {
            flex: 1,
            padding: 20,
            backgroundColor: '#f9f9f9',
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#D0D0D0',
        },
        headerTitle: {
            fontSize: 32,
            fontWeight: 'bold',
            color: 'blue',
        },
        loadingText: {
            fontSize: 18,
            textAlign: 'center',
            color: '#007BFF',
        },
        input: {
            height: 50,
            borderColor: '#ccc',
            borderWidth: 1,
            paddingHorizontal: 10,
            marginBottom: 10,
            borderRadius: 10,
        },
        item: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            padding: 15,
            borderBottomWidth: 1,
            borderBottomColor: '#D0D0D0',
            marginVertical: 5,
            backgroundColor: '#fff',
            borderRadius: 8,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 5,
            elevation: 1,
        },
        itemContent: {
            flex: 1,
            justifyContent: 'center', // Center the content vertically
        },
        itemText: {
            fontSize: 18,
            fontWeight: '500',
            textAlign: 'center', // Center the text horizontally
        },
        deleteButton: {
            color: 'white',
            backgroundColor: '#FF6347', // Tomato color for Delete button
            paddingVertical: 8,
            paddingHorizontal: 15,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 1,
            },
            shadowOpacity: 0.3,
            shadowRadius: 2,
            elevation: 2,
        },
        errorText: {
            color: 'red',
            textAlign: 'center',
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
    

export default TrainingPlanViewScreen;
