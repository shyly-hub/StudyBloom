import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';

import AuthProvider, { useAuth } from './src/hooks/useAuth';
import { SessionProvider }       from './src/context/sessionContext';
import AuthNavigator             from './src/navigation/authNavigator';
import MainNavigator             from './src/navigation/mainNavigator';

// ── Inner app — reads auth state ──────────
function RootNavigator() {
  const { user, userData, loading } = useAuth();

  // Show spinner while Firebase checks login state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4ff' }}>
        <ActivityIndicator size="large" color="#6c8ef5" />
      </View>
    );
  }

  return (
    <SessionProvider userId={user?.uid} initialScore={userData?.score || 50}>
      <NavigationContainer>
        {user
          ? <MainNavigator user={user} userData={userData} />
          : <AuthNavigator />
        }
      </NavigationContainer>
    </SessionProvider>
  );
}

// ── Root — wraps everything in AuthProvider ─
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}