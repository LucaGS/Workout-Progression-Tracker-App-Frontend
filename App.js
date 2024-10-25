import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './Components/LoginScreen';
import SignupScreen from './Components/SignupScreen';
import WelcomeScreen from './Components/WelcomeScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text } from 'react-native';
import TrainingPlanScreen from './Components/TrainingPlanScreen';
import TrainingPlanViewScreen from './Components/TrainingPlanViewScreen';
import WorkoutScreen from './Components/WorkoutScreen';
import PastWorkoutScreen from './Components/PastWorkoutScreen'; // Import the PastWorkoutScreen
import PastExcercisesScreen from './Components/PastExcerciseScreen';
const App = () => {
  const Stack = createStackNavigator();
  const [initialRoute, setInitialRoute] = useState('Welcome');
  const [loading, setLoading] = useState(true);
  const [GlobalUserId, setGlobalUserId] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        setGlobalUserId(userId);
        setInitialRoute('TrainingPlanViewScreen');
      }
      setLoading(false); 
    };

    checkUser();
  }, []);

  if (loading) {
    return <View><Text>Loading...</Text></View>;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen 
          name="Welcome" 
          component={WelcomeScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ title: 'Login' }} 
        />
        <Stack.Screen 
          name="Signup" 
          component={SignupScreen} 
          options={{ title: 'Signup' }} 
        />
        <Stack.Screen 
          name="TrainingPlanScreen" 
          component={TrainingPlanScreen} 
          options={{ title: 'Training Plan' }} 
        />
        <Stack.Screen 
          name="TrainingPlanViewScreen" 
          component={TrainingPlanViewScreen} 
          options={{ title: 'Your Training Plans' }} 
          initialParams={{ GlobalUserId }} 
        />
        <Stack.Screen 
          name="WorkoutScreen" 
          component={WorkoutScreen} 
          options={{ title: 'Workout' }} 
        />
        <Stack.Screen 
          name="PastWorkoutScreen" 
          component={PastWorkoutScreen} // Add the PastWorkoutScreen
          options={{ title: 'Past Workouts' }} // Set header title for PastWorkoutScreen
        />
        <Stack.Screen
        name='PastExcercisesScreen'
        component={PastExcercisesScreen}>
        
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
