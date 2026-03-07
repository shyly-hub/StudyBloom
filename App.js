import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import { SessionProvider } from './src/context/sessionContext';
import AuthProvider, { useAuth } from './src/hooks/useAuth';
import AuthNavigator from './src/navigation/authNavigator';
import MainNavigator from './src/navigation/mainNavigator';
import C from './src/themes';

function AppNavigator() {
  const { user, loading, logout, userData } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={C.blue || '#007AFF'} />
      </View>
    );
  }

  return (
  <NavigationContainer>
    <AuthNavigator /> 
  </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" /> 
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0f', 
  },
});