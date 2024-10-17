import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import TrainingPlanScreen from './TrainingPlanScreen';
import TrainingPlanViewScreen from './TrainingPlanViewScreen';
import WelcomeScreen from './WelcomeScreen'
const Stack = createStackNavigator();

const DefaultScreenAfterOpening = ({ route }) => {
    const [initialRoute] = useState('TrainingPlanViewScreen');
    
    // Destructure userId from route.params
    const { userId } = route.params;

    return (
        <NavigationContainer independent={true}>
            <Stack.Navigator initialRouteName={initialRoute}>
                <Stack.Screen 
                    name="TrainingPlanViewScreen" 
                    component={TrainingPlanViewScreen} 
                    options={{ headerShown: true }} 
                    initialParams={{ userId }} // Pass userId directly
                />
                <Stack.Screen name="TrainingPlanScreen" component={TrainingPlanScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
});

export default DefaultScreenAfterOpening;
