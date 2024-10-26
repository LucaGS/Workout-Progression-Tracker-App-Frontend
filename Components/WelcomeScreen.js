import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import 'react-native-gesture-handler'; // Add this import
const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Logo oder Bild */}
      <Image 
        source={{ uri: 'https://wallpaperaccess.com/full/86289.jpg' }} 
        style={styles.logo} 
      />

      {/* Begrüßungstext */}
      <Text style={styles.title}>Willkommen!</Text>
      <Text style={styles.subtitle}>
        Beginnen Sie Ihre Reise mit uns. Melden Sie sich an oder erstellen Sie ein Konto, um fortzufahren.
      </Text>

      {/* Schaltflächen */}
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.buttonOutline]} 
        onPress={() => navigation.navigate('Signup')}
      >
        <Text style={styles.buttonOutlineText}>Konto erstellen</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 30,
    borderRadius: 75,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginHorizontal: 30,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 30,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonOutline: {
    backgroundColor: '#fff',
    borderColor: '#007bff',
    borderWidth: 2,
  },
  buttonOutlineText: {
    color: '#007bff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default WelcomeScreen;
