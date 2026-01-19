import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import 'react-native-gesture-handler';
import { palette, radius } from '../theme';

const LoginScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Offline-App</Text>
      <Text style={styles.subtitle}>Kein Login nötig. Deine Daten bleiben auf diesem Gerät.</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('TrainingPlanViewScreen')}>
        <Text style={styles.buttonText}>Weiter zu Trainings</Text>
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
    marginBottom: 20,
    color: '#343a40',
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginHorizontal: 30,
    marginBottom: 30,
  },
  button: {
    backgroundColor: palette.primary,
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: radius.lg,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default LoginScreen;
