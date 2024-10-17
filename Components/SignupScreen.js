import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { NgrokBackendUrlTunnel } from '../constants';
const SignupScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userId, setUserId] = useState('');
  const [userExists, setUserExists] = useState(false);

  const handleSignup = () => {
    if (password === confirmPassword) {
      console.log('Username:', username);
      console.log('Password:', password);
      fetch(`${NgrokBackendUrlTunnel}/api/AppUser/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      })
        .then((response) => {
          if (response.status === 409) {
            // User already exists
            setUserExists(true);
            return;
          }
          return response.json(); // Convert the response to JSON if not a conflict
        })
        .then((data) => {
          if (data) {
            console.log('Success:', data);
            setUserId(data.userId); // Set the userId state
            console.log('User ID:', data.userId); // Log userId directly from data
            
            // Store userId in AsyncStorage
            AsyncStorage.setItem('userId', data.userId.toString())
              .then(() => {
                console.log('User ID saved to AsyncStorage:', data.userId);
                navigation.navigate('DefaultScreenAfterOpening');
              })
              .catch((error) => {
                console.error('Error saving user ID to AsyncStorage:', error);
              });
            
            setUserExists(false); // Reset userExists on success
          }
        })
        .catch((error) => {
          console.error('Error:', error);
          setUserExists(true);
        });
    } else {
      console.log('Passwörter stimmen nicht überein');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrieren</Text>
      {userExists && (
        <Text style={styles.errorText}>Benutzer existiert bereits</Text> // Show error message in red
      )}
      <TextInput
        style={styles.input}
        placeholder="Benutzername"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Passwort"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Passwort bestätigen"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>Registrieren</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.linkContainer}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.link}>Bereits ein Konto? Anmelden</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#343a40',
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    paddingHorizontal: 100,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  linkContainer: {
    marginTop: 20,
  },
  link: {
    color: '#007bff',
    fontSize: 16,
  },
  errorText: {
    color: 'red', // Style for the error message
    marginBottom: 10, // Add some margin for spacing
  },
});

export default SignupScreen;
