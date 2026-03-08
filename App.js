import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { SessionProvider } from './src/context/sessionContext';
import AuthProvider from './src/hooks/useAuth';

import AuthNavigator from './src/navigation/authNavigator';
import MainNavigator from './src/navigation/mainNavigator';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>

        {/* LOGIN / REGISTER FIRST */}
        <Stack.Screen name="Auth" component={AuthNavigator} />

        {/* AFTER LOGIN */}
        <Stack.Screen name="Main" component={MainNavigator} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <SessionProvider>
          <RootNavigator />
        </SessionProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}