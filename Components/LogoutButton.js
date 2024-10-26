// LogoutButton.js
import React from 'react';
import { Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import 'react-native-gesture-handler'; // Add this import
const LogoutButton = () => {
  const navigation = useNavigation();

  const handleLogout = async () => {
    // Clear AsyncStorage
    await AsyncStorage.removeItem('userId');
    
    // Reset navigation to Welcome screen and clear the stack
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  return <Button title="Logout" onPress={handleLogout} />;
};

export default LogoutButton;
