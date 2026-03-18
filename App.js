import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, View, ActivityIndicator } from 'react-native';

import AuthProvider, { useAuth } from './src/hooks/useAuth';
import { SessionProvider } from './src/context/sessionContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AuthNavigator from './src/navigation/authNavigator';
import MainNavigator from './src/navigation/mainNavigator';

// ── Root navigator that reads auth state
function RootNavigator() {
  const { user, userData, loading } = useAuth();
  const { C } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.blue} />
      </View>
    );
  }

  return user ? (
    <MainNavigator user={user} userData={userData} />
  ) : (
    <AuthNavigator />
  );
}

// ── Root App
export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider initialDark={false}>
        <AuthProvider>
          <NavigationContainer>
            <SessionProvider>
              <RootNavigator />
            </SessionProvider>
          </NavigationContainer>
        </AuthProvider>
        <ThemedStatusBar />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// ── StatusBar switches style with dark mode
function ThemedStatusBar() {
  const { dark } = useTheme();
  return <StatusBar style={dark ? 'light' : 'dark'} />;
}