import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NgrokBackendUrlTunnel } from '../constants';
import 'react-native-gesture-handler'; 

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false); 

  const handleLogin = () => {
    console.log('Username:', username);
    console.log('Password:', password);
    fetch(`${NgrokBackendUrlTunnel}/api/AppUser/login`, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.userId) {
          console.log('Success:', data);
          AsyncStorage.setItem('userId', data.userId.toString())
            .then(() => {
              console.log('User ID saved to AsyncStorage:', data.userId);
              navigation.reset({
                index: 0,
                routes: [{ name: 'TrainingPlanViewScreen' }],
              });
            })
            .catch((error) => {
              console.error('Error saving user ID to AsyncStorage:', error);
            });
        } else {
          setLoginError(true); 
          console.log('No user ID returned from login.');
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        setLoginError(true); 
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Anmelden</Text>
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

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Anmelden</Text>
      </TouchableOpacity>

      {loginError && ( 
        <Text style={styles.errorText}>
          Ungültiger Benutzername oder Passwort.
        </Text>
      )}

      <TouchableOpacity
        style={styles.linkContainer}
        onPress={() => navigation.navigate('Signup')}
      >
        <Text style={styles.link}>Noch kein Konto? Registrieren</Text>
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
    backgroundColor: '#007bff',
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
    color: 'red',
    marginTop: 10,
  },
});

export default LoginScreen;