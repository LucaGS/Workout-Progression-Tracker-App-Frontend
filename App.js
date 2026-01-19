import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import 'react-native-gesture-handler';
import LoginScreen from './src/ui/screens/LoginScreen';
import SignupScreen from './src/ui/screens/SignupScreen';
import WelcomeScreen from './src/ui/screens/WelcomeScreen';
import TrainingPlanScreen from './src/ui/screens/TrainingPlanScreen';
import TrainingPlanViewScreen from './src/ui/screens/TrainingPlanViewScreen';
import WorkoutScreen from './src/ui/screens/WorkoutScreen';
import PastWorkoutScreen from './src/ui/screens/PastWorkoutScreen';
import PastExcercisesScreen from './src/ui/screens/PastExcerciseScreen';
import SettingsScreen from './src/ui/screens/SettingsScreen';
import { getOrCreateLocalUser } from './src/repositories/usersRepository';
import { getDb } from './src/infrastructure/db/connection';

const App = () => {
  const Stack = createStackNavigator();
  const [initialRoute, setInitialRoute] = useState('Welcome');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      await getDb();
      await getOrCreateLocalUser();
      setInitialRoute('TrainingPlanViewScreen');
      setLoading(false);
    };

    initialize();
  }, []);

  if (loading) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Signup' }} />
        <Stack.Screen name="TrainingPlanScreen" component={TrainingPlanScreen} options={{ title: 'Training Plan' }} />
        <Stack.Screen
          name="TrainingPlanViewScreen"
          component={TrainingPlanViewScreen}
          options={{ title: 'Your Training Plans' }}
        />
        <Stack.Screen name="WorkoutScreen" component={WorkoutScreen} options={{ title: 'Workout' }} />
        <Stack.Screen name="PastWorkoutScreen" component={PastWorkoutScreen} options={{ title: 'Past Workouts' }} />
        <Stack.Screen name="PastExcercisesScreen" component={PastExcercisesScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Einstellungen' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
