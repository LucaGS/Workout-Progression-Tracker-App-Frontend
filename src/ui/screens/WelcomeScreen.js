import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import 'react-native-gesture-handler';
import { palette, spacing, radius, typography } from '../theme';

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Image source={{ uri: 'https://wallpaperaccess.com/full/86289.jpg' }} style={styles.logo} />
      <Text style={styles.title}>Willkommen!</Text>
      <Text style={styles.subtitle}>Starte sofort offline. Trainingspläne bleiben auf diesem Gerät.</Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('TrainingPlanViewScreen')}>
        <Text style={styles.buttonText}>Loslegen</Text>
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
    backgroundColor: palette.primary,
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: radius.lg,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default WelcomeScreen;
