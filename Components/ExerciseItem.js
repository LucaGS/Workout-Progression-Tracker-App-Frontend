import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { backendUrl } from '../constants'; // Ensure you have Ngrok URL configured
import { Checkbox } from 'react-native-paper';
import 'react-native-gesture-handler'; // Add this import

const ExerciseItem = ({ item, userid, excerciseid, trainingplanid,startedtrainingid}) => {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [isInputActive, setIsInputActive] = useState(false); // To toggle input fields
  const [isChecked, setIsChecked] = useState(false); // To track if the checkbox is checked
//'userid','trainingplanid', 'excerciseid', 'startedtrainingplanid', 'set', 'reps', 'weight'
  const handleSubmit = async () => {
    const payload = {
      userid: userid,
      trainingplanid: trainingplanid,
      excerciseid: excerciseid,
      startedtrainingplanid: startedtrainingid,
      set: item.setNumber,
      reps: parseInt(reps) || 0,
      weight: weight ? parseFloat(weight) : 0, // Convert weight to float
    
    };
    console.log("ExcerciseID");
    console.log(payload);
    try {
      const response = await fetch(`${backendUrl}/api/startedexcercise/`, {
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

      Alert.alert('Success', `Exercise set ${item.setNumber} submitted! with ExcerciseId ${item.excerciseid}`);
      setIsInputActive(false); // Hide the inputs after successful submission
      setIsChecked(true); // Mark the checkbox as done
    } catch (error) {
      Alert.alert('Error', 'Failed to submit exercise set: ' + error.message);
    }
  };

  // Toggle the visibility of input fields
  const toggleInputFields = () => {
    setIsInputActive((prev) => !prev);
  };

  return (
    <View style={styles.exerciseItem}>
      <View style={styles.row}>
        <TouchableOpacity onPress={toggleInputFields} style={styles.exerciseButton}>
          <Text style={styles.exerciseName}>
            {item.name} (Set {item.setNumber})
          </Text>
        </TouchableOpacity>
        <Checkbox
          status={isChecked ? 'checked' : 'unchecked'}
          onPress={() => setIsChecked(!isChecked)}
          disabled={true} // Disable the checkbox because it's controlled by submission
          color="#007BFF" // Apple-style accent color
        />
      </View>

      {isInputActive && (
        <>
          <TextInput
            style={styles.input}
            placeholder="kg( either use your bodyweight(if assisted, bodyweight - assistance weight) or machine weight"
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
            placeholderTextColor="#B0B0B0" // Light grey for placeholder
          />
          <TextInput
            style={styles.input}
            placeholder="Reps"
            keyboardType="numeric"
            value={reps}
            onChangeText={setReps}
            placeholderTextColor="#B0B0B0" // Light grey for placeholder
          />
          <Button title="Submit" onPress={handleSubmit} color="#007BFF" />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  exerciseItem: {
    padding: 16,
    marginVertical: 8,
    backgroundColor: '#F9F9F9', // Light background for a softer look
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseButton: {
    flex: 1,
    padding: 10,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007BFF',
    textDecorationLine: 'underline',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D0D0D0', // Lighter border for inputs
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    backgroundColor: '#FFFFFF', // White background for inputs
    fontSize: 16,
  },
});

export default ExerciseItem;
