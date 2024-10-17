import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './Components/LoginScreen';
import SignupScreen from './Components/SignupScreen';
import WelcomeScreen from './Components/WelcomeScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View,Text } from 'react-native';
import TrainingPlanScreen from './Components/TrainingPlanScreen';
import TrainingPlanViewScreen from './Components/TrainingPlanViewScreen';



const App = () => {
  const Stack = createStackNavigator();
  const [initialRoute, setInitialRoute] = useState('Welcome');
  const [loading, setLoading] = useState(true); // Add loading state
  const [GlobalUserId,setGlobalUserId] = useState(null)
  useEffect(() => {
    const checkUser = async () => {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        setGlobalUserId(userId);
        setInitialRoute('TrainingPlanViewScreen');
      }
      setLoading(false); // Set loading to false after check
    };

    checkUser();
  }, []);

  if (loading) {
    // You could return a loading indicator or splash screen here
    return <View><Text>Loading...</Text></View>; // Placeholder loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name='TrainingPlanScreen' component={TrainingPlanScreen}></Stack.Screen>
        <Stack.Screen 
                    name="TrainingPlanViewScreen" 
                    component={TrainingPlanViewScreen} 
                    options={{ headerShown: true }} 
                    initialParams={{ GlobalUserId }} // Pass userId directly
                />
      </Stack.Navigator>
    </NavigationContainer>
  );
};


export default App;
